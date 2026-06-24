import { ScrollArea, ScrollBar } from '@ilamy/ui/components/scroll-area'
import { cn } from '@ilamy/ui/lib/utils'
import type React from 'react'
import { useMemo, useRef } from 'react'
import { useScrollToTime } from '@/components/vertical-grid/use-scroll-to-time'
import { useSmartCalendarContext } from '@/features/calendar/hooks/use-smart-calendar-context'
import { HorizontalGridHeaderContainer } from './horizontal-grid-header-container'
import {
	HorizontalGridRow,
	type HorizontalGridRowProps,
} from './horizontal-grid-row'

interface HorizontalGridProps {
	rows: HorizontalGridRowProps[]
	children?: React.ReactNode
	classes?: { header?: string; body?: string }
	allDay?: boolean
	gridType?: 'day' | 'hour'
	variant?: 'regular' | 'resource'
	dayNumberHeight?: number
}

export const HorizontalGrid: React.FC<HorizontalGridProps> = ({
	rows,
	children,
	classes,
	allDay: topLevelAllDay,
	gridType,
	variant = 'resource',
	dayNumberHeight,
}) => {
	const { currentDate, view, scrollTime, isResourceGroupCollapsed } =
		useSmartCalendarContext((ctx) => ({
			currentDate: ctx.currentDate,
			view: ctx.view,
			scrollTime: ctx.scrollTime,
			isResourceGroupCollapsed: ctx.isResourceGroupCollapsed,
		}))
	const viewportRef = useRef<HTMLDivElement | null>(null)

	const visibleRows = useMemo(
		() =>
			rows.filter((row) => {
				if (row.rowKind === 'resource' && row.resource?.groupId != null) {
					return !isResourceGroupCollapsed(row.resource.groupId)
				}
				return true
			}),
		[rows, isResourceGroupCollapsed]
	)

	const isResourceCalendar = variant === 'resource'
	const isRegularCalendar = !isResourceCalendar
	const canHorizontalScrollToHour = gridType === 'hour' && isResourceCalendar

	useScrollToTime({
		viewportRef,
		scrollTime,
		enabled: canHorizontalScrollToHour,
		scrollKey: `${view}-${currentDate.format('YYYY-MM-DD')}`,
		axis: 'horizontal',
	})

	const header = children && (
		<HorizontalGridHeaderContainer className={classes?.header}>
			{children}
		</HorizontalGridHeaderContainer>
	)

	return (
		<div
			className="h-full flex flex-col"
			data-testid="horizontal-grid-container"
		>
			{/**
			 * header row is rendered outside scroll area for regular calendar
			 */}
			{isRegularCalendar && header}

			<ScrollArea
				className={cn('h-full', isRegularCalendar && 'overflow-auto')}
				data-testid="horizontal-grid-scroll"
				viewPortProps={{
					className: '*:flex! *:flex-col! *:min-h-full',
					ref: viewportRef,
				}}
			>
				{/**
				 * header row for resource calendar inside scroll area
				 * */}
				{isResourceCalendar && header}

				{/* Calendar area with scroll */}
				<div
					className={cn('flex flex-1 w-fit', classes?.body)}
					data-testid="horizontal-grid-body"
				>
					<div
						className="relative w-full flex flex-col flex-1"
						key={currentDate.format('YYYY-MM')}
					>
						{visibleRows.map((row, index) => (
							<HorizontalGridRow
								allDay={row.allDay ?? topLevelAllDay}
								dayNumberHeight={dayNumberHeight}
								gridType={gridType}
								isLastRow={index === visibleRows.length - 1}
								key={row.id}
								variant={variant}
								{...row}
							/>
						))}
					</div>
				</div>

				<ScrollBar className="z-30" />
				<ScrollBar className="z-30" orientation="horizontal" />
			</ScrollArea>
		</div>
	)
}
