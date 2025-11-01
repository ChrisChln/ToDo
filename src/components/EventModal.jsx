import { useEffect, useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { useSelector } from 'react-redux'

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
  const [links, setLinks] = useState([{ title: '', url: '' }])
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
      // 处理旧格式的 link（单个字符串）和新格式的 links（数组）
      if (eventData.links && Array.isArray(eventData.links) && eventData.links.length > 0) {
        setLinks(eventData.links)
      } else if (eventData.link) {
        // 兼容旧格式：单个 link 字符串
        setLinks([{ title: '', url: eventData.link }])
      } else {
        setLinks([{ title: '', url: '' }])
      }
      setCompleted(!!eventData.completed)
      setRecurrence(eventData.recurrence || 'once')
    } else {
      setTitle('')
      setColor('#A78BFA')
      setLinks([{ title: '', url: '' }])
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

    // 过滤掉空的链接
    const validLinks = links.filter(link => link.url.trim())
    // 如果只有一个链接且没有标题，保持兼容性（存为 link 字段）
    // 如果有多个链接或链接有标题，存为 links 数组
    const baseEvent = {
      title: title.trim(),
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      color,
      completed,
      sharedWith: [],
      recurrence,
      completedOccurrences: eventData?.completedOccurrences || [],
      ...(validLinks.length === 1 && !validLinks[0].title.trim()
        ? { link: validLinks[0].url.trim() }
        : validLinks.length > 0
        ? { links: validLinks.map(l => ({ title: l.title.trim(), url: l.url.trim() })) }
        : {}),
    }

    if (eventData?.id) {
      onSubmit({ id: eventData.id, ...baseEvent }, 'edit')
    } else {
      onSubmit({ id: `e${Date.now()}`, ...baseEvent }, 'create')
    }
    setTitle('')
    setEndHour(endHourOptions[0] ?? Math.min(selectedTimeSlot.time + 1, 22))
    setColor('#A78BFA')
    setLinks([{ title: '', url: '' }])
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
    { name: '粉色', value: '#EC4899' },
    { name: '青色', value: '#06B6D4' },
    { name: '黄色', value: '#EAB308' },
    { name: '靛蓝', value: '#6366F1' },
    { name: '玫瑰', value: '#F43F5E' },
    { name: '翡翠', value: '#14B8A6' },
    { name: '琥珀', value: '#F97316' },
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
            <div className="flex items-center justify-between mb-2">
              <label className={`block text-sm font-medium ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                链接（可选）
              </label>
              <button
                type="button"
                onClick={() => setLinks([...links, { title: '', url: '' }])}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                  isDark
                    ? 'text-gray-300 hover:bg-gray-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Plus size={14} />
                添加链接
              </button>
            </div>
            <div className="space-y-2">
              {links.map((link, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={link.title}
                    onChange={(e) => {
                      const newLinks = [...links]
                      newLinks[index].title = e.target.value
                      setLinks(newLinks)
                    }}
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-colors ${
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
                    placeholder={links.length > 1 ? "链接标题" : ""}
                  />
                  <input
                    type="text"
                    value={link.url}
                    onChange={(e) => {
                      const newLinks = [...links]
                      newLinks[index].url = e.target.value
                      setLinks(newLinks)
                    }}
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-colors ${
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
                  {links.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newLinks = links.filter((_, i) => i !== index)
                        setLinks(newLinks.length > 0 ? newLinks : [{ title: '', url: '' }])
                      }}
                      className={`p-2 rounded-lg transition-colors ${
                        isDark
                          ? 'hover:bg-gray-700 text-gray-400'
                          : 'hover:bg-gray-100 text-gray-500'
                      }`}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
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
            <div className="space-y-3">
              <div className="grid grid-cols-6 gap-2">
                {colorOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setColor(option.value)}
                    className="h-10 w-full rounded-lg transition-all"
                    style={{
                      backgroundColor: option.value,
                      ...(color === option.value ? {
                        boxShadow: `0 0 0 2px ${primaryColor}`
                      } : {})
                    }}
                    title={option.name}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <label className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  自定义颜色：
                </label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-20 rounded-lg border cursor-pointer"
                  style={{
                    borderColor: isDark ? '#4B5563' : '#D1D5DB'
                  }}
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => {
                    const value = e.target.value
                    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                      setColor(value)
                    }
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none`}
                  placeholder="#A78BFA"
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = primaryColor
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = ''
                  }}
                />
              </div>
            </div>
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
