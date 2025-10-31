import { useEffect, useState } from 'react'
import { X, Users } from 'lucide-react'
import { useSelector } from 'react-redux'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

function EventModal({ isOpen, onClose, onSubmit, onDelete, selectedTimeSlot, eventData }) {
  const isDark = useSelector(state => state.theme?.isDark || false)
  const primaryColor = useSelector(state => state.theme?.primaryColor || '#A78BFA')
  const [title, setTitle] = useState('')
  const [endHour, setEndHour] = useState(() => {
    if (selectedTimeSlot) {
      return Math.min(selectedTimeSlot.time + 1, 22)
    }
    return 9
  })
  const [color, setColor] = useState('#A78BFA')
  const [sharedEmails, setSharedEmails] = useState('')
  const [link, setLink] = useState('')
  const [completed, setCompleted] = useState(false)
  const [recurrence, setRecurrence] = useState('once')

  useEffect(() => {
    if (selectedTimeSlot) {
      setEndHour(Math.min(selectedTimeSlot.time + 1, 22))
    }
  }, [selectedTimeSlot])

  useEffect(() => {
    if (eventData) {
      setTitle(eventData.title || '')
      setEndHour(new Date(eventData.end).getHours())
      setColor(eventData.color || '#A78BFA')
      setSharedEmails((eventData.sharedWith || []).join(', '))
      setLink(eventData.link || '')
      setCompleted(!!eventData.completed)
      setRecurrence(eventData.recurrence || 'once')
    } else {
      setTitle('')
      setColor('#A78BFA')
      setSharedEmails('')
      setLink('')
      setCompleted(false)
      setRecurrence('once')
    }
  }, [eventData])

  if (!isOpen || !selectedTimeSlot) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) return

    const startHour = selectedTimeSlot.time
    const normalizedEndHour = Math.max(effectiveEndHour, startHour + 1)

    const startDate = new Date(selectedTimeSlot.date)
    startDate.setHours(startHour, 0, 0, 0)

    const endDate = new Date(selectedTimeSlot.date)
    endDate.setHours(normalizedEndHour, 0, 0, 0)

    const baseEvent = {
      title: title.trim(),
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      color,
      link: link.trim(),
      completed,
      sharedWith: sharedEmails.split(',').map(email => email.trim()).filter(Boolean),
      recurrence,
      completedOccurrences: eventData?.completedOccurrences || [],
    }

    if (eventData?.id) {
      onSubmit({ id: eventData.id, ...baseEvent }, 'edit')
    } else {
      onSubmit({ id: `e${Date.now()}`, ...baseEvent }, 'create')
    }
    setTitle('')
    setEndHour(endHourOptions[0] ?? Math.min(selectedTimeSlot.time + 1, 22))
    setColor('#A78BFA')
    setSharedEmails('')
    setLink('')
    setCompleted(false)
    setRecurrence('once')
    onClose()
  }

  const recurrenceOptions = [
    { label: '仅此一次', value: 'once' },
    { label: '每天', value: 'daily' },
    { label: '每周', value: 'weekly' },
  ]

  const colorOptions = [
    { name: '紫色', value: '#A78BFA' },
    { name: '蓝色', value: '#3B82F6' },
    { name: '绿色', value: '#10B981' },
    { name: '橙色', value: '#F59E0B' },
    { name: '红色', value: '#EF4444' },
  ]
  const endHourOptions = Array.from({ length: 15 }, (_, i) => i + 8).filter(
    (hour) => hour > selectedTimeSlot.time
  )
  const effectiveEndHour = endHourOptions.includes(endHour)
    ? endHour
    : (endHourOptions[0] ?? Math.min(selectedTimeSlot.time + 1, 22))

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`w-full max-w-lg rounded-custom shadow-custom p-6 max-h-[90vh] overflow-y-auto transition-colors ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {eventData ? '编辑日程' : '新建日程'}
          </h3>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors ${
              isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <X size={20} />
          </button>
        </div>

        {eventData && (
          <div className="mb-4 flex justify-between items-center rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            <span>删除后无法恢复。</span>
            <button
              onClick={() => onDelete?.(eventData.id)}
              className="rounded-md bg-red-500 px-3 py-1 text-white hover:bg-red-600"
            >
              删除
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              标题
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none`}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = primaryColor
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = ''
              }}
              placeholder="请输入日程标题"
              autoFocus
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              链接（可选）
            </label>
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none`}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = primaryColor
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = ''
              }}
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              重复
            </label>
            <div className="flex gap-2">
              {recurrenceOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRecurrence(option.value)}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    recurrence === option.value
                      ? 'text-white'
                      : isDark
                        ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={recurrence === option.value ? {
                    backgroundColor: primaryColor
                  } : {}}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="event-completed"
              checked={completed}
              onChange={(e) => setCompleted(e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="event-completed" className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm`}>
              已完成
            </label>
          </div>

          {/* Time Info */}
          <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              <span className="font-medium">日期：</span> {format(selectedTimeSlot.date, 'yyyy年M月d日 (EEE)', { locale: zhCN })}
            </p>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              <span className="font-medium">时间：</span> {String(selectedTimeSlot.time).padStart(2, '0')}:00 - {String(effectiveEndHour).padStart(2, '0')}:00
            </p>
          </div>

          {/* End Time */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              结束时间
            </label>
            <select
              value={effectiveEndHour}
              onChange={(e) => setEndHour(Number(e.target.value))}
              className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none`}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = primaryColor
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = ''
              }}
            >
              {endHourOptions.map((h) => (
                <option key={h} value={h}>
                  {h}:00
                </option>
              ))}
            </select>
          </div>

          {/* Color */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              颜色
            </label>
            <div className="flex gap-2">
              {colorOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setColor(option.value)}
                  className="flex-1 h-10 rounded-lg transition-all"
                  style={{
                    backgroundColor: option.value,
                    ...(color === option.value ? {
                      boxShadow: `0 0 0 2px ${primaryColor}`
                    } : {})
                  }}
                />
              ))}
            </div>
          </div>

          {/* Share */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              <Users size={16} className="inline mr-1" />
              共享给（邮箱，多个请用逗号分隔）
            </label>
            <input
              type="text"
              value={sharedEmails}
              onChange={(e) => setSharedEmails(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none`}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = primaryColor
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = ''
              }}
              placeholder="邮箱1@example.com，邮箱2@example.com"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                isDark
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded-lg font-medium text-white transition-colors"
              style={{ backgroundColor: primaryColor }}
              onMouseEnter={(e) => {
                const hex = primaryColor.replace('#', '')
                const r = parseInt(hex.substr(0, 2), 16)
                const g = parseInt(hex.substr(2, 2), 16)
                const b = parseInt(hex.substr(4, 2), 16)
                const darken = (val) => Math.max(0, val - 20)
                e.currentTarget.style.backgroundColor = `rgb(${darken(r)}, ${darken(g)}, ${darken(b)})`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = primaryColor
              }}
            >
              {eventData ? '保存修改' : '创建日程'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EventModal
