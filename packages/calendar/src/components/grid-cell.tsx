import type { CalendarEvent } from '@ilamy/types'
import { DayLabel } from '@ilamy/ui/components/day-label'
import { cn } from '@ilamy/ui/lib/utils'
import type { Dayjs } from '@ilamy/utils/dayjs'
import React, { memo, useMemo } from 'react'
import { useEffectiveBusinessHours } from '@/features/calendar/hooks/use-effective-business-hours'
import { useSmartCalendarContext } from '@/features/calendar/hooks/use-smart-calendar-context'
import { isBusinessHour } from '@/features/calendar/utils/business-hours'
import { DISABLED_CELL_CLASSNAME } from '@/lib/constants'
import { filterEventsForResource } from '@/lib/events/pipeline'
import { isToday } from '@/lib/utils/date-utils'
import { keys } from '@/lib/utils/keys'
import type { SelectedDayEvents } from './all-events-dialog'
import { AllEventDialog } from './all-events-dialog'
import { DroppableCell } from './droppable-cell'

interface GridProps {
	day: Dayjs
	hour?: number // Optional hour for hour-based grids
	minute?: number // Optional minute for more granular time slots
	dayMaxEvents?: number
	className?: string // Optional className for custom styling
	resourceId?: string | number // Optional resource ID for resource-specific day cells
	gridType?: 'day' | 'hour' // Future use for different grid types
	shouldRenderEvents?: boolean // Flag to determine if events should be rendered
	allDay?: boolean // Flag to indicate if this is an all-day cell
	showDayNumber?: boolean // Flag to show or hide the day number
	children?: React.ReactNode
	'data-testid'?: string
	precomputedEvents?: CalendarEvent[]
	/** When true, uses lighter cells (yearly resource view). */
	compact?: boolean
	allEventsDialogRef?: React.RefObject<{
		open: () => void
		close: () => void
		setSelectedDayEvents: (dayEvents: SelectedDayEvents) => void
	} | null>
	suppressEventsDialog?: boolean
}

const NoMemoGridCell: React.FC<GridProps> = ({
	day,
	hour,
	minute,
	className = '',
	resourceId,
	gridType = 'day',
	shouldRenderEvents = true,
	allDay = false,
	precomputedEvents,
	'data-testid': dataTestId,
	showDayNumber = false,
	children,
	compact = false,
	allEventsDialogRef: sharedEventsDialogRef,
	suppressEventsDialog = false,
}) => {
	const localAllEventsDialogRef = React.useRef<{
		open: () => void
		close: () => void
		setSelectedDayEvents: (dayEvents: SelectedDayEvents) => void
	}>(null)
	const allEventsDialogRef = sharedEventsDialogRef ?? localAllEventsDialogRef
	const {
		dayMaxEvents = 0,
		getEventsForDateRange,
		currentDate,
		t,
		eventSpacing,
		eventHeight,
		onCellClick,
		isCellDisabled,
		getResourceById,
		disableCellClick,
		classesOverride,
	} = useSmartCalendarContext()
	const effectiveBusinessHours = useEffectiveBusinessHours(
		compact ? undefined : resourceId
	)

	const todayEvents = useMemo(() => {
		if (!shouldRenderEvents) {
			return []
		}

		// Use pre-computed events from the row level when available
		if (precomputedEvents) {
			return precomputedEvents
		}

		let todayEvents = getEventsForDateRange(
			day.startOf(gridType),
			day.endOf(gridType)
		)

		if (allDay) {
			todayEvents = todayEvents.filter((e) => e.allDay)
		}

		if (resourceId) {
			return filterEventsForResource(todayEvents, resourceId)
		}

		return todayEvents
	}, [
		precomputedEvents,
		day,
		resourceId,
		getEventsForDateRange,
		gridType,
		shouldRenderEvents,
		allDay,
	])

	// Handler for showing all events in a dialog
	const showAllEvents = (day: Dayjs, events: CalendarEvent[]) => {
		allEventsDialogRef.current?.setSelectedDayEvents({
			day,
			events,
		})
		allEventsDialogRef.current?.open()
	}

	const isCurrentMonth = day.month() === currentDate.month()

	const hiddenEventsCount = todayEvents.length - dayMaxEvents
	const hasHiddenEvents = hiddenEventsCount > 0

	const isBusiness = isBusinessHour({
		date: day,
		hour: gridType === 'hour' ? day.hour() : undefined,
		businessHours: effectiveBusinessHours,
	})
	const cellStart = day.hour(hour ?? 0).minute(minute ?? 0)
	const cellEnd =
		hour !== undefined && minute !== undefined
			? cellStart.minute(minute + 15)
			: hour !== undefined
				? cellStart.hour(hour + 1).minute(0)
				: cellStart.hour(23).minute(59)
	const resource = getResourceById?.(resourceId)
	const cellInfo = { start: cellStart, end: cellEnd, resource, allDay }
	const cellDisabled = compact
		? Boolean(isCellDisabled?.(cellInfo))
		: !isBusiness || !isCurrentMonth
	const clickBlocked =
		disableCellClick ||
		cellDisabled ||
		(!compact && (!isBusiness || !isCurrentMonth))
	const disabledClass = classesOverride?.disabledCell || DISABLED_CELL_CLASSNAME

	const handleStaticCellClick = (event: React.MouseEvent<HTMLDivElement>) => {
		event.stopPropagation()
		if (clickBlocked) {
			return
		}
		onCellClick(cellInfo)
	}

	const testId =
		gridType === 'hour'
			? keys.cell.day(day, day.format('HH'), day.format('mm'))
			: keys.cell.day(day)
	const droppableId = keys.droppable.dayCell(day, { allDay, resourceId })
	const useStaticCell = compact

	const cellClassName = cn(
		'cursor-pointer overflow-clip p-1 hover:bg-accent relative border-r border-b min-w-0',
		compact ? 'min-h-8' : 'min-h-[60px]',
		clickBlocked && 'cursor-default',
		cellDisabled && disabledClass,
		className
	)

	const cellContent = (
		<div
			className="flex flex-col h-full w-full"
			data-testid="grid-cell-content"
			style={{ gap: `${eventSpacing}px` }}
		>
			{showDayNumber && (
				<DayLabel
					className="items-start"
					data-testid={keys.dayNumber(day)}
					dayNumber={day.format('D')}
					today={isToday(day)}
				/>
			)}

			{shouldRenderEvents && (
				<>
					{/* Render placeholders for events that occur today so that the cell height is according to dayMaxEvents. */}
					{todayEvents.slice(0, dayMaxEvents).map((event, rowIndex) => (
						<div
							className="w-full shrink-0"
							data-testid={event?.title}
							key={keys.listKey('empty', rowIndex, event.id)}
							style={{ height: `${eventHeight}px` }}
						/>
					))}

					{/* Show more events button with accurate count */}
					{hasHiddenEvents && (
						// biome-ignore lint/a11y/useSemanticElements: Using div as button
						<div
							className="text-muted-foreground hover:text-foreground cursor-pointer text-[10px] whitespace-nowrap sm:text-xs shrink-0 mt-1"
							onClick={(e) => {
								e.stopPropagation()

								showAllEvents(day, todayEvents)
							}}
							onKeyDown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault()
									e.stopPropagation()
									showAllEvents(day, todayEvents)
								}
							}}
							role="button"
							tabIndex={0}
						>
							+{hiddenEventsCount} {t('more')}
						</div>
					)}
				</>
			)}
			{children}
		</div>
	)

	return (
		<>
			{useStaticCell ? (
				// biome-ignore lint/a11y/noStaticElementInteractions: compact cells still create events on click
				// biome-ignore lint/a11y/useKeyWithClickEvents: matches the grid cell click affordance
				<div
					className={cellClassName}
					data-disabled={cellDisabled.toString()}
					data-testid={dataTestId || testId}
					onClick={handleStaticCellClick}
				>
					{cellContent}
				</div>
			) : (
				<DroppableCell
					allDay={allDay}
					className={cellClassName}
					data-testid={dataTestId || testId}
					date={day}
					disabled={!isBusiness || !isCurrentMonth}
					hour={hour}
					id={droppableId}
					minute={minute}
					resourceId={resourceId}
					type="day-cell"
				>
					{cellContent}
				</DroppableCell>
			)}

			{/* Dialog for showing all events */}
			{!suppressEventsDialog && <AllEventDialog ref={localAllEventsDialogRef} />}
		</>
	)
}

export const GridCell = memo(NoMemoGridCell) as typeof NoMemoGridCell
