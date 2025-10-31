import { useSelector } from 'react-redux'
import { CheckSquare, Square, SquareArrowOutUpRight } from 'lucide-react'

function CalendarCell({
  events,
  onClick,
  onEventClick,
  onToggleComplete,
  onOpenLink,
  onDeleteEvent,
  onEventDragStart,
  onEventDragOver,
  onEventDragLeave,
  onEventDrop,
  onEventDragEnd,
  draggedEventId,
  dropIndicator,
  isEditMode,
  showHourLabel = false,
  hourLabel = '',
  isToday = false,
  isFirstColumn = false,
  isRestDay = false,
  day,
  hour,
}) {
  const isDark = useSelector(state => state.theme?.isDark || false)
  const primaryColor = useSelector(state => state.theme?.primaryColor || '#A78BFA')

  const handleEventContainerClick = (event) => {
    event.stopPropagation()
  }

  // 休息日不显示左边框
  const baseBorderClass = (isFirstColumn || isRestDay) ? '' : 'border-l'
  
  // 动态计算 hover 颜色
  const getHoverColor = () => {
    if (!isEditMode) return 'cursor-default'
    const hex = primaryColor.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    const lighten = (val) => Math.min(255, val + (isDark ? 30 : 180))
    return `cursor-pointer`
  }
  const hoverClass = getHoverColor()

  const normalizeHex = (value) => {
    if (typeof value === 'string') {
      const hex = value.trim().replace(/^#/, '')
      if (/^[0-9A-Fa-f]{6}$/.test(hex)) {
        return `#${hex.toUpperCase()}`
      }
    }
    return primaryColor
  }

  const adjustColor = (hex, amount) => {
    const normalized = normalizeHex(hex).slice(1)
    const num = parseInt(normalized, 16)
    const clamp = (channel) => Math.max(0, Math.min(255, channel))
    const r = clamp(((num >> 16) & 255) + amount)
    const g = clamp(((num >> 8) & 255) + amount)
    const b = clamp((num & 255) + amount)
    const toHex = (value) => value.toString(16).padStart(2, '0')
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
  }

  // 计算单元格的背景色和纹理
  const getCellBgStyle = () => {
    if (isRestDay) {
      // 休息日使用深色主题色背景 + 斜线纹理
      const hex = primaryColor.replace('#', '')
      const r = parseInt(hex.substr(0, 2), 16)
      const g = parseInt(hex.substr(2, 2), 16)
      const b = parseInt(hex.substr(4, 2), 16)
      // 加深颜色作为基础色（提高对比度）
      const darkenForRestDay = (val) => Math.max(0, val - 160)
      const darkenForPattern = (val) => Math.max(0, val - 130)
      const baseR = darkenForRestDay(r)
      const baseG = darkenForRestDay(g)
      const baseB = darkenForRestDay(b)
      const patternR = darkenForPattern(r)
      const patternG = darkenForPattern(g)
      const patternB = darkenForPattern(b)
      const baseColor = isDark 
        ? `rgba(${baseR}, ${baseG}, ${baseB}, 0.85)`
        : `rgba(${baseR}, ${baseG}, ${baseB}, 0.8)`
      const patternColor = isDark
        ? `rgba(${patternR}, ${patternG}, ${patternB}, 0.85)`
        : `rgba(${patternR}, ${patternG}, ${patternB}, 0.8)`
      return {
        backgroundImage: `repeating-linear-gradient(45deg, ${baseColor}, ${baseColor} 6px, ${patternColor} 6px, ${patternColor} 12px)`,
        backgroundColor: baseColor, // 备用背景色
      }
    }
    if (isToday) {
      const hex = primaryColor.replace('#', '')
      const r = parseInt(hex.substr(0, 2), 16)
      const g = parseInt(hex.substr(2, 2), 16)
      const b = parseInt(hex.substr(4, 2), 16)
      return {
        backgroundColor: isDark 
          ? `rgba(${r}, ${g}, ${b}, 0.15)`
          : `rgba(${r}, ${g}, ${b}, 0.1)`
      }
    }
    return {}
  }

  return (
    <div
      className={`relative min-h-[70px] p-3 transition-colors ${hoverClass} ${baseBorderClass}`}
      style={{
        ...getCellBgStyle(),
        // 边框设置
        ...(isRestDay ? {
          // 休息日不显示任何边框
          borderLeftWidth: 0,
          borderBottomWidth: 0,
          borderTopWidth: 0,
          borderRightWidth: 0,
        } : (() => {
          const hex = primaryColor.replace('#', '')
          const r = parseInt(hex.substr(0, 2), 16)
          const g = parseInt(hex.substr(2, 2), 16)
          const b = parseInt(hex.substr(4, 2), 16)
          const borderColor = `rgba(${r}, ${g}, ${b}, ${isDark ? 0.5 : 0.35})`
          return {
            // 左边框（第一列除外）
            ...(isFirstColumn ? {} : { borderLeftColor: borderColor }),
            // 底边框（所有非休息日单元格都有）
            borderBottomWidth: '1px',
            borderBottomColor: borderColor,
          }
        })()),
      }}
      onMouseEnter={(e) => {
        if (isEditMode && !isRestDay) {
          const hex = primaryColor.replace('#', '')
          const r = parseInt(hex.substr(0, 2), 16)
          const g = parseInt(hex.substr(2, 2), 16)
          const b = parseInt(hex.substr(4, 2), 16)
          const lighten = (val) => Math.min(255, val + (isDark ? 30 : 180))
          e.currentTarget.style.backgroundColor = `rgba(${lighten(r)}, ${lighten(g)}, ${lighten(b)}, ${isDark ? 0.5 : 0.3})`
        }
      }}
      onMouseLeave={(e) => {
        if (isEditMode) {
          const bgStyle = getCellBgStyle()
          if (bgStyle.backgroundColor) {
            e.currentTarget.style.backgroundColor = bgStyle.backgroundColor
          }
          if (bgStyle.backgroundImage) {
            e.currentTarget.style.backgroundImage = bgStyle.backgroundImage
          }
        }
      }}
      onClick={() => {
        if (isEditMode) {
          onClick?.()
        }
      }}
    >
      {!isRestDay && showHourLabel && (
        <span
          className="absolute top-2 left-1/2 -translate-x-1/2 text-xs font-semibold"
          style={{
            color: isDark 
              ? (() => {
                  const hex = primaryColor.replace('#', '')
                  const r = parseInt(hex.substr(0, 2), 16)
                  const g = parseInt(hex.substr(2, 2), 16)
                  const b = parseInt(hex.substr(4, 2), 16)
                  return `rgba(${r}, ${g}, ${b}, 0.8)`
                })()
              : primaryColor
          }}
        >
          {hourLabel}
        </span>
      )}

      {!isRestDay && (
        <div 
          className={`${showHourLabel ? 'mt-6' : ''} space-y-1 relative`}
          onDragOver={(e) => {
            // 只允许在同一时间段内拖放
            if (!isEditMode || !draggedEventId) {
              e.preventDefault()
              return
            }
            // 检查被拖拽的事件是否在这个时间段内
            const sourceEvent = events.find(ev => ev.id === draggedEventId)
            if (sourceEvent) {
              const sourceStart = new Date(sourceEvent.start)
              const sourceDay = sourceStart.getDate()
              const sourceMonth = sourceStart.getMonth()
              const sourceYear = sourceStart.getFullYear()
              const sourceHour = sourceStart.getHours()
              
              const cellDay = day.getDate()
              const cellMonth = day.getMonth()
              const cellYear = day.getFullYear()
              const cellHour = hour
              
              // 只有完全匹配才允许
              if (
                sourceYear === cellYear && 
                sourceMonth === cellMonth && 
                sourceDay === cellDay && 
                sourceHour === cellHour
              ) {
                // 允许拖拽，不阻止默认行为，让事件元素处理
                e.preventDefault()
              } else {
                // 不在同一时间段，阻止拖拽
                e.preventDefault()
              }
            } else {
              e.preventDefault()
            }
          }}
        >
        {events.map((event, eventIndex) => {
          const completed = !!event.completed
          const baseColor = normalizeHex(event.color || primaryColor)
          // 完成状态：使用灰色背景和边框
          const backgroundColor = completed 
            ? (isDark ? '#6B7280' : '#9CA3AF')
            : baseColor
          const borderColor = completed
            ? (isDark ? '#4B5563' : '#6B7280')
            : adjustColor(baseColor, -80)
          const isDragged = draggedEventId === event.id
          const showIndicatorBefore = dropIndicator?.eventId === event.id && dropIndicator?.position === 'before'
          const showIndicatorAfter = dropIndicator?.eventId === event.id && dropIndicator?.position === 'after'

          return (
            <div key={event.id}>
              {showIndicatorBefore && (
                <div 
                  className="mb-1 h-0.5 rounded-full transition-all"
                  style={{ backgroundColor: primaryColor }}
                />
              )}
              <div
                draggable={isEditMode}
                onDragStart={(e) => {
                  // 如果点击的是按钮，不启动拖拽
                  if (e.target.closest('button')) {
                    e.preventDefault()
                    return
                  }
                  if (onEventDragStart) {
                    onEventDragStart(e, event.id)
                  }
                }}
                onDragOver={(e) => {
                  // 只允许在同一时间段内拖拽
                  if (!draggedEventId || draggedEventId === event.id) {
                    e.preventDefault()
                    return
                  }
                  
                  // 检查被拖拽的事件是否在这个时间段内
                  // 由于CalendarCell中的events已经过滤过，这里主要是传递给父组件检查
                  // 父组件会做更详细的检查
                  if (onEventDragOver) {
                    onEventDragOver(e, event.id, day, hour)
                  } else {
                    e.preventDefault()
                  }
                }}
                onDragLeave={(e) => {
                  if (onEventDragLeave) {
                    onEventDragLeave(e, event.id)
                  }
                }}
                onDrop={(e) => {
                  // 只允许在同一时间段内放下
                  if (!draggedEventId || draggedEventId === event.id) {
                    e.preventDefault()
                    return
                  }
                  if (onEventDrop) {
                    onEventDrop(e, event.id, day, hour)
                  } else {
                    e.preventDefault()
                  }
                }}
                onDragEnd={(e) => {
                  if (onEventDragEnd) {
                    onEventDragEnd()
                  }
                }}
                className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs shadow-sm transition-all min-h-[32px] ${
                  isEditMode ? 'cursor-move ios-wiggle' : ''
                } ${isDragged ? 'opacity-50' : ''}`}
                style={{ backgroundColor }}
                onClick={(e) => {
                  if (e.target.closest('button')) {
                    return
                  }
                  handleEventContainerClick(e)
                }}
              >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleComplete?.(event)
                }}
                onDragStart={(e) => e.preventDefault()}
                draggable={false}
                className="flex h-6 w-6 items-center justify-center rounded bg-white/20 text-white hover:bg-white/30 flex-shrink-0"
                title={completed ? '标记为未完成' : '标记为完成'}
              >
                {completed ? <CheckSquare size={16} /> : <Square size={16} className="opacity-80" />}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  if (isEditMode) {
                    onEventClick?.(event)
                  }
                }}
                onDragStart={(e) => e.preventDefault()}
                draggable={false}
                className={`flex-1 truncate text-left text-white ${
                  isEditMode ? '' : 'pointer-events-none opacity-80'
                }`}
              >
                <span className={`font-semibold ${completed ? 'line-through' : ''}`}>{event.title}</span>
              </button>
              {event.link ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenLink?.(event)
                  }}
                  onDragStart={(e) => e.preventDefault()}
                  draggable={false}
                  className="flex h-6 w-6 items-center justify-center rounded bg-white/25 text-white hover:bg-white/40 flex-shrink-0"
                  title="打开链接"
                >
                  <SquareArrowOutUpRight size={14} />
                </button>
              ) : (
                isEditMode && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      const originId = event._originId || event.id
                      onDeleteEvent?.(originId)
                    }}
                    onDragStart={(e) => e.preventDefault()}
                    draggable={false}
                    className="flex h-6 w-6 items-center justify-center flex-shrink-0"
                    title="删除事件"
                  >
                    <span className="ios-wiggle text-white text-sm font-bold">×</span>
                  </button>
                )
              )}
              </div>
              {showIndicatorAfter && (
                <div 
                  className="mt-1 h-0.5 rounded-full transition-all"
                  style={{ backgroundColor: primaryColor }}
                />
              )}
            </div>
          )
        })}

        {events.length === 0 && (
          <div className={`text-xs ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
        )}
        </div>
      )}
    </div>
  )
}

export default CalendarCell
