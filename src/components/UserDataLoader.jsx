import { useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { fetchUserData } from '../utils/api'
import { loadTodos, resetTodos } from '../store/slices/todoSlice'
import { loadCalendar, resetCalendar } from '../store/slices/calendarSlice'
import { setHomeIcons, resetHome } from '../store/slices/homeSlice'
import { normalizeTodosData } from '../utils/todoHelpers'
import { normalizeHomeData } from '../utils/homeHelpers'
import { loadFromLocalStorage, saveToLocalStorage } from '../utils/localStorage'

function UserDataLoader() {
  const dispatch = useDispatch()
  const user = useSelector(state => state.auth?.user)
  const userId = user?.sub
  const loadedUserIdRef = useRef(null)

  useEffect(() => {
    // 避免重复加载同一用户的数据
    if (loadedUserIdRef.current === userId) {
      return
    }

    loadedUserIdRef.current = userId || null

    if (userId) {
      console.log('Loading data for user:', userId)

      const cachedTodosRaw = loadFromLocalStorage('todos', null, userId)
      const cachedCalendar = loadFromLocalStorage('calendar', null, userId)
      const cachedHomeRaw = loadFromLocalStorage('home', null, userId)
      const hasCachedTodos = !!cachedTodosRaw
      const hasCachedHome = !!cachedHomeRaw

      if (hasCachedTodos) {
        const cachedTodos = normalizeTodosData(cachedTodosRaw)
        console.log('Restored todos from localStorage', {
          categories: cachedTodos.categories.length,
        })
        dispatch(loadTodos(cachedTodos))
        saveToLocalStorage('todos', cachedTodos, userId)
      }

      if (cachedCalendar) {
        console.log('Restored calendar from localStorage')
        dispatch(loadCalendar(cachedCalendar))
      }

      if (hasCachedHome) {
        const cachedHome = normalizeHomeData(cachedHomeRaw)
        console.log('Restored home icons from localStorage', {
          icons: cachedHome.icons.length,
        })
        dispatch(setHomeIcons(cachedHome))
        saveToLocalStorage('home', cachedHome, userId)
      }

      fetchUserData(userId).then((data) => {
        const remoteSummary = {
          hasTodos: !!data.todos,
          hasCalendar: !!data.calendar,
          hasHome: !!data.home,
        }

        if (data.todos) {
          const normalizedRemoteTodos = normalizeTodosData(data.todos)
          const totalTodos = normalizedRemoteTodos.categories.reduce(
            (sum, category) => sum + category.todos.length,
            0
          )

          console.log('Loading todos from MongoDB', {
            categories: normalizedRemoteTodos.categories.length,
            totalTodos,
          })

          dispatch(loadTodos(normalizedRemoteTodos))
          saveToLocalStorage('todos', normalizedRemoteTodos, userId)
        } else if (hasCachedTodos) {
          console.log('Remote todos empty, kept cached version')
        } else {
          console.log('No saved todo data, starting with defaults', remoteSummary)
          dispatch(resetTodos())
        }

        if (data.calendar) {
          console.log('Loading calendar')
          dispatch(loadCalendar(data.calendar))
          saveToLocalStorage('calendar', data.calendar, userId)
        } else if (cachedCalendar) {
          console.log('No remote calendar, keeping cached version')
        } else {
          console.log('No calendar data, starting fresh')
          dispatch(resetCalendar())
        }

        if (data.home) {
          const normalizedHome = normalizeHomeData(data.home)
          console.log('Loading home icons from MongoDB', {
            icons: normalizedHome.icons.length,
          })
          dispatch(setHomeIcons(normalizedHome))
          saveToLocalStorage('home', normalizedHome, userId)
        } else if (hasCachedHome) {
          console.log('No remote home icons, keeping cached version')
        } else {
          console.log('No home icon data, starting with defaults')
          dispatch(resetHome())
        }
      }).catch(error => {
        console.error('Error loading data:', error)
        if (!hasCachedTodos) {
          dispatch(resetTodos())
        }
        if (!cachedCalendar) {
          dispatch(resetCalendar())
        }
        if (!hasCachedHome) {
          dispatch(resetHome())
        }
      })
    } else {
      // 没有用户登录，只清空显示但不清空 localStorage 中的数据
      console.log('No user logged in, clearing displayed data (keeping saved data in localStorage)')
      dispatch(resetTodos())
      dispatch(resetCalendar())
      dispatch(resetHome())
    }
  }, [userId, dispatch])

  return null // 这是一个辅助组件，不渲染任何内容
}

export default UserDataLoader
