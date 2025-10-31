import { useSelector } from 'react-redux'
import { CheckSquare, Square, SquareArrowOutUpRight } from 'lucide-react'

function CalendarCell({
  events,
  onClick,
  onEventClick,
  onToggleComplete,
  onOpenLink,
  isEditMode,
  showHourLabel = false,
  hourLabel = '',
  isToday = false,
  isFirstColumn = false,
  isRestDay = false,
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
        <div className={`${showHourLabel ? 'mt-6' : ''} space-y-1`}>
        {events.map((event) => {
          const completed = !!event.completed
          const baseColor = normalizeHex(event.color || primaryColor)
          const backgroundColor = completed ? adjustColor(baseColor, -60) : baseColor
          const borderColor = adjustColor(baseColor, -80)

          return (
            <div
              key={event.id}
              className={`flex items-center gap-2 rounded-lg border px-2 py-2 text-xs shadow-sm transition-all ${
                completed ? 'ring-1 ring-black/10' : ''
              } ${isEditMode ? 'ios-wiggle' : ''}`}
              style={{ backgroundColor, borderColor }}
              onClick={handleEventContainerClick}
            >
              <button
                type="button"
                onClick={(eventClick) => {
                  eventClick.stopPropagation()
                  onToggleComplete?.(event)
                }}
                className="flex h-5 w-5 items-center justify-center rounded bg-white/20 text-white hover:bg-white/30"
                title={completed ? '标记为未完成' : '标记为完成'}
              >
                {completed ? <CheckSquare size={16} /> : <Square size={16} className="opacity-80" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (isEditMode) {
                    onEventClick?.(event)
                  }
                }}
                className={`flex-1 truncate text-left text-white ${
                  isEditMode ? '' : 'pointer-events-none opacity-80'
                }`}
              >
                <span className="font-semibold">{event.title}</span>
              </button>
              {event.link ? (
                <button
                  type="button"
                  onClick={(eventClick) => {
                    eventClick.stopPropagation()
                    onOpenLink?.(event)
                  }}
                  className="flex h-6 w-6 items-center justify-center rounded bg-white/25 text-white hover:bg-white/40"
                  title="打开链接"
                >
                  <SquareArrowOutUpRight size={14} />
                </button>
              ) : (
                isEditMode && (
                  <button
                    type="button"
                    onClick={(eventClick) => {
                      eventClick.stopPropagation()
                      onEventClick?.(event)
                    }}
                    className="flex h-6 w-6 items-center justify-center rounded bg-white/15 text-white hover:bg-white/30"
                    title="编辑事件"
                  >
                    ···
                  </button>
                )
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
