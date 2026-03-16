import { createSlice } from '@reduxjs/toolkit';

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    // LocalStorage se user nikaal rahe hain taaki reload par login na mangey
    user: localStorage.getItem('chatUser') || null, 
    messages: [], // Global chat ke messages
    privateMessages: {}, // Personal chat history {username: [messages]}
    onlineUsers: [], // Kaun kaun online hai abhi
    selectedUser: null, // Kis bande se chat kar rahe hain
    theme: 'dark', // Black/White theme switch
    notifications: {} // Kitne messages unread hain per user
  },
  reducers: {
    // User login hone par set karega aur save bhi karega
    setUser: (state, action) => {
      state.user = action.payload;
      localStorage.setItem('chatUser', action.payload);
    },
    // Global chat mein message add karega
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    // Personal message store karna aur notification count badhana
    addPrivateMessage: (state, action) => {
      const msg = action.payload;
      console.log("Receiving Private Message in state:", msg);
      
      const currentUserLower = state.user?.toLowerCase();
      const fromLower = msg.from?.toLowerCase();
      const toLower = msg.to?.toLowerCase();
      
      const otherUser = fromLower === currentUserLower ? toLower : fromLower;
      console.log("Storing message for conversation with:", otherUser);
      
      if (!state.privateMessages[otherUser]) {
        state.privateMessages[otherUser] = [];
      }
      state.privateMessages[otherUser].push(msg);

      // Notification logic (case insensitive)
      if (fromLower !== currentUserLower && (!state.selectedUser || state.selectedUser.username.toLowerCase() !== fromLower)) {
        state.notifications[otherUser] = (state.notifications[otherUser] || 0) + 1;
      }
    },
    // Online users ki list refresh karna
    setOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload;
      
      if (state.selectedUser) {
        const updatedUser = action.payload.find(u => u.username.toLowerCase() === state.selectedUser.username.toLowerCase());
        if (updatedUser) {
          state.selectedUser = updatedUser;
        }
      }
    },
    // Chat switch karne ke liye (Global vs Personal)
    setSelectedUser: (state, action) => {
      state.selectedUser = action.payload;
      if (action.payload) {
        // Notification clear karte waqt bhi lowercase key check kar rahe hain
        state.notifications[action.payload.username.toLowerCase()] = 0;
      }
    },
    // Theme toggle karne ke liye
    toggleTheme: (state) => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
    },
    // Reset state on logout
    logout: (state) => {
      localStorage.removeItem('chatUser');
      state.user = null;
      state.messages = [];
      state.privateMessages = {};
      state.onlineUsers = [];
      state.selectedUser = null;
      state.notifications = {};
    }
  },
});

export const { setUser, addMessage, addPrivateMessage, setOnlineUsers, setSelectedUser, toggleTheme, logout } = chatSlice.actions;
export default chatSlice.reducer;
