import type {
	Dayjs,
	HorizontalRowSpec,
	PluginView,
	Resource,
	VerticalColumnSpec,
	ViewConfig,
} from '@ilamy/types'
import { DayLabel } from '@ilamy/ui/components/day-label'
import {
  Grid2x2,
  Grid3x3,
  Grid,
  LayoutGrid,
  type LucideIcon,
	type LucideProps,
} from 'lucide-react'
import type React from 'react'
import { AnimatedSection } from '@/components/animations/animated-section'
import { gutterColumn } from '@/components/vertical-grid/gutter'
import { HEADER_STAGGER_DELAY } from '@/lib/constants'
import {
	getMonthDays,
	getMonthGridRange,
	getMonthWeeks,
	isToday,
} from '@/lib/utils/date-utils'
import { keys } from '@/lib/utils/keys'
import { MonthHeader } from './month-header'
import {
	ResourceColumnsHeader,
	ResourcesCornerCell,
	resourceHorizontalRows,
	resourceVerticalColumns,
} from './resource-axis'

const resourceMonthVerticalColumns = (
	date: Dayjs,
	resources: Resource[],
	numOfMonths: number = 1
): VerticalColumnSpec[] => {
	const daysInMonth = getMonthDays(date, numOfMonths)
	return resourceVerticalColumns({
		resources,
		gutter: gutterColumn({
			days: daysInMonth,
			gridType: 'day',
			renderLabel: (day: Dayjs) => (
				<DayLabel
					className="flex-col-reverse"
					dayNumber={day.format('D')}
					today={isToday(day)}
					weekday={day.format('ddd')}
				/>
			),
		}),
		columnsFor: (resource) => ({
			id: keys.col.resource('month', resource.id),
			day: undefined,
			days: daysInMonth,
			gridType: 'day' as const,
		}),
	})
}

const ResourceMonthHorizontalHeader: React.FC<{ date: Dayjs; numOfMonths: number }> = ({ date, numOfMonths }) => {
	const monthDays = getMonthDays(date, numOfMonths)
	const weekdayFormat = numOfMonths > 1 ? 'MMM' : 'ddd'

	return (
		<>
			<ResourcesCornerCell />
			{monthDays.map((day, index) => {
				const key = keys.header.resource.monthDay(day)
				const today = isToday(day)

				return (
					<AnimatedSection
						className="w-20 border-b border-r shrink-0 flex items-center justify-center flex-col"
						delay={index * HEADER_STAGGER_DELAY}
						key={keys.listKey(key, 'animated')}
						transitionKey={keys.listKey(key, 'motion')}
					>
						<DayLabel
							className="flex-col-reverse"
							dayNumber={day.format('D')}
							today={today}
							weekday={day.format(weekdayFormat)}
						/>
					</AnimatedSection>
				)
			})}
		</>
	)
}

const monthRows = (
	date: Dayjs,
	config: ViewConfig,
	numOfMonths: number = 1
): VerticalColumnSpec[] | HorizontalRowSpec[] => {
	const resources = config.resources ?? []

	if (resources.length) {
		if (config.orientation === 'vertical') {
			return resourceMonthVerticalColumns(date, resources, numOfMonths)
		}
		return resourceHorizontalRows({
			resources,
			days: getMonthDays(date, numOfMonths),
			gridType: 'day',
		})
	}

	return getMonthWeeks(date, config.firstDayOfWeek).map((days, weekIndex) => ({
		id: keys.listKey('week', weekIndex),
		columns: days.map((day) => ({
			id: keys.col.day(day),
			day,
			className: 'w-auto',
			gridType: 'day' as const,
		})),
		className: 'flex-1',
		showDayNumber: true,
	}))
}

export const monthView = (numOfMonths: number): PluginView => {

	const names: Record<number, string> = {
		1: 'month',
		2: 'two-month',
		3: 'three-month',
		6: 'six-month',
	}

	const labels: Record<number, string> = {
		1: 'Month',
		2: 'Two Months',
		3: 'Three Months',
		6: 'Six Months',
	}

	const icons: Record<number, LucideIcon> = {
		1: Grid3x3,
		2: Grid2x2,
		3: LayoutGrid,
		6: Grid,
	}
	
	const name = names[numOfMonths] ?? 'multi-month'
	const label = labels[numOfMonths] ?? `${numOfMonths} Months`
	const icon = icons[numOfMonths] ?? Grid3x3

	return {
		name,
		label,
		icon,
		navigationUnit: 'month',
		layout: 'horizontal',
		supportsResources: true,
		range: (date, config) => getMonthGridRange(date, config.firstDayOfWeek),
		columns: (date, config) => monthRows(date, config, numOfMonths),
		renderHeader: ({ date, config }) => {
			const resources = config.resources ?? []
			if (!resources.length) {
				return <MonthHeader className="h-12" />
			}
			if (config.orientation === 'vertical') {
				return <ResourceColumnsHeader resources={resources} />
			}
			return <ResourceMonthHorizontalHeader date={date} numOfMonths={numOfMonths} />
		}
	}
}
