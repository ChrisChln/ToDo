import { useState } from 'react'
import { useSelector } from 'react-redux'
import Sidebar from './Sidebar'
import CalendarView from './CalendarView'
import Header from './Header'
import UserDataLoader from './UserDataLoader'
import HomeView from './HomeView'
import ToolsView from './ToolsView'
import '../index.css'

function Layout() {
  const isDark = useSelector(state => state.theme?.isDark || false)
  const [activePage, setActivePage] = useState('home')

  const renderContent = () => {
    switch (activePage) {
      case 'calendar':
        return <CalendarView />
      case 'tools':
        return <ToolsView />
      case 'home':
      default:
        return <HomeView onNavigate={setActivePage} />
    }
  }
  
  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <UserDataLoader />
      <div className="flex h-screen">
        {/* Sidebar - 左侧边栏 */}
        <Sidebar />
        
        {/* Main Content - 右侧主内容区 */}
        <div className="flex-1 flex flex-col">
          <Header activePage={activePage} onChangePage={setActivePage} />
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

export default Layout
