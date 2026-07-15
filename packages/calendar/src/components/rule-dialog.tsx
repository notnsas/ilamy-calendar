import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@ilamy/ui/components/dialog'
import { Button } from '@ilamy/ui/components/button'
import { Input } from '@ilamy/ui/components/input'
import { Label } from '@ilamy/ui/components/label'
import { Checkbox } from '@ilamy/ui/components/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ilamy/ui/components/select'
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '@ilamy/ui/components/combobox'
import { Settings } from 'lucide-react'
import { useSmartCalendarContext } from '@/features/calendar/hooks/use-smart-calendar-context'
import type { CalendarEvent, Dayjs } from '@ilamy/types'
import { dayjs } from '@ilamy/calendar'

interface RuleDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (value: string) => void
  title: string
  description?: string
  label: string
  placeholder?: string
  ruleType?: string // e.g., "min-stay", "max-stay", "daily-price", "fixed-price"
  prefix?: string // e.g., "$" or "Rp"
  suffix?: string // e.g., "days" or "nights"
}

export function RuleDialog({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  label,
  placeholder = '0',
  prefix,
  suffix,
  ruleType
}: RuleDialogProps) {
  const {
    t,
    selectedEvent,
    isEventFormOpen,
    closeEventForm,
    addEvent,
    updateEvent,
    deleteEvent,
    renderEventForm,
    events,
    getResourceGroupId,
    getResourceById,
    getRuleResourceId
  } = useSmartCalendarContext((context) => ({
    t: context.t,
    selectedEvent: context.selectedEvent,
    isEventFormOpen: context.isEventFormOpen,
    closeEventForm: context.closeEventForm,
    addEvent: context.addEvent,
    updateEvent: context.updateEvent,
    deleteEvent: context.deleteEvent,
    renderEventForm: context.renderEventForm,
    events: context.events,
    getResourceGroupId: context.getResourceGroupId,
    getResourceById: context.getResourceById,
    getRuleResourceId: context.getRuleResourceId,
  }))
  console.log('selectedEvent in RuleDialog:', selectedEvent)
  if (!selectedEvent || !ruleType) return

  const [value, setValue] = useState('')
  const [endDate, setEndDate] = useState(selectedEvent.end.format('YYYY-MM-DD'))
  // const [eventForDay, setEventForDay] = useState<CalendarEvent>(selectedEvent)
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 0]) // 0 is Sun, 1 is Mon
  const [applyToRooms, setApplyToRooms] = useState<string[]>([])
  const [selectedRooms, setSelectedRooms] = useState<string[]>([])

  const anchor = useComboboxAnchor()
  const roomsInGroup = getResourceGroupId()

  // Initialize fields when dialog opens
  useEffect(() => {
    if (isOpen && selectedEvent) {
      setValue((selectedEvent.data?.Price as string) || '')
      // Change to YYYY-MM-DD format for the native date picker
      setEndDate(dayjs(selectedEvent.start).format('YYYY-MM-DD'))
      setApplyToRooms([String(getResourceById(selectedEvent.resourceId)?.groupId)])
    }
  }, [isOpen, selectedEvent])

  const handleConfirm = () => {
    const start = selectedEvent.start
    const end = (
      endDate !== '' ? 
        dayjs(endDate) : 
        selectedEvent.end
    ).add(1, 'day')

    for (var day = dayjs(start); day.isBefore(end); day = day.add(1, 'day')) {

      const isSelectedDay  = selectedDays.includes(day.day())
      if (!isSelectedDay) continue

      for (const groupId of applyToRooms) {
        const ruleResourceId = getRuleResourceId(groupId, ruleType)
        if (!ruleResourceId) {
          console.error(`No rule resource found for groupId: ${groupId}`)
          continue
        }

        const eventForDay = { 
          ...selectedEvent,
          id: `rule-${ruleResourceId}-${day.startOf('day').valueOf()}`,
          title: t(`RESOURCE_RULE_EVENT-${ruleResourceId}`),
          start: day.startOf('day'),
          end: day.endOf('day'),
          resourceId: ruleResourceId,
          data: {
            ...selectedEvent.data,
            Price: value,
          },
        }

        const isEventValid = (eventForDay && (eventForDay.id !== undefined))
        if (!isEventValid) {
          console.error('No selected event to update.')
          continue
        }

        const isEventNew = (events.some((e) => e.id === eventForDay.id) === false)
        if (!isEventNew && isEventValid) {
          updateEvent(eventForDay.id, eventForDay)
        } else {
          addEvent(eventForDay)
        }
      }
    }

    onSubmit(value)
    setValue('') // Reset for next time
    onClose()
  }

  // Helper for checkboxes
  const toggleDay = (dayId: number, checked: boolean) => {
    if (checked) {
      setSelectedDays((prev) => [...prev, dayId])
    } else {
      setSelectedDays((prev) => prev.filter((d) => d !== dayId))
    }
  }

  const startDateFormatted = selectedEvent?.start
    ? dayjs(selectedEvent.start).format('ddd DD MMM YYYY')
    : ''

  console.log('roomsInGroup:', roomsInGroup)
  console.log('applyToRooms:', applyToRooms)
  console.log('selectedEvent.resourceId:', selectedEvent.resourceId)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()} modal={false}>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="flex flex-col gap-5 py-2">
          {/* Price & Apply To Row */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="rule-input" className="text-muted-foreground">
              {label}
            </Label>
            <div className="flex items-center gap-2">
              <div className=" min-w-[220px] relative flex items-center flex-1">
                {prefix && (
                  <span className="absolute left-3 text-muted-foreground text-sm">
                    {prefix}
                  </span>
                )}
                <Input
                  id="rule-input"
                  type="number"
                  placeholder={placeholder}
                  className={`flex-1 ${prefix ? 'pl-7' : ''} ${suffix ? 'pr-12' : ''}`}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  autoFocus
                />
                {suffix && (
                  <span className="absolute right-3 text-muted-foreground text-sm">
                    {suffix}
                  </span>
                )}
              </div>
              <Combobox
                multiple
                autoHighlight
                items={roomsInGroup}
                value={applyToRooms}
                defaultValue={[roomsInGroup[1]]}
                onValueChange={(details) => {
                  console.log('Selected rooms:', details)
                  setApplyToRooms(details.map(detail => String(detail)))
                }}
              >
                <ComboboxChips ref={anchor} className="w-full max-w-xs">
                  <ComboboxValue>
                    {(values) => (
                      <React.Fragment>
                        {values.map((value: string) => (
                          <ComboboxChip key={value}>{value}</ComboboxChip>
                        ))}
                        <ComboboxChipsInput />
                      </React.Fragment>
                    )}
                  </ComboboxValue>
                </ComboboxChips>
                <ComboboxContent anchor={anchor}>
                  <ComboboxEmpty>No items found.</ComboboxEmpty>
                  <ComboboxList>
                    {(item) => (
                      <ComboboxItem key={item} value={item}>
                        {item}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
              <Select>
                <SelectTrigger className="w-[50px] px-3">
                  <SelectValue placeholder={<Settings className="w-4 h-4" />} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="settings">Settings</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Range Section */}
          <div className="flex flex-col gap-2">
            <Label className="font-bold text-[15px]">Set date range</Label>
            <span className="text-sm text-foreground mb-1">
              {startDateFormatted} to
            </span>
            <Input
              type="date" // <--- THIS ADDS THE CALENDAR POPUP
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-[220px]"
            />
          </div>

          {/* Weekday Checkboxes */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-1">
            {[
              { id: 1, label: 'Mon' },
              { id: 2, label: 'Tue' },
              { id: 3, label: 'Wed' },
              { id: 4, label: 'Thu' },
              { id: 5, label: 'Fri' },
              { id: 6, label: 'Sat' },
              { id: 0, label: 'Sun' },
            ].map((day) => (
              <div key={day.id} className="flex items-center space-x-1.5">
                <Checkbox
                  id={`day-${day.id}`}
                  checked={selectedDays.includes(day.id)}
                  onCheckedChange={(checked) => toggleDay(day.id, checked === true)}
                />
                <label
                  htmlFor={`day-${day.id}`}
                  className="text-sm cursor-pointer"
                >
                  {day.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <DialogClose asChild>
            <Button
              variant="outline"
              className="rounded-full px-6"
              onClick={() => setValue('')}
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            className="rounded-full px-8 bg-[#009EE2] hover:bg-[#009EE2]/90 text-white"
            onClick={handleConfirm}
            disabled={!value}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}