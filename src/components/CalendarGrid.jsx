import { format, isSameDay, parseISO } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useSelector, useDispatch } from 'react-redux'
import { toggleRestDay } from '../store/slices/calendarSlice'
import CalendarCell from './CalendarCell'

function CalendarGrid({
  events,
  displayDays,
  onTimeSlotClick,
  onEventClick,
  onToggleComplete,
  onOpenLink,
  isEditMode,
  today,
}) {
  const dispatch = useDispatch()
  const isDark = useSelector(state => state.theme?.isDark || false)
  const primaryColor = useSelector(state => state.theme?.primaryColor || '#A78BFA')
  const restDays = useSelector(state => state.calendar?.restDays || [])
  const hours = Array.from({ length: 11 }, (_, i) => i + 8)
  const gridTemplate = 'repeat(3, minmax(0, 1fr)) minmax(0, 2fr) repeat(3, minmax(0, 1fr))'
  const referenceToday = today || new Date()
  const centerIndex = Math.floor(displayDays.length / 2)

  const getDateKey = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const handleHeaderClick = (day) => {
    const dateKey = getDateKey(day)
    dispatch(toggleRestDay(dateKey))
  }

  return (
    <div className={`rounded-custom shadow-custom overflow-hidden transition-colors ${
      isDark ? 'bg-gray-800' : 'bg-white'
    }`}>
      <div
        className="overflow-y-auto"
        style={{ maxHeight: '600px' }}
      >
        <div
          className={"grid transition-colors"}
          style={{ gridTemplateColumns: gridTemplate }}
        >
          {displayDays.map((day, index) => {
            const isCurrentDay = isSameDay(day, referenceToday)
            const dateKey = getDateKey(day)
            const isRestDay = restDays.includes(dateKey)
            const baseBg = isDark ? 'bg-gray-800' : 'bg-white'
            const hex = primaryColor.replace('#', '')
            const r = parseInt(hex.substr(0, 2), 16)
            const g = parseInt(hex.substr(2, 2), 16)
            const b = parseInt(hex.substr(4, 2), 16)
            const highlightBg = isDark 
              ? `rgba(${r}, ${g}, ${b}, 0.15)`
              : `rgba(${r}, ${g}, ${b}, 0.1)`
            // 休息日背景：深色主题色 + 纹理（提高对比度）
            const darkenForRestDay = (val) => Math.max(0, val - 160) // 更深，提升可见度
            const darkenForPattern = (val) => Math.max(0, val - 130) // 图案稍浅，形成条纹
            const restDayBaseR = darkenForRestDay(r)
            const restDayBaseG = darkenForRestDay(g)
            const restDayBaseB = darkenForRestDay(b)
            const restDayPatternR = darkenForPattern(r)
            const restDayPatternG = darkenForPattern(g)
            const restDayPatternB = darkenForPattern(b)
            const restDayBgColor = isDark 
              ? `rgba(${restDayBaseR}, ${restDayBaseG}, ${restDayBaseB}, 0.85)`
              : `rgba(${restDayBaseR}, ${restDayBaseG}, ${restDayBaseB}, 0.8)`
            const restDayPatternColor = isDark
              ? `rgba(${restDayPatternR}, ${restDayPatternG}, ${restDayPatternB}, 0.85)`
              : `rgba(${restDayPatternR}, ${restDayPatternG}, ${restDayPatternB}, 0.8)`
            // 创建斜线纹理（加粗条纹提升识别度）
            const restDayBgPattern = `repeating-linear-gradient(45deg, ${restDayBgColor}, ${restDayBgColor} 6px, ${restDayPatternColor} 6px, ${restDayPatternColor} 12px)`
            const restDayBg = restDayBgPattern
            // 表头背景：深色主题色
            const darken = (val) => Math.max(0, val - 80)
            const headerBg = `rgb(${darken(r)}, ${darken(g)}, ${darken(b)})`
            return (
              <div
                key={day.toISOString()}
                className="sticky top-0 z-10 border-b p-4 text-center transition-colors cursor-pointer"
                style={{
                  // 只保留底边框，移除左右边框
                  borderBottomColor: (() => {
                    const hex = primaryColor.replace('#', '')
                    const r = parseInt(hex.substr(0, 2), 16)
                    const g = parseInt(hex.substr(2, 2), 16)
                    const b = parseInt(hex.substr(4, 2), 16)
                    return `rgba(${r}, ${g}, ${b}, ${isDark ? 0.5 : 0.35})`
                  })(),
                  borderLeftWidth: 0,
                  borderRightWidth: 0,
                  // 表头统一使用深色主题色（包括休息日）
                  backgroundColor: headerBg,
                  color: 'white', // 文字统一使用白色
                }}
                onClick={() => handleHeaderClick(day)}
                title={isRestDay ? '点击取消休息日' : '点击设为休息日'}
              >
                <div className="text-sm font-medium mb-1 text-white/90">
                  {format(day, 'EEE', { locale: zhCN })}
                </div>
                <div className="text-2xl font-bold text-white">
                  {format(day, 'd')}
                </div>
              </div>
            )
          })}
        </div>

        {hours.map((hour) => (
          <div
            key={hour}
            className="grid transition-colors"
            style={{ 
              gridTemplateColumns: gridTemplate,
            }}
          >
            {displayDays.map((day, index) => {
              const dateKey = getDateKey(day)
              const isRestDay = restDays.includes(dateKey)
              return (
                <CalendarCell
                  key={`${hour}-${day.toISOString()}`}
                  day={day}
                  hour={hour}
                  events={events.filter(event => {
                    const eventStart = parseISO(event.start)
                    return isSameDay(eventStart, day) && eventStart.getHours() === hour
                  })}
                  onClick={() => onTimeSlotClick(day, hour)}
                  onEventClick={onEventClick}
                  onToggleComplete={onToggleComplete}
                  onOpenLink={onOpenLink}
                  isEditMode={isEditMode}
                  showHourLabel={index === centerIndex}
                  hourLabel={`${hour}:00`}
                  isToday={isSameDay(day, referenceToday)}
                  isFirstColumn={index === 0}
                  isRestDay={isRestDay}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

export default CalendarGrid
