import { useDroppable } from '@dnd-kit/core'
import { cn } from '@ilamy/ui/lib/utils'
import type { Dayjs } from '@ilamy/utils/dayjs'
import type React from 'react'
import { useSmartCalendarContext } from '@/features/calendar/hooks/use-smart-calendar-context'
import type { CellInfo } from '@/features/calendar/types'
import { DISABLED_CELL_CLASSNAME } from '@/lib/constants'
import { RuleDialog } from './rule-dialog'
import { useState } from 'react'

interface DroppableCellProps {
	id: string
	type: 'day-cell' | 'time-cell'
	date: Dayjs
	hour?: number
	minute?: number
	resourceId?: string | number
	allDay?: boolean
	children?: React.ReactNode
	className?: string
	style?: React.CSSProperties
	'data-testid'?: string
	disabled?: boolean,
	isRuleResource?: boolean
	onRuleClick?: () => void
}

/**
 * The time span a cell represents. Granularity follows the view: a 15-minute
 * slot (day), a one-hour slot (week), or the whole day (month).
 */
function getCellRange(
	date: Dayjs,
	hour?: number,
	minute?: number
): { start: Dayjs; end: Dayjs } {
	const start = date.hour(hour ?? 0).minute(minute ?? 0)

	if (hour !== undefined && minute !== undefined) {
		return { start, end: start.minute(minute + 15) }
	}
	if (hour !== undefined) {
		return { start, end: start.hour(hour + 1).minute(0) }
	}
	return { start, end: start.hour(23).minute(59) }
}

export function DroppableCell({
	id,
	type,
	date,
	hour,
	minute,
	resourceId,
	allDay,
	children,
	className,
	style,
	'data-testid': dataTestId,
	disabled = false,
	isRuleResource,
	onRuleClick,
}: DroppableCellProps) {
	const {
		onCellClick,
		isCellDisabled,
		getResourceById,
		disableDragAndDrop,
		disableCellClick,
		classesOverride,
		view,
	} = useSmartCalendarContext()
	
	const { start, end } = getCellRange(date, hour, minute)
	// `getResourceById` is only present on resource calendars; regular calendars resolve to undefined.
	const resource = getResourceById?.(resourceId)
	// console.log('DroppableCell resource:', resource, 'id', resourceId) // Debugging log
	const cellInfo: CellInfo = { start, end, resource, allDay, isRuleResource }

	// Disabled by business hours (`disabled` prop) or the consumer's predicate.
	const cellDisabled = disabled || Boolean(isCellDisabled?.(cellInfo))
	const clickBlocked = disableCellClick || cellDisabled 

	const { isOver, setNodeRef } = useDroppable({
		id,
		data: { type, date, hour, minute, resourceId, allDay, isRuleResource },
		disabled: disableDragAndDrop || cellDisabled || isRuleResource,
	})

	const handleCellClick = (e: React.MouseEvent) => {
		e.stopPropagation()
		if (isRuleResource && onRuleClick) {
			// console.log('Aku ke press di rule', resource)
			// console.log('disableDragAndDrop || cellDisabled || isRuleResource', (disableDragAndDrop || cellDisabled || isRuleResource))
			onRuleClick()
			if (cellInfo.resource && resourceId !== undefined) {
				cellInfo.resource.id = resourceId
			}
			console.log('cellInfo', cellInfo)
			onCellClick(cellInfo)
			return
		}
	
		if (clickBlocked) {
			return
		}
		onCellClick(cellInfo)
	}

	const showDropHighlight = isOver && !disableDragAndDrop && !cellDisabled
	const disabledClass = classesOverride?.disabledCell || DISABLED_CELL_CLASSNAME

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: The cell is interactive for event creation
		// biome-ignore lint/a11y/useKeyWithClickEvents: Key events are handled by parent components
		<div
			className={cn(
				'droppable-cell',
				className,
				showDropHighlight && 'bg-accent',
				clickBlocked ? 'cursor-default' : 'cursor-pointer',
				cellDisabled && disabledClass
			)}
			data-disabled={cellDisabled.toString()}
			data-testid={dataTestId}
			data-view={view}
			onClick={handleCellClick}
			ref={setNodeRef}
			style={style}
		>
			{children}
		</div>
	)
}
