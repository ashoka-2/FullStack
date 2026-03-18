import { createSlice } from "@reduxjs/toolkit";

const chatSlice = createSlice({
    name: "chat",
    initialState: {
        chats: [],
        messages: [],
        currentChatId: null,
        loading: false,
        isCreating: false,
        error: null,
    },
    reducers: {
        setChats: (state, action) => {
            state.chats = action.payload;
        },
        setMessages: (state, action) => {
            state.messages = action.payload;
        },
        addMessage: (state, action) => {
            state.messages.push(action.payload);
        },
        setCurrentChatId: (state, action) => {
            state.currentChatId = action.payload;
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setIsCreating: (state, action) => {
            state.isCreating = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
        clearChat: (state) => {
            state.chats = [];
            state.messages = [];
            state.currentChatId = null;
        },
        appendChunk: (state, action) => {
            const lastMessage = state.messages[state.messages.length - 1];
            if (lastMessage && lastMessage.role === "ai" && lastMessage.isStreaming) {
                lastMessage.content += action.payload;
            }
        }
    }
});

export const { setChats, setMessages, addMessage, setCurrentChatId, setLoading, setError, setIsCreating, clearChat, appendChunk } = chatSlice.actions;
export default chatSlice.reducer;
