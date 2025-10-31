import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { store } from './store/store.js'
import App from './App.jsx'
import './index.css'

// Google OAuth Client ID
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '786744414711-msjvvci0gte0iou1co10dp968voutibq.apps.googleusercontent.com'

// 如果配置了 Client ID，则使用 Google OAuth Provider
// 否则直接渲染应用（演示模式）
const AppWithProvider = () => {
  if (CLIENT_ID && CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID') {
    return (
      <GoogleOAuthProvider clientId={CLIENT_ID}>
        <App />
      </GoogleOAuthProvider>
    )
  }
  
  // 演示模式：不包装 GoogleOAuthProvider
  return <App />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <AppWithProvider />
    </Provider>
  </StrictMode>,
)
