import type { Dayjs, PluginView, ViewConfig } from '@ilamy/types'
import { Grid2x2 } from 'lucide-react'
import dayjs from '@ilamy/utils/dayjs'
import { resourceHorizontalRows, ResourcesCornerCell } from './resource-axis'
import { DayLabel } from '@ilamy/ui/components/day-label'

const getTimelineRange = (
	date: Dayjs,
	config?: Pick<ViewConfig, 'resourceTimelineRange'>
) => {
	if (config?.resourceTimelineRange) {
		return {
			start: config.resourceTimelineRange.start.startOf('day'),
			end: config.resourceTimelineRange.end.endOf('day'),
		}
	}

	const start = date.startOf('year')
	return { start, end: start.endOf('year') }
}

const getTimelineDays = (
	date: Dayjs,
	config?: Pick<ViewConfig, 'resourceTimelineRange'>
) => {
	const { start, end } = getTimelineRange(date, config)
	const daysInRange = Math.max(end.diff(start, 'day') + 1, 0)
	return Array.from({ length: daysInRange }, (_, i) => start.add(i, 'day'))
}

export const resourceYearView: PluginView = {
	name: 'resourceYear',
	label: 'Yearly Timeline',
	icon: Grid2x2,
	navigationUnit: 'year',
	layout: 'horizontal',
	supportsResources: true,
	range: (date, config) => getTimelineRange(date, config),
	columns: (date, config) => {
		return resourceHorizontalRows({
			resources: config.resources ?? [],
			days: getTimelineDays(date, config),
			gridType: 'day',
		})
	},
	renderHeader: ({ date, config }) => {
		const days = getTimelineDays(date, config)
		return (
			<>
				<ResourcesCornerCell />
				{days.map((day) => (
					<div
						key={day.format('YYYY-MM-DD')}
						className="w-20 border-b border-r shrink-0 flex items-center justify-center flex-col"
					>
						<DayLabel
							today={day.isSame(dayjs(), 'day')}
							className="flex-col-reverse"
							dayNumber={day.format('D')}
							weekday={day.format('MMM')}
						/>
					</div>
				))}
			</>
		)
	},
}
