import { saveUserData } from '../utils/api';
import { saveToLocalStorage } from '../utils/localStorage';

// 中间件：在用户退出登录前保存数据到 MongoDB
export const userDataMiddleware = (store) => (next) => (action) => {
  const prevState = store.getState();
  const prevUserId = prevState.auth?.user?.sub;
  
  // 在执行 logout 之前，先保存当前用户的数据到 MongoDB
  if (action.type === 'auth/logout' && prevUserId) {
    const state = store.getState();
    console.log('Saving data to MongoDB before logout for user:', prevUserId);
    const summary = Array.isArray(state.todos?.categories)
      ? state.todos.categories.map(cat => `${cat.name}: ${cat.todos?.length || 0}`).join(', ')
      : '无分类';
    const homeCount = Array.isArray(state.home?.icons) ? state.home.icons.length : 0;
    console.log('Category summary before logout:', summary);
    console.log(`Home icons: ${homeCount}`);

    const dataToPersist = {
      todos: state.todos,
      calendar: state.calendar,
      theme: state.theme,
      share: state.share,
      home: state.home,
    };

    if (typeof localStorage !== 'undefined') {
      if (dataToPersist.todos) {
        saveToLocalStorage('todos', dataToPersist.todos, prevUserId);
      }
      if (dataToPersist.calendar) {
        saveToLocalStorage('calendar', dataToPersist.calendar, prevUserId);
      }
      if (dataToPersist.theme) {
        saveToLocalStorage('theme', dataToPersist.theme, prevUserId);
      }
      if (dataToPersist.share) {
        saveToLocalStorage('share', dataToPersist.share, prevUserId);
      }
      if (dataToPersist.home) {
        saveToLocalStorage('home', dataToPersist.home, prevUserId);
      }
      console.log('Cached latest data to localStorage before logout');
    }
    
    // 立即保存到 MongoDB（不使用防抖）
    saveUserData(prevUserId, dataToPersist).then(() => {
      console.log('Saved data to MongoDB before logout');
    }).catch(error => {
      console.error('Error saving data to MongoDB before logout:', error);
    });
  }
  
  const result = next(action);
  
  // 记录用户变化
  if (action.type === 'auth/setUser' || action.type === 'auth/logout') {
    const nextUserId = store.getState().auth?.user?.sub || null;
    
    if (prevUserId !== nextUserId) {
      console.log(`User changed: ${prevUserId || 'none'} -> ${nextUserId || 'none'}`);
    }
  }

  return result;
};
