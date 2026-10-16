import { createSlice } from "@reduxjs/toolkit";

const chatSlice = createSlice({
    name: "chat",
    initialState: {
        chats: [],
        messages: [],
        messagesByChatId: {},
        messagesLoadingChatId: null,
        currentChatId: null,
        loading: false,
        isGenerating: false,
        isCreating: false,
        activitySteps: [],
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
        prependChat: (state, action) => {
            if (!action.payload?._id) return;
            const exists = state.chats.some(c => c._id === action.payload._id);
            if (!exists) {
                state.chats = [action.payload, ...state.chats];
            } else {
                state.chats = state.chats.map(c => c._id === action.payload._id ? { ...c, ...action.payload } : c);
            }
        },
        setMessages: (state, action) => {
            state.messages = action.payload;
            if (state.currentChatId) state.messagesByChatId[state.currentChatId] = action.payload;
        },
        setChatMessages: (state, action) => {
            const { chatId, messages } = action.payload || {};
            if (!chatId || !Array.isArray(messages)) return;
            state.messagesByChatId[chatId] = messages;
            if (state.currentChatId === chatId) state.messages = messages;
        },
        setMessagesLoadingChatId: (state, action) => {
            state.messagesLoadingChatId = action.payload || null;
        },
        // Prepend older messages at the top (for scroll-up pagination)
        prependMessages: (state, action) => {
            state.messages = [...action.payload, ...state.messages];
        },
        addMessage: (state, action) => {
            state.messages.push(action.payload);
            if (state.currentChatId) state.messagesByChatId[state.currentChatId] = state.messages;
        },
        setCurrentChatId: (state, action) => {
            if (state.currentChatId !== action.payload) {
                state.hasMoreMessages = false;
                state.messagesPage = 1;
                state.totalMessages = 0;
                state.isLoadingMore = false;
            }
            state.currentChatId = action.payload;
            state.messages = action.payload ? (state.messagesByChatId[action.payload] || []) : [];
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setIsGenerating: (state, action) => {
            state.isGenerating = action.payload;
            if (action.payload) {
                state.activitySteps = [{ id: 'request', label: 'Understanding your request', status: 'active' }];
            } else {
                state.activitySteps = [];
                state.activeToolEvent = null;
            }
        },
        setActivityStep: (state, action) => {
            const { id, label, status = 'active' } = action.payload || {};
            if (!id || !label || !state.isGenerating) return;
            if (status === 'active' && id !== 'request') {
                const finishCurrentPhase = id === 'context' || id === 'model';
                state.activitySteps.forEach(step => {
                    if (step.status === 'active' && (step.id === 'request' || finishCurrentPhase)) step.status = 'complete';
                });
            }
            const existing = state.activitySteps.find(step => step.id === id);
            if (existing) {
                existing.label = label;
                existing.status = status;
                return;
            }
            state.activitySteps.push({ id, label, status });
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
            state.messagesByChatId = {};
            state.messagesLoadingChatId = null;
            state.currentChatId = null;
            state.isGenerating = false;
            state.activitySteps = [];
            state.hasMoreMessages = false;
            state.messagesPage = 1;
            state.totalMessages = 0;
            state.activeToolEvent = null;
        },
        appendChunk: (state, action) => {
            const lastMessage = state.messages[state.messages.length - 1];
            if (lastMessage && lastMessage.role === "ai" && lastMessage.isStreaming) {
                lastMessage.content += action.payload;
                if (action.payload && !state.activitySteps.some(step => step.id === 'response')) {
                    state.activitySteps.forEach(step => { if (step.status === 'active') step.status = 'complete'; });
                    state.activitySteps.push({ id: 'response', label: 'Writing the response', status: 'active' });
                }
                if (state.currentChatId) state.messagesByChatId[state.currentChatId] = state.messages;
            }
        },
        resetStreamingChunk: (state) => {
            const lastMessage = state.messages[state.messages.length - 1];
            if (lastMessage && lastMessage.role === "ai") {
                lastMessage.content = "";
                if (state.currentChatId) state.messagesByChatId[state.currentChatId] = state.messages;
            }
        },
        setActiveToolEvent: (state, action) => {
            const event = action.payload;
            if (event?.type === 'tool_start') {
                state.activeToolEvent = event;
                const id = `tool:${event.name || 'action'}`;
                const existing = state.activitySteps.find(step => step.id === id);
                if (!existing) {
                    state.activitySteps.forEach(step => { if (step.status === 'active' && step.id !== 'request') step.status = 'complete'; });
                    state.activitySteps.push({ id, label: event.label || 'Using a tool', status: 'active' });
                } else {
                    existing.label = event.label || existing.label;
                    existing.status = 'active';
                }
            } else if (event?.type === 'tool_end') {
                state.activeToolEvent = null;
                const step = state.activitySteps.find(item => item.id === `tool:${event.name || 'action'}`);
                if (step) step.status = 'complete';
            } else {
                state.activeToolEvent = event;
            }
        },
        stopStreaming: (state) => {
            state.isGenerating = false;
            state.loading = false;
            state.activeToolEvent = null;
            state.activitySteps = [];
            const lastMessage = state.messages[state.messages.length - 1];
            if (lastMessage && lastMessage.isStreaming) {
                lastMessage.isStreaming = false;
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
    setChats, prependChat, setMessages, setChatMessages, setMessagesLoadingChatId, addMessage, setCurrentChatId, 
    setLoading, setIsGenerating, setActivityStep, setError, setIsCreating, clearChat, appendChunk, resetStreamingChunk, setActiveToolEvent, stopStreaming,
    prependMessages, setHasMoreMessages, setMessagesPage, setTotalMessages, setIsLoadingMore,
    toggleSidebarCollapse, setSidebarCollapse
} = chatSlice.actions;
export default chatSlice.reducer;
