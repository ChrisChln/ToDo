import { useMemo, useState } from 'react'
import { addDays, startOfDay, endOfDay, parseISO, addWeeks, differenceInCalendarDays } from 'date-fns'
import ManageButton from './ManageButton'
import { useSelector, useDispatch } from 'react-redux'
import { addEvent, updateEvent, deleteEvent } from '../store/slices/calendarSlice'
import CalendarGrid from './CalendarGrid'
import EventModal from './EventModal'

const dayOffsets = [-3, -2, -1, 0, 1, 2, 3]

const getDateKey = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const expandEventsWithinRange = (events, rangeStart, rangeEnd) => {
  const occurrences = []

  events.forEach((event) => {
    const recurrence = event.recurrence || 'once'
    const start = parseISO(event.start)
    const end = parseISO(event.end)
    const duration = end.getTime() - start.getTime()
    const originId = event.id
    const baseDay = startOfDay(start)

    const completedOccurrences = Array.isArray(event.completedOccurrences)
      ? new Set(event.completedOccurrences)
      : new Set()

    const pushOccurrence = (day) => {
      const occurrenceStart = new Date(day)
      occurrenceStart.setHours(start.getHours(), start.getMinutes(), start.getSeconds(), start.getMilliseconds())
      const occurrenceEnd = new Date(occurrenceStart.getTime() + duration)
      if (occurrenceEnd < rangeStart || occurrenceStart > rangeEnd) {
        return
      }
      const occurrenceKey = getDateKey(occurrenceStart)
      const isCompleted = recurrence === 'once'
        ? !!event.completed
        : completedOccurrences.has(occurrenceKey)
      occurrences.push({
        ...event,
        id: `${originId}_${occurrenceStart.toISOString()}`,
        start: occurrenceStart.toISOString(),
        end: occurrenceEnd.toISOString(),
        _originId: originId,
        _occurrenceKey: occurrenceKey,
        completed: isCompleted,
      })
    }

    if (recurrence === 'daily') {
      let cursor = baseDay
      if (cursor < startOfDay(rangeStart)) {
        const diff = differenceInCalendarDays(startOfDay(rangeStart), cursor)
        cursor = addDays(cursor, diff)
      }
      while (cursor <= rangeEnd) {
        pushOccurrence(cursor)
        cursor = addDays(cursor, 1)
      }
    } else if (recurrence === 'weekly') {
      let cursor = baseDay
      while (cursor < startOfDay(rangeStart)) {
        cursor = addWeeks(cursor, 1)
      }
      while (cursor <= rangeEnd) {
        pushOccurrence(cursor)
        cursor = addWeeks(cursor, 1)
      }
    } else {
      pushOccurrence(baseDay)
    }
  })

  return occurrences
}

function CalendarView() {
  const dispatch = useDispatch()
  const events = useSelector(state => state.calendar?.events || [])
  const isDark = useSelector(state => state.theme?.isDark || false)
  const primaryColor = useSelector(state => state.theme?.primaryColor || '#A78BFA')
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null)
  const [editingEvent, setEditingEvent] = useState(null)
  const [isEditMode, setIsEditMode] = useState(false)

  const today = useMemo(() => new Date(), [])
  const displayDays = useMemo(() => dayOffsets.map(offset => addDays(today, offset)), [today])
  const rangeStart = startOfDay(displayDays[0])
  const rangeEnd = endOfDay(displayDays[displayDays.length - 1])

  const sortedEvents = useMemo(() => {
    const expanded = expandEventsWithinRange(events, rangeStart, rangeEnd)
    return expanded.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  }, [events, rangeStart, rangeEnd])

  const closeModal = () => {
    setIsEventModalOpen(false)
    setEditingEvent(null)
    setSelectedTimeSlot(null)
  }

  const handleAddEvent = (eventData) => {
    dispatch(addEvent(eventData))
  }

  const handleUpdateEvent = (eventData) => {
    dispatch(updateEvent(eventData))
  }

  const handleDeleteEvent = (eventId) => {
    dispatch(deleteEvent(eventId))
  }

  const handleTimeSlotClick = (date, time) => {
    setSelectedTimeSlot({ date, time })
    setEditingEvent(null)
    setIsEventModalOpen(true)
  }

  const handleEventClick = (event) => {
    const originId = event._originId || event.id
    const baseEvent = events.find(existing => existing.id === originId)
    if (!baseEvent) return
    setEditingEvent(baseEvent)
    const startDate = new Date(event.start)
    setSelectedTimeSlot({ date: startDate, time: startDate.getHours() })
    setIsEventModalOpen(true)
  }

  const handleToggleComplete = (event) => {
    const originId = event._originId || event.id
    const baseEvent = events.find(existing => existing.id === originId)
    if (!baseEvent) return
    const recurrence = baseEvent.recurrence || 'once'
    if (recurrence === 'once') {
      dispatch(updateEvent({ id: originId, completed: !baseEvent.completed }))
      return
    }

    const occurrenceKey = event._occurrenceKey
    if (!occurrenceKey) return

    const completedOccurrences = new Set(baseEvent.completedOccurrences || [])
    if (completedOccurrences.has(occurrenceKey)) {
      completedOccurrences.delete(occurrenceKey)
    } else {
      completedOccurrences.add(occurrenceKey)
    }

    dispatch(updateEvent({ id: originId, completedOccurrences: Array.from(completedOccurrences) }))
  }

  const handleOpenLink = (event) => {
    if (event.link) {
      const target = event.link.startsWith('http') ? event.link : `https://${event.link}`
      window.open(target, '_blank', 'noopener,noreferrer')
    }
  }

  const toggleEditMode = () => {
    setIsEditMode(prev => !prev)
    setEditingEvent(null)
    setIsEventModalOpen(false)
  }

  return (
    <div className={`flex-1 overflow-y-auto transition-colors ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="p-8">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              日历
            </h1>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              管理你的日程与任务
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ManageButton active={isEditMode} onClick={toggleEditMode} inactiveText="管理" activeText="完成" />
          </div>
        </div>

        <CalendarGrid
          events={sortedEvents}
          displayDays={displayDays}
          onTimeSlotClick={handleTimeSlotClick}
          onEventClick={handleEventClick}
          onToggleComplete={handleToggleComplete}
          onOpenLink={handleOpenLink}
          isEditMode={isEditMode}
          today={today}
        />
      </div>

      {isEventModalOpen && (
        <EventModal
          isOpen={isEventModalOpen}
          onClose={closeModal}
          onSubmit={(data, mode) => {
            if (mode === 'edit') {
              handleUpdateEvent(data)
            } else {
              handleAddEvent(data)
            }
            closeModal()
          }}
          onDelete={(id) => {
            handleDeleteEvent(id)
            closeModal()
          }}
          selectedTimeSlot={selectedTimeSlot}
          eventData={editingEvent}
        />
      )}
    </div>
  )
}

export default CalendarView
