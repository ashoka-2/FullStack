import { useDispatch, useSelector } from "react-redux";
import { 
    sendMessage, 
    getChats, 
    getMessages , 
    deleteChat,
    getSuggestions
} from "../service/chat.api";
import { 
    setChats, 
    setMessages, 
    addMessage, 
    setLoading, 
    setError, 
    setCurrentChatId,
    setIsCreating,
    appendChunk 
} from "../chat.slice";
import { getSocket, initializeSocketConnection } from "../service/chat.socket";
import { useNavigate } from "react-router";

export const useChat = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    async function handleSendMessage(message, chatId, file) {
        try {
            dispatch(setError(null));
            dispatch(setLoading(true));
            
            // If it's a new chat, show skeleton in sidebar
            if (!chatId) {
                dispatch(setIsCreating(true));
            }

            // Add user message locally for immediate feedback
            const tempUserMsg = { 
                _id: Date.now(), 
                role: 'user', 
                content: message,
                file: file ? { url: URL.createObjectURL(file) } : null 
            };
            dispatch(addMessage(tempUserMsg));

            // Add placeholder AI message for streaming
            const tempAiMsg = { 
                _id: "streaming-msg-" + Date.now(), 
                role: 'ai', 
                content: "",
                isStreaming: true 
            };
            dispatch(addMessage(tempAiMsg));

            const socket = getSocket();
            const response = await sendMessage(message, chatId, file, socket?.id);
            
            // Re-sync messages if it was a new chat
            if (response.chat) {
                dispatch(setCurrentChatId(response.chat._id));
                handleGetChats();
            }
            
            // Refresh the entire messages list with real DB data once streaming is done
            if (response.chat) {
                handleGetMessages(response.chat._id);
            }
            
            return response;
        } catch (error) {
            dispatch(setError(error.response?.data?.message || "Failed to send message"));
            throw error;
        } finally {
            dispatch(setLoading(false));
            dispatch(setIsCreating(false));
        }
    }

    async function handleGetChats() {
        try {
            dispatch(setError(null));
            dispatch(setLoading(true));
            const response = await getChats();
            dispatch(setChats(response.chats));
            return response;
        } catch (error) {
            dispatch(setError(error.response?.data?.message || "Failed to fetch chats"));
            throw error;
        } finally {
            dispatch(setLoading(false));
        }
    }

    async function handleGetMessages(chatId) {
        try {
            dispatch(setError(null));
            dispatch(setLoading(true));
            const response = await getMessages(chatId);
            dispatch(setMessages(response.messages));
            dispatch(setCurrentChatId(chatId));
            return response;
        } catch (error) {
            dispatch(setError(error.response?.data?.message || "Failed to fetch messages"));
            throw error;
        } finally {
            dispatch(setLoading(false));
        }
    }

    async function handleDeleteChat(chatId) {
        try {
            dispatch(setLoading(true));
            const response = await deleteChat(chatId);
            
            // Redirect to home if we are currently viewing the deleted chat
            if (window.location.pathname.includes(chatId)) {
                navigate('/');
            }

            // Refresh chats after deletion
            handleGetChats();
            return response;
        } catch (error) {
            dispatch(setError(error.response?.data?.message || "Failed to delete chat"));
            throw error;
        } finally {
            dispatch(setLoading(false));
        }
    }

    async function handleGetSuggestions() {
        try {
            dispatch(setError(null));
            const response = await getSuggestions();
            return response.suggestions;
        } catch (error) {
            console.error("Failed to fetch AI suggestions:", error);
            // Don't set global error to avoid annoying popups for secondary feature
            return null;
        }
    }

    return {
        handleSendMessage,
        handleGetChats,
        handleGetMessages,
        handleDeleteChat,
        handleGetSuggestions,
        initializeSocketConnection,
        loading: useSelector(state => state.chat.loading),
        isCreating: useSelector(state => state.chat.isCreating)
    };
};
