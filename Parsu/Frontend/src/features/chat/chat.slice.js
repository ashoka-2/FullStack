import { createSlice } from "@reduxjs/toolkit";

const chatSlice = createSlice({
    name: "chat",
    initialState: {
        chats: [],
        messages: [],
        currentChatId: null,
        loading: false,
        isGenerating: false,
        isCreating: false,
        error: null,
        // ─── Pagination state ──────────────────────────────────────
        hasMoreMessages: false,
        messagesPage: 1,
        totalMessages: 0,
        isLoadingMore: false, // For scroll-up older message loading
        isSidebarCollapsed: localStorage.getItem('parsu_sidebar_collapsed') === 'true',
    },
    reducers: {
        toggleSidebarCollapse: (state) => {
            state.isSidebarCollapsed = !state.isSidebarCollapsed;
            localStorage.setItem('parsu_sidebar_collapsed', String(state.isSidebarCollapsed));
        },
        setSidebarCollapse: (state, action) => {
            state.isSidebarCollapsed = action.payload;
            localStorage.setItem('parsu_sidebar_collapsed', String(action.payload));
        },
        setChats: (state, action) => {
            state.chats = action.payload;
        },
        setMessages: (state, action) => {
            state.messages = action.payload;
        },
        // Prepend older messages at the top (for scroll-up pagination)
        prependMessages: (state, action) => {
            state.messages = [...action.payload, ...state.messages];
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
        setIsGenerating: (state, action) => {
            state.isGenerating = action.payload;
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
            state.isGenerating = false;
            state.hasMoreMessages = false;
            state.messagesPage = 1;
            state.totalMessages = 0;
        },
        appendChunk: (state, action) => {
            const lastMessage = state.messages[state.messages.length - 1];
            if (lastMessage && lastMessage.role === "ai" && lastMessage.isStreaming) {
                lastMessage.content += action.payload;
            }
        },
        // ─── Pagination reducers ──────────────────────────────────
        setHasMoreMessages: (state, action) => {
            state.hasMoreMessages = action.payload;
        },
        setMessagesPage: (state, action) => {
            state.messagesPage = action.payload;
        },
        setTotalMessages: (state, action) => {
            state.totalMessages = action.payload;
        },
        setIsLoadingMore: (state, action) => {
            state.isLoadingMore = action.payload;
        },
    }
});

export const { 
    setChats, setMessages, addMessage, setCurrentChatId, 
    setLoading, setIsGenerating, setError, setIsCreating, clearChat, appendChunk,
    prependMessages, setHasMoreMessages, setMessagesPage, setTotalMessages, setIsLoadingMore,
    toggleSidebarCollapse, setSidebarCollapse
} = chatSlice.actions;
export default chatSlice.reducer;
