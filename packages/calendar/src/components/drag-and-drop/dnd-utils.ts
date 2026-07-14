import type { DragEndEvent } from '@dnd-kit/core'
import type { CalendarEvent } from '@ilamy/types'
import dayjs, { type Dayjs } from '@ilamy/utils/dayjs'

interface DropCellData {
	type?: string
	date?: string
	hour?: number
	minute?: number
	resourceId?: string
	allDay?: boolean
}

export const getUpdatedEvent = (
	event: DragEndEvent,
	activeEvent: CalendarEvent | null
) => {
	 
	const { active, over } = event
	if (!active || !over || !activeEvent) {
		return null
	}
	
	const data = (over.data.current || {}) as DropCellData
	const isTimeCell = data.type === 'time-cell'
	const { resourceId, allDay } = data

	const newStart = dayjs(data.date)
		.add(activeEvent.start.hour(), 'hour')
		.add(activeEvent.start.minute(), 'minute')

	const eventDuration = activeEvent.end.diff(activeEvent.start, 'second')
	// Create new end time by adding the original duration
	let newEnd = newStart.add(eventDuration, 'second')

	if (newEnd.isSame(newEnd.startOf('day'))) {
		// If the new end time is at midnight, set it to 24 hours of partial day
		newEnd = newEnd.subtract(1, 'day').endOf('day')
	}

	// Update the event with new times and resource if changed
	const updates = {
		start: newStart,
		end: newEnd,
		resourceId,
		allDay: isTimeCell ? false : (allDay ?? activeEvent.allDay),
	}
	return { activeEvent, updates }
}
