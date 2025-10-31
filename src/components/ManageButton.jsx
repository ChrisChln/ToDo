import { Settings } from 'lucide-react'
import { useSelector } from 'react-redux'

function ManageButton({ active = false, onClick, inactiveText = '管理', activeText = '完成' }) {
  const isDark = useSelector(state => state.theme?.isDark || false)
  const primaryColor = useSelector(state => state.theme?.primaryColor || '#A78BFA')

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition-all shadow-sm text-white"
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
      <Settings size={18} />
      <span>{active ? activeText : inactiveText}</span>
    </button>
  )
}

export default ManageButton


