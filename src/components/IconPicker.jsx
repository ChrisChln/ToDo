import { icons as lucideIcons } from 'lucide-react'
import { useSelector } from 'react-redux'

const baseIconSize = 22

function IconPicker({ icons, value, onChange, scale = 1 }) {
  const isDark = useSelector(state => state.theme?.isDark || false)
  const primaryColor = useSelector(state => state.theme?.primaryColor || '#A78BFA')
  const buttonSize = Math.max(32, Math.round(48 * scale))
  const iconSize = Math.max(16, Math.round(baseIconSize * scale))
  const gap = scale >= 1 ? 8 : 6
  
  return (
    <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-200 p-3 dark:border-gray-700">
      <div className="grid grid-cols-6 md:grid-cols-8" style={{ gap }}>
        {icons.map((name) => {
          const IconComponent = lucideIcons[name] || lucideIcons.Folder
          const isActive = value === name
          const hex = primaryColor.replace('#', '')
          const r = parseInt(hex.substr(0, 2), 16)
          const g = parseInt(hex.substr(2, 2), 16)
          const b = parseInt(hex.substr(4, 2), 16)
          return (
            <button
              key={name}
              type="button"
              onClick={() => onChange(name)}
              className={`flex items-center justify-center rounded-lg border transition-colors ${
                isActive
                  ? ''
                  : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-200'
              }`}
              style={isActive ? {
                borderColor: primaryColor,
                backgroundColor: isDark ? `${primaryColor}1A` : `rgba(${r}, ${g}, ${b}, 0.1)`,
                color: isDark 
                  ? `rgba(${r}, ${g}, ${b}, 0.9)`
                  : `rgb(${Math.max(0, r - 50)}, ${Math.max(0, g - 50)}, ${Math.max(0, b - 50)})`
              } : {}}
              title={name}
              
              style={{
                ...(isActive ? {
                  borderColor: primaryColor,
                  backgroundColor: isDark ? `${primaryColor}1A` : `rgba(${r}, ${g}, ${b}, 0.1)`,
                  color: isDark 
                    ? `rgba(${r}, ${g}, ${b}, 0.9)`
                    : `rgb(${Math.max(0, r - 50)}, ${Math.max(0, g - 50)}, ${Math.max(0, b - 50)})`
                } : {}),
                width: buttonSize,
                height: buttonSize,
              }}
            >
              <IconComponent size={iconSize} />
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default IconPicker
