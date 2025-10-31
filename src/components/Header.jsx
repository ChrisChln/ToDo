import { Moon, Sun, User, Home as HomeIcon, CalendarDays, Wrench } from 'lucide-react'
import { useSelector, useDispatch } from 'react-redux'
import { toggleTheme } from '../store/slices/themeSlice'
import GoogleLoginButton from './GoogleLoginButton'

const navItems = [
  { id: 'home', label: '首页', icon: HomeIcon },
  { id: 'calendar', label: '日历', icon: CalendarDays },
  { id: 'tools', label: '工具', icon: Wrench },
]

function Header({ activePage, onChangePage }) {
  const isDark = useSelector(state => state.theme?.isDark || false)
  const primaryColor = useSelector(state => state.theme?.primaryColor || '#A78BFA')
  const user = useSelector(state => state.auth?.user)
  const dispatch = useDispatch()

  return (
    <header className={`flex items-center justify-between px-8 py-4 border-b transition-colors ${
      isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'
    }`}>
      <div className="flex items-center gap-6">
        {/* 快速导航 */}
        <nav className="flex items-center gap-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activePage === item.id
            return (
              <button
                key={item.id}
                onClick={() => onChangePage?.(item.id)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-white'
                    : isDark
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                style={isActive ? { 
                  backgroundColor: primaryColor 
                } : {}}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <GoogleLoginButton />
        
        <button
          onClick={() => dispatch(toggleTheme())}
          className={`p-2 rounded-lg transition-colors ${
            isDark 
              ? 'hover:bg-gray-700 text-gray-300' 
              : 'hover:bg-gray-100 text-gray-600'
          }`}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </header>
  )
}

export default Header
