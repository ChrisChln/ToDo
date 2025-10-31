import { createSlice } from '@reduxjs/toolkit';

const loadThemeFromStorage = () => {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem('theme');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed;
    }
  } catch (error) {
    console.error('Failed to load theme from storage:', error);
  }
  return null;
};

const savedTheme = loadThemeFromStorage();

const initialState = {
  isDark: savedTheme?.isDark || false,
  primaryColor: savedTheme?.primaryColor || '#A78BFA',
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.isDark = !state.isDark;
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('theme', JSON.stringify({ isDark: state.isDark, primaryColor: state.primaryColor }));
        }
      } catch (error) {
        console.error('Failed to save theme:', error);
      }
    },
    setPrimaryColor: (state, action) => {
      state.primaryColor = action.payload;
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('theme', JSON.stringify({ isDark: state.isDark, primaryColor: state.primaryColor }));
        }
      } catch (error) {
        console.error('Failed to save theme:', error);
      }
    },
  },
});

export const { toggleTheme, setPrimaryColor } = themeSlice.actions;
export default themeSlice.reducer;

