import './lib/dayjs-locales'

import type { CalendarEvent, Resource } from '@ilamy/calendar'
import { useState } from 'react'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import dayjs from 'dayjs'
import { CalendarDisplay } from './components/calendar-display'
import { CalendarSettings } from './components/calendar-settings'
import { defaultSettings, type PlaygroundSettings } from './types/settings-form'

const generateYearlyLoad = (): CalendarEvent[] => {
  const events: CalendarEvent[] = [];
  const resources = ['room-1', 'room-2', 'room-3', 'room-4', 'room-5'];
  const startDate = dayjs().startOf('year');

  // Loop through every day of the year (365 days)
  for (let day = 0; day < 365; day++) {
    // Loop through every room
    for (const resourceId of resources) {
      const eventDate = startDate.add(day, 'day');
      // Spread the events across the 24-hour clock so they don't overlap
      const hour = (day + parseInt(resourceId.split('-')[1])) % 24;

      events.push({
        id: `event-${day}-${resourceId}`,
        title: `Room ${resourceId.split('-')[1]} Activity`,
        start: eventDate.set('hour', hour).toDate(),
        end: eventDate.set('hour', hour + 1).toDate(),
        resourceId: resourceId,
        allDay: false,
      });
    }
  }
  return events;
};

// Update your state hook:




// Just your raw data with groupId. The calendar handles the rest!
// const roomsData: Resource[] = [
//   { id: 'room-1', title: '1', groupId: 'standard', groupTitle: 'Standard Room', color: '#ef4444' },
//   { id: 'room-2', title: '2', groupId: 'standard', color: '#ef4444' },
//   { id: 'room-3', title: '3', groupId: 'standard', color: '#ef4444' },
//   { id: 'room-4', title: '4', groupId: 'deluxe', groupTitle: 'Deluxe Double Room with Garden', color: '#ef4444' },
//   { id: 'room-5', title: '5', groupId: 'deluxe', color: '#ef4444' },
// ]

const roomsData: Resource[] = [
  { id: 'room-1', title: '1', groupId: 'standard', groupTitle: 'Standard Room', color: '#ef4444' },
  { id: 'room-2', title: '2', groupId: 'standard', color: '#ef4444' },
  { id: 'room-3', title: '3', groupId: 'standard', color: '#ef4444' },

  { id: 'room-4', title: '4', groupId: 'deluxe', groupTitle: 'Deluxe Double Room with Garden', color: '#3b82f6' },
  { id: 'room-5', title: '5', groupId: 'deluxe', color: '#3b82f6' },

  { id: 'room-6', title: '6', groupId: 'suite', groupTitle: 'Executive Suite', color: '#10b981' },
  { id: 'room-7', title: '7', groupId: 'suite', color: '#10b981' },

  { id: 'room-8', title: '8', groupId: 'family', groupTitle: 'Family Room', color: '#f59e0b' },
  { id: 'room-9', title: '9', groupId: 'family', color: '#f59e0b' },
  { id: 'room-10', title: '10', groupId: 'family', color: '#f59e0b' },

  { id: 'room-11', title: '11', groupId: 'villa', groupTitle: 'Private Villa', color: '#8b5cf6' },
  { id: 'room-12', title: '12', groupId: 'villa', color: '#8b5cf6' },

  { id: 'room-13', title: '13', groupId: 'penthouse', groupTitle: 'Penthouse', color: '#ec4899' },
  { id: 'room-14', title: '14', groupId: 'penthouse', color: '#ec4899' },

  { id: 'room-15', title: '15', groupId: 'presidential', groupTitle: 'Presidential Suite', color: '#6366f1' },
]

const initialBookings: CalendarEvent[] = [
  {
    id: 'booking-1',
    title: 'John Doe',
    start: dayjs().set('hour', 14).set('minute', 0).toDate(), 
    end: dayjs().add(2, 'day').set('hour', 11).set('minute', 0).toDate(),  
    resourceId: 'room-2',
    data: { status: 'checked-in' }
  }
]

export function Playground() {
  const form = useForm<PlaygroundSettings>({ defaultValues: defaultSettings })
  // We keep this to render settings, but we ignore the resource picker
  const calendarType = useWatch({ control: form.control, name: 'calendarType' })

  const [events, setEvents] = useState<CalendarEvent[]>(initialBookings)
  // Then, update your state initialization in the Playground component:
  // const [events, setEvents] = useState<CalendarEvent[]>(() => generateYearlyLoad());

  const onEventAdd = (event: CalendarEvent) => {
    setEvents((prev) => [...prev, event])
  }
  const onEventUpdate = (event: CalendarEvent) => {
    setEvents((prev) => prev.map((e) => (e.id === event.id ? event : e)))
  }
  const onEventDelete = (event: CalendarEvent) => {
    setEvents((prev) => prev.filter((e) => e.id !== event.id))
  }

  return (
    <FormProvider {...form}>
      <div
        className="container mx-auto px-4 py-8 relative"
        data-testid="playground"
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-linear-to-br from-blue-600 to-indigo-700 dark:from-blue-400 dark:to-indigo-500">
            Interactive Demo
          </h1>
          <p className="text-muted-foreground">
            Try out the ilamy Calendar components.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <CalendarSettings />
          </div>

          <div className="lg:col-span-3">
            <CalendarDisplay
              activeResources={roomsData} // <-- Pass it raw. No useMemo mapping.
              customEvents={events}
              onEventAdd={onEventAdd}
              onEventDelete={onEventDelete}
              onEventUpdate={onEventUpdate}
              resourceEvents={events} 
            />
          </div>
        </div>
      </div>
    </FormProvider>
  )
}