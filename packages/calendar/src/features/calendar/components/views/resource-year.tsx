import type { Dayjs, PluginView, ViewConfig } from '@ilamy/types'
import { PanelsTopLeft } from 'lucide-react'
import dayjs from '@ilamy/utils/dayjs'
import { resourceHorizontalRows, ResourcesCornerCell } from './resource-axis'
import { DayLabel } from '@ilamy/ui/components/day-label'
import { calculateViewportWidth, calculateVirtualizeIndex, calculateLeftPadding, useVirtualize } from '@/lib/utils/optimize'
import { useState, useRef, useEffect } from 'react'

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
  
	const start = date.startOf('month')
  const end = start.add(12, 'month')

  return { start, end }
}

const getTimelineDays = (
	date: Dayjs,
	config?: Pick<ViewConfig, 'resourceTimelineRange'>
) => {
	const { start, end } = getTimelineRange(date, config)
	const daysInRange = Math.max(end.diff(start, 'day') + 1, 0)
	return Array.from({ length: daysInRange }, (_, i) => start.add(i, 'day'))
}

const VirtualizedYearHeader = ({ date, config }: { date: Dayjs; config: ViewConfig }) => {
  const days = getTimelineDays(date, config)

  const COLUMN_WIDTH = 80
  const OVERSCAN = 5 // Slightly higher overscan buffers the edges so scrolling feels smoother

  const viewportRef = useRef<HTMLDivElement | null>(null)

  const { startIndex, endIndex, leftPadding, rightPadding } = useVirtualize(
    () => viewportRef.current?.closest('[data-slot="scroll-area-viewport"]'), 
    viewportRef, 
    COLUMN_WIDTH, 
    OVERSCAN, 
    days.length
  )

  const slicedDays = days.slice(startIndex, endIndex)
  return (
    <>
      <ResourcesCornerCell />
      <div 
        ref={viewportRef} 
        className='flex flex-row flex-1 overflow-hidden'
      >
        <div style={{ width: leftPadding, height: 40, flexShrink: 0 }} />
        
        {slicedDays.map((day) => (
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

        <div style={{ width: rightPadding, height: 40, flexShrink: 0 }} />
      </div>
    </>
  )
}

export const resourceYearView: PluginView = {
	name: 'resourceYear',
	label: 'Yearly Timeline',
	icon: PanelsTopLeft,
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
    return <VirtualizedYearHeader date={date} config={config} />
  }
}
