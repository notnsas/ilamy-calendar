import type {
	HorizontalCellSpec,
	HorizontalRowSpec,
	Resource,
	VerticalColumnSpec,
} from '@ilamy/types'
import { cn } from '@ilamy/ui/lib/utils'
import type { Dayjs } from '@ilamy/utils/dayjs'
import type React from 'react'
import { AllDayCell } from '@/components/all-day-row/all-day-cell'
import { AllDayRow } from '@/components/all-day-row/all-day-row'
import { ResourceCell } from '@/components/resource-cell'
import { GUTTER_WIDTH } from '@/components/vertical-grid/gutter'
import { useSmartCalendarContext } from '@/features/calendar/hooks/use-smart-calendar-context'
import { getDayKey } from '@/lib/utils/date-utils'
import { keys } from '@/lib/utils/keys'

/**
 * Width contract of one resource cell: header cells and body columns must
 * use the same utilities or the axis misaligns.
 */
export const RESOURCE_CELL_WIDTH = 'min-w-20 flex-1'

interface ResourceHorizontalRowsOptions {
	resources: Resource[]
	/** Flat cells (one date each) or grouped cells (e.g. one day's hour slots). */
	days: Dayjs[] | Dayjs[][]
	gridType: 'day' | 'hour'
	cellClassName?: string
}

const buildDayColumns = (
	days: Dayjs[] | Dayjs[][],
	gridType: 'day' | 'hour',
	cellClassName?: string
): HorizontalCellSpec[] =>
	days.map((day) => {
		const isArray = Array.isArray(day)
		const refDay = isArray ? day.at(0) : day
		return {
			id: refDay ? keys.col.day(refDay) : 'day-col-unknown',
			day: isArray ? undefined : day,
			days: isArray ? day : undefined,
			className: cellClassName,
			gridType,
		}
	})

/**
 * Builds horizontal resource rows, inserting collapsible group header rows
 * before the first resource in each `groupId` cluster.
 */
export const buildGroupedResourceRows = (
  resources: Resource[],
  columns: HorizontalCellSpec[]
): HorizontalRowSpec[] => {
  const rows: HorizontalRowSpec[] = []
  const insertedGroups = new Set<string>()

  for (const resource of resources) {
    // Skip the engine's price rows in the main loop so they don't double-render at the bottom
    if (resource.data?.isRuleResource) {
      continue
    }

    if (resource.groupId != null) {
      const groupKey = String(resource.groupId)
      
      if (!insertedGroups.has(groupKey)) {
        insertedGroups.add(groupKey)
        
        // 1. EXACT SAME group header
        rows.push({
          id: keys.resourceGroup.header(resource.groupId),
          rowKind: 'group-header',
          resourceGroup: {
            id: resource.groupId,
            title: resource.groupTitle ?? groupKey,
          },
          columns,
        })

        // Find the engine-provided price resource for this group
        const engineRuleResources = resources.filter(
          (r) => r.groupId === resource.groupId && r.data?.isRuleResource
        )

				console.log('engineRuleResources', engineRuleResources)

        // 2. EXACT SAME rule-resource structure as your commented out code
        if (engineRuleResources.length > 0) {
					for (const enginePriceResource of engineRuleResources) {
						rows.push({
							id: String(enginePriceResource.id),
							rowKind: 'rule-resource',
							resourceGroup: {
								id: resource.groupId,
								title: resource.groupTitle ?? groupKey,
							},
							resource: enginePriceResource, // <--- Using the engine resource here
							columns,
						})
					}
        }
      }
    }

    // 3. Normal resource row
    rows.push({
      id: String(resource.id),
      rowKind: 'resource',
      resource,
      columns,
    })
  }

  return rows
}

/**
 * Horizontal arrangement of the resource axis: one row per resource over the
 * same date cells (resources as rows, time flows across).
 */
export const resourceHorizontalRows = ({
	resources,
	days,
	gridType,
	cellClassName,
}: ResourceHorizontalRowsOptions): HorizontalRowSpec[] => {
	const columns = buildDayColumns(days, gridType, cellClassName)
	// console.log('resourceHorizontalRows columns:', columns) // Debugging log
	// console.log('buildGroupedResourceRows(resources, columns) rows:', buildGroupedResourceRows(resources, columns)) // Debugging log
	return buildGroupedResourceRows(resources, columns)
}

/** Column spec(s) for one resource; `resourceVerticalColumns` attaches the resource. */
type ResourceColumnSeed = Omit<VerticalColumnSpec, 'resource'>

interface ResourceVerticalColumnsOptions {
	resources: Resource[]
	/** The leading label column (time or date gutter), built via `gutterColumn`. */
	gutter: VerticalColumnSpec
	columnsFor: (resource: Resource) => ResourceColumnSeed | ResourceColumnSeed[]
}

/**
 * Vertical arrangement of the resource axis: the gutter column followed by
 * each resource's column(s) (resources as columns, time flows down).
 */
export const resourceVerticalColumns = ({
	resources,
	gutter,
	columnsFor,
}: ResourceVerticalColumnsOptions): VerticalColumnSpec[] => [
	gutter,
	...resources.flatMap((resource) => {
		const seeds = columnsFor(resource)
		const seedList = Array.isArray(seeds) ? seeds : [seeds]
		return seedList.map((seed) => ({ ...seed, resource }))
	}),
]

/**
 * Header row for vertical resource arrangements (day/month): a gutter-width
 * corner plus one ResourceCell per resource column.
 */
export const ResourceColumnsHeader: React.FC<{ resources: Resource[] }> = ({
	resources,
}) => (
	<div
		className={'flex border-b h-12 flex-1'}
		data-testid={keys.header.resource.columnsHeader}
	>
		<div
			className={cn(
				'shrink-0 border-r sticky top-0 left-0 bg-background z-20',
				GUTTER_WIDTH
			)}
		/>
		{resources.map((resource) => (
			<ResourceCell
				className={RESOURCE_CELL_WIDTH}
				key={keys.listKey('resource-cell', resource.id)}
				resource={resource}
			/>
		))}
	</div>
)

/** The sticky "Resources" corner cell of horizontal resource arrangements. */
export const ResourcesCornerCell: React.FC = () => {
	const { t } = useSmartCalendarContext((c) => ({ t: c.t }))
	return (
		<div className="w-20 sm:w-40 border-b border-r shrink-0 flex justify-center items-center sticky top-0 left-0 bg-background z-20">
			<div className="text-sm truncate px-1 min-w-0">{t('resources')}</div>
		</div>
	)
}

interface ResourceAllDayGroup {
	resource: Resource
	days: Dayjs[]
	seenDayKeys: Set<string>
}

/**
 * The all-day block of vertical resource arrangements: the "All day" label
 * cell plus one AllDayRow per resource, derived from the resource identity the
 * column specs already carry (column order is preserved).
 */
export const ResourceAllDayRows: React.FC<{
	columns: VerticalColumnSpec[]
}> = ({ columns }) => {
	const groups: ResourceAllDayGroup[] = []
	const groupsByResourceId = new Map<string | number, ResourceAllDayGroup>()

	for (const column of columns) {
		if (!column.resource || column.noEvents || !column.day) {
			continue
		}
		let group = groupsByResourceId.get(column.resource.id)
		if (!group) {
			group = { resource: column.resource, days: [], seenDayKeys: new Set() }
			groupsByResourceId.set(column.resource.id, group)
			groups.push(group)
		}
		const dayKey = getDayKey(column.day)
		if (!group.seenDayKeys.has(dayKey)) {
			group.seenDayKeys.add(dayKey)
			group.days.push(column.day)
		}
	}

	return (
		<div className="flex w-full">
			<AllDayCell />
			{groups.map(({ resource, days }) => (
				<AllDayRow
					classes={{
						cell: cn('min-w-20', days.length > 1 && 'flex-1', 'border-r!'),
					}}
					days={days}
					key={keys.allDayRow(resource.id)}
					resource={resource}
					showSpacer={false}
				/>
			))}
		</div>
	)
}
