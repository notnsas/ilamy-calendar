import { beforeEach, describe, expect, test } from 'bun:test'
import type { Resource } from '@ilamy/types'
import dayjs from '@ilamy/utils/dayjs'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { CalendarProvider } from '@/features/calendar/contexts/calendar-context/provider'
import { HorizontalGrid } from './horizontal-grid'

const initialDate = dayjs('2025-01-01T00:00:00.000Z')
const mockDays = [initialDate, initialDate.add(1, 'day')]
const mockRows = [
	{
		id: 'res-1',
		title: 'Resource 1',
		resource: { id: 'res-1', title: 'Resource 1', color: 'blue' },
		columns: [
			{
				id: 'label-col',
				day: dayjs(),
				gridType: 'day' as const,
				renderCell: ({ resource }: { resource?: Resource }) => (
					<div data-testid={`horizontal-row-label-${resource?.id}`}>
						{resource?.title}
					</div>
				),
			},
			...mockDays.map((day) => ({
				id: `col-${day.toISOString()}`,
				day,
				gridType: 'day' as const,
			})),
		],
	},
]

const renderHorizontalGrid = (props = {}) => {
	return render(
		<CalendarProvider
			dayMaxEvents={3}
			events={[]}
			initialDate={initialDate}
			resources={[]}
		>
			<HorizontalGrid rows={mockRows} {...props}>
				<div data-testid="grid-children">Header Content</div>
			</HorizontalGrid>
		</CalendarProvider>
	)
}

describe('HorizontalGrid', () => {
	beforeEach(() => {
		cleanup()
	})

	test('renders base structure correctly', () => {
		renderHorizontalGrid()

		expect(screen.getByTestId('horizontal-grid-scroll')).toBeInTheDocument()
		expect(screen.getByTestId('horizontal-grid-header')).toBeInTheDocument()
		expect(screen.getByTestId('horizontal-grid-body')).toBeInTheDocument()
		expect(screen.getByTestId('grid-children')).toHaveTextContent(
			'Header Content'
		)
	})

	test('renders rows and labels', () => {
		renderHorizontalGrid()
		expect(screen.getByTestId('horizontal-row-res-1')).toBeInTheDocument()
		expect(screen.getByTestId('horizontal-row-label-res-1')).toHaveTextContent(
			'Resource 1'
		)
	})

	test('renders cells in rows', () => {
		renderHorizontalGrid()

		// GridCell by default has data-testid="day-cell-{YYYY-MM-DD}"

		expect(
			screen.getByTestId(`day-cell-${mockDays[0].format('YYYY-MM-DD')}`)
		).toBeInTheDocument()

		expect(
			screen.getByTestId(`day-cell-${mockDays[1].format('YYYY-MM-DD')}`)
		).toBeInTheDocument()
	})

	test('applies custom classes', () => {
		renderHorizontalGrid({
			classes: {
				header: 'custom-header-class',
				body: 'custom-body-class',
			},
		})

		expect(screen.getByTestId('horizontal-grid-header')).toHaveClass(
			'custom-header-class'
		)
		expect(screen.getByTestId('horizontal-grid-body')).toHaveClass(
			'custom-body-class'
		)
	})

	test('hides grouped resource rows when the group is collapsed', () => {
		const groupedRows = [
			{
				id: 'group-standard',
				rowKind: 'group-header' as const,
				resourceGroup: { id: 'standard', title: 'Standard Room' },
				columns: mockDays.map((day) => ({
					id: `col-${day.toISOString()}`,
					day,
					gridType: 'day' as const,
				})),
			},
			{
				id: 'room-1',
				rowKind: 'resource' as const,
				resource: {
					id: 'room-1',
					title: 'Room 1',
					groupId: 'standard',
					groupTitle: 'Standard Room',
				},
				columns: mockDays.map((day) => ({
					id: `col-${day.toISOString()}`,
					day,
					gridType: 'day' as const,
				})),
			},
		]

		render(
			<CalendarProvider
				dayMaxEvents={3}
				events={[]}
				initialDate={initialDate}
				resources={[]}
			>
				<HorizontalGrid rows={groupedRows} variant="resource">
					<div data-testid="grid-children">Header Content</div>
				</HorizontalGrid>
			</CalendarProvider>
		)

		expect(screen.getByTestId('horizontal-row-room-1')).toBeInTheDocument()

		fireEvent.click(screen.getByTestId('resource-group-toggle-standard'))

		expect(
			screen.queryByTestId('horizontal-row-room-1')
		).not.toBeInTheDocument()
		expect(
			screen.getByTestId('resource-group-header-standard')
		).toBeInTheDocument()
	})
})
