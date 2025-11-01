import { useMemo, useState } from 'react'
import { addDays, startOfDay, endOfDay, parseISO, addWeeks, differenceInCalendarDays, isSameDay } from 'date-fns'
import ManageButton from './ManageButton'
import { useSelector, useDispatch } from 'react-redux'
import { addEvent, updateEvent, deleteEvent } from '../store/slices/calendarSlice'
import CalendarGrid from './CalendarGrid'
import EventModal from './EventModal'
import LinksModal from './LinksModal'

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

    const timeOffset = event.timeOffset || 0 // 获取时间偏移（分钟）
    
    const pushOccurrence = (day) => {
      const occurrenceStart = new Date(day)
      occurrenceStart.setHours(start.getHours(), start.getMinutes() + timeOffset, start.getSeconds(), start.getMilliseconds())
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
  const [draggedEventId, setDraggedEventId] = useState(null)
  const [dropIndicator, setDropIndicator] = useState(null)
  const [linksModal, setLinksModal] = useState({ open: false, links: [], eventTitle: '' })

  const today = useMemo(() => new Date(), [])
  const displayDays = useMemo(() => dayOffsets.map(offset => addDays(today, offset)), [today])
  const rangeStart = startOfDay(displayDays[0])
  const rangeEnd = endOfDay(displayDays[displayDays.length - 1])

  const sortedEvents = useMemo(() => {
    const expanded = expandEventsWithinRange(events, rangeStart, rangeEnd)
    return expanded.sort((a, b) => {
      // 如果有序列号，按序列号排序
      if (a.sequence && b.sequence) {
        const [aHour, aSub] = a.sequence.split('-').map(Number)
        const [bHour, bSub] = b.sequence.split('-').map(Number)
        if (aHour !== bHour) return aHour - bHour
        if (aSub !== bSub) return aSub - bSub
      }
      // 否则按时间排序
      const aStart = parseISO(a.start)
      const bStart = parseISO(b.start)
      if (aStart.getHours() !== bStart.getHours()) {
        return aStart.getHours() - bStart.getHours()
      }
      if (aStart.getMinutes() !== bStart.getMinutes()) {
        return aStart.getMinutes() - bStart.getMinutes()
      }
      return a.id.localeCompare(b.id)
    })
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
    // 获取基础事件（处理重复事件的链接）
    const originId = event._originId || event.id
    const baseEvent = events.find(existing => existing.id === originId) || event
    
    // 优先检查 links 数组（新格式）
    if (baseEvent.links && Array.isArray(baseEvent.links) && baseEvent.links.length > 0) {
      // 如果有多个链接或链接有标题，显示选择弹窗
      const hasTitles = baseEvent.links.some(link => link.title && link.title.trim())
      if (baseEvent.links.length > 1 || hasTitles) {
        setLinksModal({
          open: true,
          links: baseEvent.links,
          eventTitle: baseEvent.title || event.title
        })
        return
      }
      // 只有一个链接且没有标题，直接打开
      if (baseEvent.links.length === 1 && baseEvent.links[0].url) {
        const target = baseEvent.links[0].url.startsWith('http') ? baseEvent.links[0].url : `https://${baseEvent.links[0].url}`
        window.open(target, '_blank', 'noopener,noreferrer')
        return
      }
    }
    
    // 兼容旧格式：单个 link 字符串
    if (baseEvent.link) {
      const target = baseEvent.link.startsWith('http') ? baseEvent.link : `https://${baseEvent.link}`
      window.open(target, '_blank', 'noopener,noreferrer')
    }
  }

  const toggleEditMode = () => {
    setIsEditMode(prev => !prev)
    setEditingEvent(null)
    setIsEventModalOpen(false)
    setDraggedEventId(null)
    setDropIndicator(null)
  }

  // 获取或生成事件的序列号（格式：小时-索引，如 "8-1", "9-2"）
  const getEventSequence = (event, day, hour) => {
    if (event.sequence) return event.sequence
    // 如果没有序列号，根据时间生成：小时 = 序号（8点=1，9点=2...）
    const hourSequence = hour - 7 // 8点=1, 9点=2...
    // 同一时间段内的索引从1开始
    const sameSlotEvents = sortedEvents.filter(ev => {
      const eventStart = parseISO(ev.start)
      return isSameDay(eventStart, day) && eventStart.getHours() === hour
    })
    const index = sameSlotEvents.findIndex(ev => ev.id === event.id)
    return `${hourSequence}-${index + 1}`
  }

  // 拖拽开始
  const handleEventDragStart = (e, eventId) => {
    if (!isEditMode) return
    e.stopPropagation()
    setDraggedEventId(eventId)
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', eventId)
    }
  }

  // 拖拽悬停 - 显示预览线
  const handleEventDragOver = (e, targetEventId, day, hour) => {
    if (!isEditMode) {
      e.preventDefault()
      return
    }
    
    if (!targetEventId || draggedEventId === targetEventId) {
      e.preventDefault()
      return
    }

    const sourceEvent = sortedEvents.find(ev => ev.id === draggedEventId)
    const targetEvent = sortedEvents.find(ev => ev.id === targetEventId)
    if (!sourceEvent || !targetEvent) {
      e.preventDefault()
      return
    }

    const sourceStart = parseISO(sourceEvent.start)
    const targetStart = parseISO(targetEvent.start)

    // 严格检查：只能在同一时间段内拖动（同一日期同一小时）
    const sourceDay = sourceStart.getDate()
    const sourceMonth = sourceStart.getMonth()
    const sourceYear = sourceStart.getFullYear()
    const sourceHour = sourceStart.getHours()
    
    const targetDay = day.getDate()
    const targetMonth = day.getMonth()
    const targetYear = day.getFullYear()
    const targetHour = hour
    
    const targetEventDay = targetStart.getDate()
    const targetEventMonth = targetStart.getMonth()
    const targetEventYear = targetStart.getFullYear()
    const targetEventHour = targetStart.getHours()

    // 源事件、目标事件和当前格子必须完全匹配（年月日小时）
    // 必须同时满足：源事件在当前格子，目标事件也在当前格子
    const sourceMatches = sourceYear === targetYear && sourceMonth === targetMonth && sourceDay === targetDay && sourceHour === targetHour
    const targetMatches = targetEventYear === targetYear && targetEventMonth === targetMonth && targetEventDay === targetDay && targetEventHour === targetHour

    if (sourceMatches && targetMatches) {
      e.preventDefault()
      e.stopPropagation()
      const rect = e.currentTarget.getBoundingClientRect()
      const offsetY = e.clientY - rect.top
      
      // 使用更精确的位置判断，考虑事件的高度
      // 使用30%作为上方阈值，70%作为下方阈值，中间40%为缓冲区域
      const relativePosition = offsetY / rect.height
      const position = relativePosition < 0.3 ? 'before' : (relativePosition > 0.7 ? 'after' : (offsetY < rect.height / 2 ? 'before' : 'after'))
      
      setDropIndicator({ eventId: targetEventId, position })
    } else {
      // 如果不在同一时间段，阻止拖拽并清除指示器
      e.preventDefault()
      // 不立即清除，让离开事件处理
    }
  }
  
  // 处理容器级别的拖拽悬停（事件之间的空白区域）
  const handleContainerDragOver = (e, day, hour) => {
    if (!isEditMode || !draggedEventId) {
      e.preventDefault()
      return
    }
    
    const sourceEvent = sortedEvents.find(ev => ev.id === draggedEventId)
    if (!sourceEvent) {
      e.preventDefault()
      return
    }

    const sourceStart = parseISO(sourceEvent.start)
    const sourceDay = sourceStart.getDate()
    const sourceMonth = sourceStart.getMonth()
    const sourceYear = sourceStart.getFullYear()
    const sourceHour = sourceStart.getHours()
    
    const targetDay = day.getDate()
    const targetMonth = day.getMonth()
    const targetYear = day.getFullYear()
    const targetHour = hour

    // 检查源事件是否在当前时间段
    const sourceMatches = sourceYear === targetYear && sourceMonth === targetMonth && sourceDay === targetDay && sourceHour === targetHour

    if (sourceMatches) {
      e.preventDefault()
      // 在容器上悬停时不显示指示器，让事件元素处理
    } else {
      e.preventDefault()
    }
  }

  // 拖拽离开
  const handleEventDragLeave = (e, targetEventId) => {
    if (!isEditMode) return
    
    // 检查是否真正离开了元素（relatedTarget可能是子元素）
    const relatedTarget = e.relatedTarget
    if (relatedTarget && e.currentTarget.contains(relatedTarget)) {
      return
    }
    
    // 如果指示器是针对当前事件的，清除它
    if (dropIndicator?.eventId === targetEventId) {
      setDropIndicator(null)
    }
  }

  // 拖拽放下 - 根据预览线位置重新分配序列号
  const handleEventDrop = (e, targetEventId, day, hour) => {
    if (!isEditMode) return
    e.preventDefault()
    e.stopPropagation()

    const sourceEventId = draggedEventId || e.dataTransfer?.getData('text/plain')
    if (!sourceEventId || !targetEventId || sourceEventId === targetEventId) {
      setDraggedEventId(null)
      setDropIndicator(null)
      return
    }

    // 获取源事件和目标事件
    const sourceEvent = sortedEvents.find(ev => ev.id === sourceEventId)
    const targetEvent = sortedEvents.find(ev => ev.id === targetEventId)
    if (!sourceEvent || !targetEvent) {
      setDraggedEventId(null)
      setDropIndicator(null)
      return
    }

    const sourceStart = parseISO(sourceEvent.start)
    const targetStart = parseISO(targetEvent.start)

    // 严格检查：确保源事件和目标事件在同一时间段（同一日期同一小时）
    const sourceDay = sourceStart.getDate()
    const sourceMonth = sourceStart.getMonth()
    const sourceYear = sourceStart.getFullYear()
    const sourceHour = sourceStart.getHours()
    
    const targetDay = day.getDate()
    const targetMonth = day.getMonth()
    const targetYear = day.getFullYear()
    const targetHour = hour
    
    const targetEventDay = targetStart.getDate()
    const targetEventMonth = targetStart.getMonth()
    const targetEventYear = targetStart.getFullYear()
    const targetEventHour = targetStart.getHours()

    // 如果不在同一时间段，不允许拖拽
    if (
      !(sourceYear === targetYear && sourceMonth === targetMonth && sourceDay === targetDay && sourceHour === targetHour) ||
      !(targetEventYear === targetYear && targetEventMonth === targetMonth && targetEventDay === targetDay && targetEventHour === targetHour)
    ) {
      setDraggedEventId(null)
      setDropIndicator(null)
      return
    }

    // 获取同一天同一小时的所有事件
    const sameSlotEvents = sortedEvents.filter(ev => {
      const eventStart = parseISO(ev.start)
      const eventDay = eventStart.getDate()
      const eventMonth = eventStart.getMonth()
      const eventYear = eventStart.getFullYear()
      const eventHour = eventStart.getHours()
      return (
        eventYear === targetYear && 
        eventMonth === targetMonth && 
        eventDay === targetDay && 
        eventHour === targetHour
      )
    }).sort((a, b) => {
      // 先按序列号排序，如果没有序列号则按分钟数排序
      const hourSequence = hour - 7
      // 如果事件有序列号且小时序号匹配，使用序列号排序
      if (a.sequence && b.sequence) {
        const [aHour, aSub] = a.sequence.split('-').map(Number)
        const [bHour, bSub] = b.sequence.split('-').map(Number)
        if (aHour === hourSequence && bHour === hourSequence) {
          return aSub - bSub
        }
      }
      // 否则按分钟数排序
      const aStart = parseISO(a.start)
      const bStart = parseISO(b.start)
      if (aStart.getMinutes() !== bStart.getMinutes()) {
        return aStart.getMinutes() - bStart.getMinutes()
      }
      return a.id.localeCompare(b.id)
    })

    const sourceIndex = sameSlotEvents.findIndex(ev => ev.id === sourceEventId)
    const targetIndex = sameSlotEvents.findIndex(ev => ev.id === targetEventId)

    if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) {
      setDraggedEventId(null)
      setDropIndicator(null)
      return
    }

    // 根据预览线位置计算新索引
    const position = dropIndicator?.eventId === targetEventId ? dropIndicator.position : 'after'
    let newIndex = position === 'before' ? targetIndex : targetIndex + 1
    if (sourceIndex < newIndex) {
      newIndex -= 1
    }

    // 重新分配序列号：hourSequence-subIndex
    const hourSequence = hour - 7 // 8点=1, 9点=2...

    // 创建新的事件数组（移除源事件）
    const reordered = [...sameSlotEvents]
    const [moved] = reordered.splice(sourceIndex, 1)
    reordered.splice(newIndex, 0, moved)

    // 重新分配序列号和更新时间（每个事件间隔5分钟）
    reordered.forEach((event, index) => {
      const newSequence = `${hourSequence}-${index + 1}`
      const targetMinute = index * 5

      const originId = event._originId || event.id
      const baseEvent = events.find(existing => existing.id === originId)
      if (!baseEvent) return

      // 使用当前事件实例的时间作为基准（而不是原始时间）
      const currentEventStart = parseISO(event.start)
      const currentEventEnd = parseISO(event.end)
      const duration = currentEventEnd.getTime() - currentEventStart.getTime()

      // 计算新的开始时间 - 保持当前日期，只更新小时和分钟
      const newStart = new Date(currentEventStart)
      newStart.setHours(hour)
      newStart.setMinutes(targetMinute)
      newStart.setSeconds(0)
      newStart.setMilliseconds(0)

      const newEnd = new Date(newStart.getTime() + duration)

      const recurrence = baseEvent.recurrence || 'once'
      if (recurrence === 'daily' || recurrence === 'weekly') {
        // 对于重复事件，计算相对于原始时间的偏移
        const originalStart = parseISO(baseEvent.start)
        const originalHour = originalStart.getHours()
        const originalMinute = originalStart.getMinutes()
        const originalTotalMinutes = originalHour * 60 + originalMinute
        
        // 当前事件在当前这一天的实际分钟数
        const currentDayStart = new Date(currentEventStart)
        currentDayStart.setHours(0, 0, 0, 0)
        const currentEventTotalMinutes = (currentEventStart.getTime() - currentDayStart.getTime()) / (1000 * 60)
        
        // 新的分钟数
        const newTotalMinutes = hour * 60 + targetMinute
        
        // 计算timeOffset：相对于原始时间的偏移 = 新位置 - 原位置
        // 但是需要考虑这是相对于原始时间的偏移
        const currentOffset = baseEvent.timeOffset || 0
        const minuteDiff = newTotalMinutes - currentEventTotalMinutes
        const newTimeOffset = currentOffset + minuteDiff

        dispatch(updateEvent({
          id: originId,
          start: newStart.toISOString(),
          end: newEnd.toISOString(),
          sequence: newSequence,
          timeOffset: newTimeOffset,
        }))
      } else {
        // 一次性事件，直接更新
        dispatch(updateEvent({
          id: originId,
          start: newStart.toISOString(),
          end: newEnd.toISOString(),
          sequence: newSequence,
        }))
      }
    })

    setDraggedEventId(null)
    setDropIndicator(null)
  }

  // 拖拽结束
  const handleEventDragEnd = () => {
    setDraggedEventId(null)
    setDropIndicator(null)
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
          onDeleteEvent={handleDeleteEvent}
          onEventDragStart={handleEventDragStart}
          onEventDragOver={handleEventDragOver}
          onEventDragLeave={handleEventDragLeave}
          onEventDrop={handleEventDrop}
          onEventDragEnd={handleEventDragEnd}
          draggedEventId={draggedEventId}
          dropIndicator={dropIndicator}
          isEditMode={isEditMode}
          today={today}
        />
      </div>

      <LinksModal
        isOpen={linksModal.open}
        onClose={() => setLinksModal({ open: false, links: [], eventTitle: '' })}
        links={linksModal.links}
        eventTitle={linksModal.eventTitle}
      />

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
