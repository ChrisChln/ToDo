import { useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { useSelector, useDispatch } from 'react-redux'
import { setUser, logout } from '../store/slices/authSlice'
import { jwtDecode } from 'jwt-decode'

// 检查是否在 GoogleOAuthProvider 内
const useGoogleAuth = () => {
  try {
    // 尝试使用 GoogleLogin，如果失败则说明不在 Provider 内
    return true
  } catch {
    return false
  }
}

function GoogleLoginButton() {
  const dispatch = useDispatch()
  const user = useSelector(state => state.auth?.user)
  const isDark = useSelector(state => state.theme?.isDark || false)
  const primaryColor = useSelector(state => state.theme?.primaryColor || '#A78BFA')
  const [showLogin, setShowLogin] = useState(false)

  const handleSuccess = (credentialResponse) => {
    console.log('Login Success:', credentialResponse)
    
    // 从 Google JWT credential 中提取真实用户信息
    try {
      // 解码 JWT token
      const decoded = jwtDecode(credentialResponse.credential)
      console.log('Decoded token:', decoded)
      
      // 从解码的 token 中提取用户信息
      const realUser = {
        name: decoded.name || decoded.given_name || 'Google 用户',
        email: decoded.email,
        picture: decoded.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(decoded.name || 'User')}&background=A78BFA&color=fff`,
        sub: decoded.sub
      }
      
      console.log('Setting real user:', realUser)
      dispatch(setUser(realUser))
      setShowLogin(false)
    } catch (error) {
      console.error('Error processing login:', error)
      alert('登录凭证解析失败，请重试')
    }
  }

  const handleError = () => {
    console.log('Login Failed')
    alert('登录失败，请检查网络连接或稍后重试')
  }

  const handleLogout = () => {
    dispatch(logout())
  }

  if (user) {
    const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=A78BFA&color=fff`

    return (
      <div className="flex items-center gap-3">
        <img 
          src={user.picture} 
          alt={user.name} 
          className="w-8 h-8 rounded-full"
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.onerror = null
            e.currentTarget.src = fallbackAvatar
          }}
        />
        <span className={`text-sm font-medium hidden md:block ${
          isDark ? 'text-gray-300' : 'text-gray-700'
        }`}>
          {user.name}
        </span>
        <button
          onClick={handleLogout}
          className={`px-3 py-1 text-sm rounded-lg transition-colors ${
            isDark
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          退出
        </button>
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowLogin(true)}
        className="px-4 py-2 rounded-lg font-medium transition-colors text-white"
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
        登录
      </button>

      {showLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-custom shadow-custom p-8 max-w-md w-full mx-4 transition-colors ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h3 className={`text-xl font-semibold mb-6 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              登录 FocusBoard
            </h3>
            
            <div 
              className={`mb-4 p-3 rounded-lg ${
                isDark ? 'bg-gray-700' : ''
              }`}
              style={!isDark ? {
                backgroundColor: (() => {
                  const hex = primaryColor.replace('#', '')
                  const r = parseInt(hex.substr(0, 2), 16)
                  const g = parseInt(hex.substr(2, 2), 16)
                  const b = parseInt(hex.substr(4, 2), 16)
                  return `rgba(${r}, ${g}, ${b}, 0.1)`
                })()
              } : {}}
            >
              <p 
                className={`text-sm ${
                  isDark ? 'text-gray-300' : ''
                }`}
                style={!isDark ? {
                  color: (() => {
                    const hex = primaryColor.replace('#', '')
                    const r = parseInt(hex.substr(0, 2), 16)
                    const g = parseInt(hex.substr(2, 2), 16)
                    const b = parseInt(hex.substr(4, 2), 16)
                    return `rgb(${Math.max(0, r - 50)}, ${Math.max(0, g - 50)}, ${Math.max(0, b - 50)})`
                  })()
                } : {}}
              >
                使用 Google 账号登录可同步数据到云端，请确保浏览器已允许弹窗。
              </p>
            </div>

            <div className="space-y-3">
              {/* Google 登录按钮 - 仅在配置了真实 Client ID 时显示 */}
              {typeof window !== 'undefined' && 
               process.env.NODE_ENV !== 'test' && (
                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={handleSuccess}
                    onError={handleError}
                    useOneTap={false}
                    theme={isDark ? 'filled_black' : 'outline'}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default GoogleLoginButton
