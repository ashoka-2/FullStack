import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  messages: [],
  isLoading: false,
  inputValue: '',
  theme: 'dark',
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setInput(state, action) {
      state.inputValue = action.payload;
    },
    toggleTheme(state) {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
    },
    sendMessage(state, action) {
      state.messages.push({ id: Date.now(), role: 'user', content: action.payload });
      state.inputValue = '';
      state.isLoading = true;
    },
    receiveBattleResult(state, action) {
      state.messages.push({
        id: Date.now() + 1,
        role: 'battle',
        content: action.payload.problem,
        battleData: action.payload,
      });
      state.isLoading = false;
    },
    receiveBattleError(state, action) {
      state.messages.push({
        id: Date.now() + 1,
        role: 'error',
        content: action.payload,
      });
      state.isLoading = false;
    },
    clearChat(state) {
      state.messages = [];
      state.isLoading = false;
      state.inputValue = '';
    },
  },
});

export const {
  setInput,
  toggleTheme,
  sendMessage,
  receiveBattleResult,
  receiveBattleError,
  clearChat,
} = chatSlice.actions;

export default chatSlice.reducer;
