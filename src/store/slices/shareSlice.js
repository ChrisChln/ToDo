import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sharedEvents: [],
  shareLinks: {},
};

const shareSlice = createSlice({
  name: 'share',
  initialState,
  reducers: {
    addSharedEvent: (state, action) => {
      const { eventId, users, link } = action.payload;
      state.sharedEvents.push({ eventId, users, link });
      state.shareLinks[eventId] = { users, link };
    },
    removeSharedEvent: (state, action) => {
      state.sharedEvents = state.sharedEvents.filter(
        se => se.eventId !== action.payload
      );
      delete state.shareLinks[action.payload];
    },
  },
});

export const { addSharedEvent, removeSharedEvent } = shareSlice.actions;
export default shareSlice.reducer;

