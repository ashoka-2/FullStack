import { configureStore } from '@reduxjs/toolkit';
import chatReducer from './chatSlice';

// Humara main store jahan sari state rahegi
export const store = configureStore({
  reducer: {
    chat: chatReducer,
  },
});
