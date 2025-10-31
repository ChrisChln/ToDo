import { configureStore } from '@reduxjs/toolkit';
import todoReducer from './slices/todoSlice';
import calendarReducer from './slices/calendarSlice';
import themeReducer from './slices/themeSlice';
import shareReducer from './slices/shareSlice';
import authReducer from './slices/authSlice';
import homeReducer from './slices/homeSlice';
import { saveUserData } from '../utils/api';
import { saveToLocalStorage } from '../utils/localStorage';
import { userDataMiddleware } from './userDataMiddleware';

console.log('Initializing store with MongoDB integration');

const initialState = {
  todos: undefined,
  calendar: undefined,
  theme: undefined,
  share: undefined,
  home: undefined,
  auth: undefined,
};

export const store = configureStore({
  reducer: {
    todos: todoReducer,
    calendar: calendarReducer,
    theme: themeReducer,
    share: shareReducer,
    home: homeReducer,
    auth: authReducer,
  },
  preloadedState: initialState,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(userDataMiddleware),
});

// 订阅 store 变化，自动保存到 MongoDB
let previousUserId = null;
let saveCounter = 0;
let saveTimeout = null;

store.subscribe(() => {
  const state = store.getState();
  const currentUserId = state.auth?.user?.sub || null;

  // 如果用户切换了，记录日志
  if (currentUserId && previousUserId !== currentUserId) {
    console.log(`User switched: ${previousUserId} -> ${currentUserId}`);
  }

  // 只有在有用户 ID 时才保存数据到 MongoDB（防抖）
  if (currentUserId) {
    // 清除之前的定时器
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    const dataToPersist = {
      todos: state.todos,
      calendar: state.calendar,
      theme: state.theme,
      share: state.share,
      home: state.home,
    };

    // 2秒后保存（防抖）
    saveTimeout = setTimeout(() => {
      if (typeof localStorage !== 'undefined') {
        if (dataToPersist.todos) {
          saveToLocalStorage('todos', dataToPersist.todos, currentUserId);
        }
        if (dataToPersist.calendar) {
          saveToLocalStorage('calendar', dataToPersist.calendar, currentUserId);
        }
        if (dataToPersist.theme) {
          saveToLocalStorage('theme', dataToPersist.theme, currentUserId);
        }
        if (dataToPersist.share) {
          saveToLocalStorage('share', dataToPersist.share, currentUserId);
        }
        if (dataToPersist.home) {
          saveToLocalStorage('home', dataToPersist.home, currentUserId);
        }
      }

      saveUserData(currentUserId, {
        todos: dataToPersist.todos,
        calendar: dataToPersist.calendar,
        theme: dataToPersist.theme,
        share: dataToPersist.share,
        home: dataToPersist.home,
      }).then(() => {
        saveCounter++;
        if (saveCounter % 10 === 0) {
          console.log('Auto-saved to MongoDB (every 10th save)');
        }
      });
    }, 2000);
  }

  previousUserId = currentUserId;
});
