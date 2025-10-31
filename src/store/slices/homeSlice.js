import { createSlice } from '@reduxjs/toolkit';
import { createDefaultHomeState, normalizeHomeData } from '../../utils/homeHelpers';

const initialState = createDefaultHomeState();

const homeSlice = createSlice({
  name: 'home',
  initialState,
  reducers: {
    setHomeIcons: (state, action) => {
      const normalized = normalizeHomeData(action.payload);
      return normalized;
    },
    resetHome: () => {
      return createDefaultHomeState();
    },
    addHomeIcon: (state, action) => {
      const normalized = normalizeHomeData([...state.icons, action.payload]);
      state.icons = normalized.icons;
    },
    updateHomeIcon: (state, action) => {
      const { id, changes } = action.payload;
      const updated = state.icons.map(icon =>
        icon.id === id
          ? {
              ...icon,
              ...changes,
            }
          : icon
      );
      const normalized = normalizeHomeData(updated);
      state.icons = normalized.icons;
    },
    removeHomeIcon: (state, action) => {
      const id = action.payload;
      const filtered = state.icons.filter(icon => icon.id !== id);
      const normalized = normalizeHomeData(filtered);
      state.icons = normalized.icons;
    },
  },
});

export const {
  setHomeIcons,
  resetHome,
  addHomeIcon,
  updateHomeIcon,
  removeHomeIcon,
} = homeSlice.actions;

export default homeSlice.reducer;
