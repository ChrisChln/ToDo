import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setUser } from '../store/slices/authSlice'

const loadPersistedUser = () => {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem('auth')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.user?.sub === 'demo') {
      window.localStorage.removeItem('auth')
      return null
    }
    return parsed?.user || null
  } catch (error) {
    console.error('Failed to hydrate auth from storage:', error)
    return null
  }
}

const persistUser = (user) => {
  if (typeof window === 'undefined') return
  try {
    if (user) {
      if (user.sub === 'demo') {
        window.localStorage.removeItem('auth')
        return
      }
      window.localStorage.setItem('auth', JSON.stringify({ user }))
    } else {
      window.localStorage.removeItem('auth')
    }
  } catch (error) {
    console.error('Failed to persist auth user:', error)
  }
}

export default function usePersistedUser() {
  const dispatch = useDispatch()
  const user = useSelector(state => state.auth?.user)
  const hasInitialized = useRef(false)

  useEffect(() => {
    // 只在首次加载时尝试从 localStorage 恢复用户
    if (!hasInitialized.current) {
      hasInitialized.current = true
      if (!user) {
        const persisted = loadPersistedUser()
        if (persisted) {
          dispatch(setUser(persisted))
        }
      }
    } else {
      // 之后只同步状态到 localStorage
      if (user) {
        persistUser(user)
      } else {
        // 确保用户退出时清除 localStorage
        persistUser(null)
      }
    }
  }, [dispatch, user])
}
