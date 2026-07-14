import type { CalendarEvent } from '@ilamy/types'
import dayjs, { type Dayjs } from '@ilamy/utils/dayjs'
import type { HorizontalPositionedEvent } from './geometry'

interface HorizontalLayoutInput {
	days: Dayjs[]
	events: CalendarEvent[]
	dayMaxEvents: number
	gridType?: 'day' | 'hour'
}

interface GridBounds {
	firstUnit: Dayjs
	lastUnit: Dayjs
	unitCount: number
	gridType: 'day' | 'hour'
}

// --- Phase 1: cluster (partition + sort) ------------------------------------

/** Splits events into multi-unit and single-unit groups, each placement-sorted. */
const partitionAndSortEvents = (
	events: CalendarEvent[],
	gridType: 'day' | 'hour'
): { sortedMultiUnit: CalendarEvent[]; sortedSingleUnit: CalendarEvent[] } => {
	const multiUnitEvents = events.filter(
		(e) => e.end.diff(e.start, gridType) > 0
	)
	const singleUnitEvents = events.filter(
		(e) => e.end.diff(e.start, gridType) === 0
	)

	// Multi-unit: by start date, then longer events first.
	const sortedMultiUnit = [...multiUnitEvents].sort((a, b) => {
		const startDiff = a.start.diff(b.start)
		if (startDiff !== 0) {
			return startDiff
		}
		return b.end.diff(b.start) - a.end.diff(a.start)
	})

	// Single-unit: by start time.
	const sortedSingleUnit = [...singleUnitEvents].sort((a, b) =>
		a.start.diff(b.start)
	)

	return { sortedMultiUnit, sortedSingleUnit }
}

// --- Phase 2: geometry ------------------------------------------------------

/** Column span and truncation of an event, clamped to the grid bounds. */
const computeColumnSpan = (
	event: CalendarEvent,
	{ firstUnit, lastUnit, unitCount, gridType }: GridBounds
): {
	startCol: number
	endCol: number
	isTruncatedStart: boolean
	isTruncatedEnd: boolean
} => {
	const eventStart = dayjs.max(event.start.startOf(gridType), firstUnit)
	const adjustedEnd =
		gridType === 'hour' ? event.end.subtract(1, 'minute') : event.end
	const eventEnd = dayjs.min(adjustedEnd.startOf(gridType), lastUnit)
	return {
		startCol: Math.max(0, eventStart.diff(firstUnit, gridType)),
		endCol: Math.min(unitCount - 1, eventEnd.diff(firstUnit, gridType)),
		isTruncatedStart: event.start.startOf(gridType).isBefore(firstUnit),
		isTruncatedEnd: event.end.startOf(gridType).isAfter(lastUnit),
	}
}

// --- Phase 3: place (occupancy grid) ----------------------------------------

type OccupancyGrid = boolean[][]

/** First row where every column from startCol..endCol is free; -1 if none. */
const eventsOverlap = (
	a: CalendarEvent,
	b: CalendarEvent
): boolean => {
	// console.log({ a, b })

	return a.start.isBefore(b.end) && a.end.isAfter(b.start)
}

const findAvailableRow = (
	rows: CalendarEvent[][],
	event: CalendarEvent
): number => {
	for (let row = 0; row < rows.length; row++) {
		const hasOverlap = rows[row].some(existing =>
			eventsOverlap(existing, event)
		)

		if (!hasOverlap) {
			return row
		}
	}

	return -1
}

interface PlaceArgs {
	row: number
	startCol: number
	endCol: number
	event: CalendarEvent
	isTruncatedStart: boolean
	isTruncatedEnd: boolean
}

export const layoutHorizontal = ({
	days,
	events,
	dayMaxEvents,
	gridType = 'day',
}: HorizontalLayoutInput): HorizontalPositionedEvent[] => {
	// For hour-based grids, use actual first/last hours from the days array;
	// for day-based grids, use start/end of day to capture all events.
	const first = days.at(0)
	const last = days.at(-1)
	if (!first || !last) return []

	const bounds: GridBounds = {
		firstUnit:
			gridType === 'hour' ? first.startOf('hour') : first.startOf('day'),
		lastUnit: gridType === 'hour' ? last.endOf('hour') : last.endOf('day'),
		unitCount: days.length,
		gridType,
	}

	const { sortedMultiUnit, sortedSingleUnit } = partitionAndSortEvents(
		events,
		gridType
	)

	const rows: CalendarEvent[][] = Array.from(
		{ length: dayMaxEvents },
		() => []
	)



	const placedEvents: HorizontalPositionedEvent[] = []

	const dayFraction = (date: Dayjs) => {
		const ms =
			date.hour() * 3_600_000 +
			date.minute() * 60_000 +
			date.second() * 1_000 +
			date.millisecond()

		return ms / 86_400_000
	}

	const place = ({
		row,
		startCol,
		endCol,
		event,
		isTruncatedStart,
		isTruncatedEnd,
	}: PlaceArgs) => {

		const startPos = startCol + dayFraction(event.start)
		const endPos = endCol + dayFraction(event.end)

		rows[row].push(event)

		placedEvents.push({
			kind: 'horizontal',
			event,
			left: (startPos / bounds.unitCount) * 100,
			width: ((endPos - startPos) / bounds.unitCount) * 100,
			row,
			isTruncatedStart,
			isTruncatedEnd,
		})
	}

	// Multi-unit events claim rows first.
	for (const event of sortedMultiUnit) {
		const span = computeColumnSpan(event, bounds)

		// First try: place from the original start position.
		const row = findAvailableRow(rows, event)
		if (row !== -1) {
			place({ row, event, ...span })
			continue
		}

		// Fallback: try truncated versions starting from later days.
		for (
			let tryStart = span.startCol + 1;
			tryStart <= span.endCol;
			tryStart++
		) {
			const truncRow = findAvailableRow(rows, event)
			if (truncRow !== -1) {
				place({
					row: truncRow,
					startCol: tryStart,
					endCol: span.endCol,
					event,
					isTruncatedStart: true,
					isTruncatedEnd: span.isTruncatedEnd,
				})
				break
			}
		}
	}

	// Single-unit events fill the remaining gaps. computeColumnSpan already
	// clamps the span to the grid, so startCol needs no re-clamping here.
	for (const event of sortedSingleUnit) {
		const span = computeColumnSpan(event, bounds)
		const col = span.startCol
		const row = findAvailableRow(rows, event)
		if (row !== -1) {
			place({
				row,
				startCol: col,
				endCol: col,
				event,
				isTruncatedStart: false,
				isTruncatedEnd: false,
			})
		}
	}

	return placedEvents
}
