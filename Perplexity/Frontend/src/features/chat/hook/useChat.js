import { useDispatch, useSelector } from "react-redux";
import { 
    sendMessage, 
    getChats, 
    getMessages, 
    deleteChat,
    getSuggestions,
    searchMessagesGlobally
} from "../service/chat.api";
import { 
    setChats, 
    setMessages, 
    addMessage, 
    setLoading, 
    setIsGenerating,
    setError, 
    setCurrentChatId,
    setIsCreating,
    appendChunk,
    prependMessages,
    setHasMoreMessages,
    setMessagesPage,
    setTotalMessages,
    setIsLoadingMore
} from "../chat.slice";
import { getSocket, initializeSocketConnection } from "../service/chat.socket";
import { useNavigate } from "react-router";

// Yeh custom hook chat se related saare operations (send message, fetch chats, etc.) handle karta hai
export const useChat = () => {
    const dispatch = useDispatch(); // For dispatching Redux state updates
    const navigate = useNavigate(); // For navigating across pages

    // Sends user message, creates chat if needed, and sets up optimistic streaming
    async function handleSendMessage(message, chatId, file, modelOptions = null, webSearch = false, memory = true) {
        try {
            dispatch(setError(null));
            dispatch(setLoading(true));
            dispatch(setIsGenerating(true));
            
            // If there is no chatId, a new chat is being created
            if (!chatId) {
                dispatch(setIsCreating(true));
            }

            // Multi-file optimistic preview
            const tempFiles = Array.isArray(file) 
                ? file.map(f => ({ url: URL.createObjectURL(f), name: f.name }))
                : (file ? [{ url: URL.createObjectURL(file), name: file.name }] : []);

            const tempUserMsg = { 
                _id: Date.now(),
                role: 'user', 
                content: message,
                file: tempFiles[0] || null,
                files: tempFiles
            };
            dispatch(addMessage(tempUserMsg));

            // Add an optimistic placeholder AI message for streaming tokens
            const tempAiMsg = { 
                _id: "streaming-msg-" + Date.now(), 
                role: 'ai', 
                content: "",
                isStreaming: true
            };
            dispatch(addMessage(tempAiMsg));

            // Obtain socket instance for receiving token streams
            const socket = getSocket();
            const response = await sendMessage(message, chatId, file, socket?.id, modelOptions, webSearch, memory);
            
            // If a new chat was created, update current active chat ID and refresh list
            if (response.chat) {
                dispatch(setCurrentChatId(response.chat._id));
                handleGetChats();
            }
            
            // Refresh conversation messages from backend once streaming concludes
            if (response.chat) {
                handleGetMessages(response.chat._id);
            }
            
            return response;
        } catch (error) {
            console.error("❌ Send Message Error:", error);
            const errorData = error.response?.data;
            const isOverload = errorData?.isOverloaded || 
                error.response?.status === 429 || 
                error.response?.status === 503 || 
                /overload|429|503|quota|resource.*exhaust|high traffic|rate limit|capacity|failed to parse stream/i.test(errorData?.message || errorData?.error || error.message || "");
            
            const userFacingError = isOverload
                ? "Gemini is experiencing high traffic right now and may take a moment to respond. Please try again shortly or switch to another model from the dropdown."
                : (errorData?.message || "An error occurred while sending your message. Please try again.");

            dispatch(setError(userFacingError));
            throw error;
        } finally {
            dispatch(setLoading(false));
            dispatch(setIsGenerating(false));
            dispatch(setIsCreating(false));
        }
    }

    // Fetches conversation history list for the active user
    async function handleGetChats() {
        try {
            dispatch(setError(null));
            dispatch(setLoading(true));
            
            const response = await getChats();
            dispatch(setChats(response.chats));
            return response;
        } catch (error) {
            console.error("❌ Fetch Chats Error:", error);
            dispatch(setError(error.response?.data?.message || "Failed to load conversation history. Please try again."));
            throw error;
        } finally {
            dispatch(setLoading(false));
        }
    }

    // Fetches paginated messages for a specific chat
    async function handleGetMessages(chatId) {
        try {
            dispatch(setError(null));
            dispatch(setLoading(true));
            
            const response = await getMessages(chatId, 1, 10);
            dispatch(setMessages(response.messages));
            dispatch(setCurrentChatId(chatId));
            dispatch(setHasMoreMessages(response.hasMore));
            dispatch(setMessagesPage(1));
            dispatch(setTotalMessages(response.totalMessages));
            return response;
        } catch (error) {
            console.error("❌ Fetch Messages Error:", error);
            dispatch(setError(error.response?.data?.message || "Failed to load messages for this conversation. Please try again."));
            throw error;
        } finally {
            dispatch(setLoading(false));
        }
    }

    // Loads older messages on upward scroll (pagination)
    async function handleLoadMoreMessages(chatId, currentPage) {
        try {
            dispatch(setIsLoadingMore(true));
            const nextPage = currentPage + 1;
            const response = await getMessages(chatId, nextPage, 10);
            dispatch(prependMessages(response.messages));
            dispatch(setHasMoreMessages(response.hasMore));
            dispatch(setMessagesPage(nextPage));
            return response;
        } catch (error) {
            console.error("⚠️ Load More Messages Failed:", error);
            return null;
        } finally {
            dispatch(setIsLoadingMore(false));
        }
    }

    // Permanently deletes a chat conversation
    async function handleDeleteChat(chatId) {
        try {
            dispatch(setLoading(true));
            const response = await deleteChat(chatId);
            
            // If the user was viewing the deleted chat, redirect to home
            if (window.location.pathname.includes(chatId)) {
                navigate('/');
            }

            handleGetChats();
            return response;
        } catch (error) {
            console.error("❌ Delete Chat Error:", error);
            dispatch(setError(error.response?.data?.message || "Failed to delete chat. Please try again."));
            throw error;
        } finally {
            dispatch(setLoading(false));
        }
    }

    // Fetches related follow-up suggestion queries
    async function handleGetSuggestions(chatId) {
        try {
            dispatch(setError(null));
            const response = await getSuggestions(chatId);
            return response.suggestions; 
        } catch (error) {
            console.error("⚠️ AI Suggestions Failed:", error);
            return null;
        }
    }

    // Global message search across all user conversations
    async function handleSearchMessagesGlobally(query) {
        try {
            const data = await searchMessagesGlobally(query);
            return data.results;
        } catch (error) {
            console.error("⚠️ Search Global Failed:", error);
            return [];
        }
    }

    return {
        handleSendMessage,
        handleGetChats,
        handleGetMessages,
        handleDeleteChat,
        handleGetSuggestions,
        handleSearchMessagesGlobally,
        handleLoadMoreMessages,
        initializeSocketConnection,
        loading: useSelector(state => state.chat.loading),
        isGenerating: useSelector(state => state.chat.isGenerating),
        isCreating: useSelector(state => state.chat.isCreating)
    };
};
