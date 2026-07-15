import type {
	HorizontalCellSpec,
	HorizontalRowSpec,
	Resource,
} from '@ilamy/types'
import { cn } from '@ilamy/ui/lib/utils'
import type { Dayjs } from '@ilamy/utils/dayjs'
import type React from 'react'
import { memo, useMemo, useRef, useState } from 'react'
import { useSmartCalendarContext } from '@/features/calendar/hooks/use-smart-calendar-context'
import { useProcessedWeekEvents } from '@/features/calendar/hooks/useProcessedWeekEvents'
import { getDayKey } from '@/lib/utils/date-utils'
import { keys } from '@/lib/utils/keys'
import type { SelectedDayEvents } from '../all-events-dialog'
import { AllEventDialog } from '../all-events-dialog'
import { GridCell } from '../grid-cell'
import { ResourceCell } from '../resource-cell'
import { ResourceGroupHeaderCell } from '../resource-group-header-cell'
import { HorizontalGridEventsLayer } from './horizontal-grid-events-layer'
import { RuleDialog } from '../rule-dialog'

interface HorizontalGridColumn extends HorizontalCellSpec {
	renderCell?: (row: HorizontalGridRowProps) => React.ReactNode
}

export interface HorizontalGridRowProps extends HorizontalRowSpec {
	gridType?: 'day' | 'hour'
	variant?: 'regular' | 'resource'
	dayNumberHeight?: number
	columns?: HorizontalGridColumn[]
	allDay?: boolean
	isLastRow?: boolean
	leftPadding?: number
}

const NoMemoHorizontalGridRow: React.FC<HorizontalGridRowProps> = ({
  id,
  resource,
  resourceGroup,
  rowKind = 'resource',
  gridType = 'day',
  variant = 'resource',
  dayNumberHeight,
  className,
  columns = [],
  allDay,
  showDayNumber = false,
  isLastRow = false,
  leftPadding = 0,
}) => {
  const { renderResource, view, events } = useSmartCalendarContext((ctx) => ({
    renderResource: ctx.renderResource,
    view: ctx.view,
    events: ctx.events,
  }))
  const [isDialogOpen, setDialogOpen] = useState<boolean>(false)

  console.log('HorizontalGridRow resource:', resource) // Debugging log

  const isGroupHeader = rowKind === 'group-header' && resourceGroup != null

  const ruleType = resource?.data?.ruleType as string | undefined
  const isRuleResource = rowKind === 'rule-resource' && ruleType != null
  
  const isResourceCalendar = variant === 'resource'
  const isYearResourceView = view === 'resourceYear'
  const compact = isYearResourceView && !isGroupHeader
  const isGrouped = columns.some((col) => col.days)

  const allEventsDialogRef = useRef<{
    open: () => void
    close: () => void
    setSelectedDayEvents: (dayEvents: SelectedDayEvents) => void
  }>(null)

  const flatDays = useMemo(() => {
    if (isGrouped || isGroupHeader) return []
    return columns.map((col) => col.day).filter((d): d is Dayjs => Boolean(d))
  }, [columns, isGrouped, isGroupHeader])

  const { positionedEvents, dayEventsMap } = useProcessedWeekEvents({
    days: flatDays,
    gridType,
    resourceId: resource?.id,
    allDay,
  })
  const ruleEvents = useMemo(() => {
    if (!isRuleResource) return []
    return events.filter((event) => event.isRule)
  }, [events, isRuleResource])

  // console.log('HorizontalGridRow resource:', resource) // Debugging log
  // console.log('HorizontalGridRow positionedEvents:', positionedEvents) // Debugging log
  console.log('HorizontalGridRow events:', events) // Debugging log
  // console.log('HorizontalGridRow ruleEvents:', ruleEvents) // Debugging log

  return (
    <div
      // FIX 1: Removed flex-1 so the row cannot stretch. Forced strict 30px limits.
      className={cn('flex relative min-w-0 h-[30px]! min-h-[30px]! max-h-[30px]!', className)}
      data-testid={keys.container.horizontal.row(id)}
    >
      {isResourceCalendar && isGroupHeader && resourceGroup && (
        <ResourceGroupHeaderCell
          className="w-20 sm:w-40 h-[30px]! min-h-[30px]! p-0! overflow-hidden"
          groupId={resourceGroup.id}
          title={resourceGroup.title}
        />
      )}
      {isRuleResource && (
        <RuleDialog
          isOpen={isDialogOpen}
          onClose={() => setDialogOpen(false)}
          onSubmit={(val) => {
            // console.log('Price set to:', val)
            setDialogOpen(false)
        }}
        ruleType={ruleType}
        title="Set Price"
        description="Enter the rate for this specific date."
        label="Price amount"
        prefix="$"
        placeholder="0.00"
      />)}
      {(isResourceCalendar && !isGroupHeader && resource) && (
        <ResourceCell
          className="w-20 sm:w-40 sticky left-0 bg-background z-20 h-[30px]! min-h-[30px]! p-0! overflow-hidden"
          data-testid={keys.container.horizontal.rowLabel(resource.id)}
          resource={resource}
        >
          {renderResource ? (
            renderResource(resource)
          ) : (
            <div className="wrap-break-word text-sm">{resource.title}</div>
          )}
        </ResourceCell>
      )}
      <div
        style={{
            width: leftPadding,
            height: 5, // Exact 30px spacer
            flexShrink: 0,
        }}
      />
      {/* FIX 2: Forced the inner wrapper to exactly 30px */}
      <div className="relative flex-1 flex min-w-0 h-[30px]!">
        <div className="flex w-full min-w-0 h-[30px]!">
          
          {isGroupHeader
            ? columns.map((col, index) => (
                <div
                  className={cn(
                    'flex-1 w-20 border-r border-b bg-muted/40 h-[30px]! min-h-[30px]! p-0!',
                    isLastRow && 'border-b-0',
                    col.className
                  )}
                  key={col.id}
                />
              ))
            : columns.map((col, index) => {
                if (col.days) {
                  return (
                    <GroupedColumn
                      allDay={allDay}
                      col={col}
                      compact={true} // Forced compact
                      dayNumberHeight={dayNumberHeight}
                      gridType={gridType}
                      id={id}
                      isLastCol={index === columns.length - 1}
                      isLastRow={isLastRow}
                      key={col.id}
                      resource={resource}
                      resourceId={resource?.id}
                      showDayNumber={showDayNumber}
                    />
                  )
                }

                return col.day ? (
                  <GridCell
                    allDay={allDay}
                    allEventsDialogRef={allEventsDialogRef}
                    className={cn(
                      'flex-1 w-20 h-[30px]! min-h-[30px]! p-0!',
                      isLastRow && 'border-b-0',
                      col.className
                    )}
                    compact={true} // Forced compact
                    day={col.day}
                    gridType={gridType}
                    hour={gridType === 'hour' ? col.day.hour() : undefined}
                    key={col.day.toISOString()}
                    precomputedEvents={dayEventsMap.get(getDayKey(col.day))}
                    resourceId={resource?.id}
                    showDayNumber={showDayNumber}
                    isRuleResource={isRuleResource}
                    onRuleClick={() => setDialogOpen(true)}
                    ruleEvents={ruleEvents}
                    suppressEventsDialog
                  />
                ) : null
              })}
        </div>

        {!isGrouped && !isGroupHeader && (
          <div className="absolute inset-0 z-10 pointer-events-none h-[30px]!">
            <HorizontalGridEventsLayer
              data-testid={keys.container.eventsLayer('horizontal', id)}
              dayNumberHeight={dayNumberHeight}
              days={flatDays}
              gridType={gridType}
              positionedEvents={positionedEvents}
              resource={resource}
              resourceId={resource?.id}
            />
          </div>
        )}
      </div>
      {!isGroupHeader && <AllEventDialog ref={allEventsDialogRef} />}
    </div>
  )
}

const GroupedColumn = memo(
  ({
    col,
    gridType = 'day',
    allDay,
    resource,
    resourceId,
    dayNumberHeight,
    showDayNumber,
    isLastRow,
    isLastCol,
    id,
    compact,
  }: {
    col: HorizontalGridColumn
    gridType?: 'day' | 'hour'
    allDay?: boolean
    resource?: Resource
    resourceId?: string | number
    dayNumberHeight?: number
    showDayNumber: boolean
    isLastRow: boolean
    isLastCol: boolean
    id: string | number
    compact?: boolean
  }) => {
    const days = col.days ?? []
    const { positionedEvents } = useProcessedWeekEvents({
      days,
      gridType,
      resourceId,
      allDay,
    })

    return (
      // FIX 3: Lock the grouped columns to 30px so they don't stretch
      <div className="flex relative w-full h-[30px]!">
        <div className="flex w-full h-[30px]!">
          {days.map((day) => (
            <GridCell
              allDay={allDay}
              className={cn(
                'flex-1 w-20 h-[30px]! min-h-[30px]! p-0!',
                isLastRow && 'border-b-0',
                !isLastCol && 'border-r!',
                col.className
              )}
              compact={true} // Forced compact
              day={day}
              gridType={gridType}
              hour={gridType === 'hour' ? day.hour() : undefined}
              key={day.toISOString()}
              resourceId={resourceId}
              showDayNumber={showDayNumber}
            />
          ))}
        </div>

        <div className="absolute inset-0 z-10 pointer-events-none h-[30px]!">
          <HorizontalGridEventsLayer
            data-testid={keys.container.eventsLayer('horizontal', id)}
            dayNumberHeight={dayNumberHeight}
            days={days}
            gridType={gridType}
            positionedEvents={positionedEvents}
            resource={resource}
            resourceId={resourceId}
          />
        </div>
      </div>
    )
  }
)

export const HorizontalGridRow = memo(NoMemoHorizontalGridRow)