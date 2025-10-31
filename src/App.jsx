import { useSelector } from 'react-redux'
import Layout from './components/Layout'
import { useEffect } from 'react'
import usePersistedUser from './hooks/usePersistedUser'

function App() {
  const isDark = useSelector(state => state.theme?.isDark || false)
  const primaryColor = useSelector(state => state.theme?.primaryColor || '#A78BFA')
  usePersistedUser()

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  useEffect(() => {
    // 设置 CSS 变量以便在整个应用中使用主题色
    document.documentElement.style.setProperty('--primary-color', primaryColor)
  }, [primaryColor])

  return (
    <div className={isDark ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}>
      <Layout />
    </div>
  )
}

export default App
