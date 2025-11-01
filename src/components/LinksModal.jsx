import { useMemo } from 'react'
import { X, ExternalLink } from 'lucide-react'
import { useSelector } from 'react-redux'

function LinksModal({ isOpen, onClose, links, eventTitle }) {
  const isDark = useSelector(state => state.theme?.isDark || false)
  const primaryColor = useSelector(state => state.theme?.primaryColor || '#A78BFA')

  // 将 links 统一转换为数组格式
  const normalizedLinks = useMemo(() => {
    if (!links) return []
    if (Array.isArray(links)) {
      return links.map(link => {
        // 如果已经是对象格式 { title, url }
        if (typeof link === 'object' && link !== null) {
          return link
        }
        // 如果是字符串，转换为对象格式
        if (typeof link === 'string') {
          return { title: '', url: link }
        }
        return { title: '', url: '' }
      }).filter(link => link.url)
    }
    // 兼容旧格式：单个字符串
    if (typeof links === 'string' && links.trim()) {
      return [{ title: '', url: links }]
    }
    return []
  }, [links])

  if (!isOpen || normalizedLinks.length === 0) return null

  const handleLinkClick = (linkItem) => {
    const url = typeof linkItem === 'string' ? linkItem : (linkItem.url || linkItem)
    if (!url) return
    const target = url.startsWith('http') ? url : `https://${url}`
    window.open(target, '_blank', 'noopener,noreferrer')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`w-full max-w-md rounded-lg shadow-lg p-6 transition-colors ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {eventTitle || '选择链接'}
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

        <div className="space-y-2">
          {normalizedLinks.map((link, index) => {
            const displayTitle = link.title?.trim() || link.url || `链接 ${index + 1}`
            return (
              <button
                key={index}
                onClick={() => handleLinkClick(link)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-all text-left ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-200'
                    : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-900'
                }`}
                style={{
                  borderColor: isDark ? '#4B5563' : '#D1D5DB'
                }}
                onMouseEnter={(e) => {
                  const hex = primaryColor.replace('#', '')
                  const r = parseInt(hex.substr(0, 2), 16)
                  const g = parseInt(hex.substr(2, 2), 16)
                  const b = parseInt(hex.substr(4, 2), 16)
                  e.currentTarget.style.borderColor = primaryColor
                  e.currentTarget.style.backgroundColor = isDark
                    ? `rgba(${r}, ${g}, ${b}, 0.2)`
                    : `rgba(${r}, ${g}, ${b}, 0.1)`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = isDark ? '#4B5563' : '#D1D5DB'
                  e.currentTarget.style.backgroundColor = isDark ? '#374151' : '#FFFFFF'
                }}
              >
                <ExternalLink size={18} className={`flex-shrink-0 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {displayTitle}
                  </div>
                  {link.title?.trim() && link.url && (
                    <div className={`text-xs truncate mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {link.url}
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-4 pt-4 border-t" style={{ borderColor: isDark ? '#4B5563' : '#E5E7EB' }}>
          <button
            onClick={onClose}
            className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
              isDark
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            取消
          </button>
        </div>
      </div>
    </div>
  )
}

export default LinksModal

