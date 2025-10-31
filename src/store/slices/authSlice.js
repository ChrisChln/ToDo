import { createSlice } from '@reduxjs/toolkit';

const loadPersistedUser = () => {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem('auth')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && parsed.user) {
      if (parsed.user.sub === 'demo') {
        window.localStorage.removeItem('auth')
        return null
      }
      return parsed.user
    }
  } catch (error) {
    console.error('Failed to load persisted auth:', error)
  }
  return null
}

const persistedUser = typeof window !== 'undefined' ? loadPersistedUser() : null

const initialState = {
  user: persistedUser,
  isAuthenticated: !!persistedUser,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      try {
        if (typeof window !== 'undefined') {
          if (state.user?.sub === 'demo') {
            window.localStorage.removeItem('auth')
          } else {
            window.localStorage.setItem('auth', JSON.stringify({ user: state.user }))
          }
        }
      } catch (error) {
        console.error('Failed to persist auth state:', error)
      }
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('auth')
        }
      } catch (error) {
        console.error('Failed to clear auth state:', error)
      }
    },
  },
});

export const { setUser, logout } = authSlice.actions;
export default authSlice.reducer;
