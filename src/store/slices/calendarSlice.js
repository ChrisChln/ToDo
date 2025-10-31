import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  events: [],
  selectedDate: null,
  view: 'week',
  restDays: [], // 休息日的日期字符串数组，格式：'YYYY-MM-DD'
};

const normalizeEvent = (event = {}) => ({
  ...event,
  recurrence: event.recurrence || 'once',
  completed: !!event.completed,
  sharedWith: Array.isArray(event.sharedWith) ? event.sharedWith : [],
  completedOccurrences: Array.isArray(event.completedOccurrences) ? event.completedOccurrences : [],
});

const calendarSlice = createSlice({
  name: 'calendar',
  initialState,
  reducers: {
    addEvent: (state, action) => {
      state.events.push(normalizeEvent(action.payload));
    },
    updateEvent: (state, action) => {
      const { id, ...updates } = action.payload;
      const index = state.events.findIndex(e => e.id === id);
      if (index !== -1) {
        state.events[index] = normalizeEvent({ ...state.events[index], ...updates });
      }
    },
    deleteEvent: (state, action) => {
      state.events = state.events.filter(e => e.id !== action.payload);
    },
    setSelectedDate: (state, action) => {
      state.selectedDate = action.payload;
    },
    loadCalendar: (state, action) => {
      const payload = action.payload || {};
      const events = Array.isArray(payload.events) ? payload.events.map(normalizeEvent) : [];
      const restDays = Array.isArray(payload.restDays) ? payload.restDays : [];
      return {
        ...state,
        ...payload,
        events,
        restDays,
      };
    },
    resetCalendar: (state) => {
      return {
        ...initialState,
        events: [],
      };
    },
    toggleRestDay: (state, action) => {
      const dateStr = action.payload; // 'YYYY-MM-DD'
      const index = state.restDays.indexOf(dateStr);
      if (index === -1) {
        state.restDays.push(dateStr);
      } else {
        state.restDays.splice(index, 1);
      }
    },
  },
});

export const { addEvent, updateEvent, deleteEvent, setSelectedDate, loadCalendar, resetCalendar, toggleRestDay } = calendarSlice.actions;
export default calendarSlice.reducer;
