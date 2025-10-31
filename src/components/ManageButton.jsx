import { Settings } from 'lucide-react'
import { useSelector } from 'react-redux'

function ManageButton({ active = false, onClick, inactiveText = '管理', activeText = '完成' }) {
  const isDark = useSelector(state => state.theme?.isDark || false)
  const primaryColor = useSelector(state => state.theme?.primaryColor || '#A78BFA')

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition-all shadow-sm ${
        active
          ? (isDark ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800 border border-gray-200')
          : 'text-white'
      } ${active ? 'ios-wiggle' : ''}`}
      style={!active ? { backgroundColor: primaryColor } : {}}
    >
      <Settings size={18} />
      <span>{active ? activeText : inactiveText}</span>
    </button>
  )
}

export default ManageButton


