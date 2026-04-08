import { createSlice } from '@reduxjs/toolkit';

const MOCK_BATTLE_RESPONSE = {
  problem: 'Write a factorial function in JS',
  solution_1:
    "Here's a factorial function in JavaScript using both iterative and recursive approaches:\n\n### 1. **Iterative Approach (using a loop)**\n```javascript\nfunction factorialIterative(n) {\n    if (n < 0) return NaN; // Factorial of negative numbers is undefined\n    let result = 1;\n    for (let i = 2; i <= n; i++) {\n        result *= i;\n    }\n    return result;\n}\n\nconsole.log(factorialIterative(5)); // Output: 120\n```\n\n### 2. **Recursive Approach**\n```javascript\nfunction factorialRecursive(n) {\n    if (n < 0) return NaN; // Factorial of negative numbers is undefined\n    if (n === 0 || n === 1) return 1;\n    return n * factorialRecursive(n - 1);\n}\n\nconsole.log(factorialRecursive(5)); // Output: 120\n```",
  solution_2:
    "Certainly! Below is a simple implementation of a factorial function in JavaScript:\n\n### Iterative Approach:\n```javascript\nfunction factorialIterative(n) {\n    if (n < 0) return undefined;\n    let result = 1;\n    for (let i = 1; i <= n; i++) {\n        result *= i;\n    }\n    return result;\n}\n```",
  judge: {
    solution_1_score: 10,
    solution_2_score: 9,
    solution_1_reasoning: 'Solution 1 is excellent...',
    solution_2_reasoning: 'Solution 2 is also very good...',
  },
};

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
      state.messages.push({ id: Date.now() + 1, role: 'battle', content: action.payload.problem, battleData: action.payload });
      state.isLoading = false;
    },
    clearChat(state) {
      state.messages = [];
    },
  },
});

export const { setInput, toggleTheme, sendMessage, receiveBattleResult, clearChat } = chatSlice.actions;

export const submitBattleThunk = (problem) => (dispatch) => {
  dispatch(sendMessage(problem));
  setTimeout(() => {
    dispatch(receiveBattleResult({ ...MOCK_BATTLE_RESPONSE, problem }));
  }, 1500);
};

export default chatSlice.reducer;
