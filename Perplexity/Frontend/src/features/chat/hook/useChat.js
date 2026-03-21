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
    setError, 
    setCurrentChatId,
    setIsCreating,
    appendChunk 
} from "../chat.slice";
import { getSocket, initializeSocketConnection } from "../service/chat.socket";
import { useNavigate } from "react-router";

// Yeh custom hook chat se related saare operations (send message, fetch chats, etc.) handle karta hai
export const useChat = () => {
    const dispatch = useDispatch(); // Redux state ko update karne ke liye
    const navigate = useNavigate(); // Pages ke beech navigation ke liye

    // Message bhejne ka function, isme naye chat ka creation aur streaming messages bhi handled hain
    async function handleSendMessage(message, chatId, file) {
        try {
            dispatch(setError(null)); // Purana koi error ho toh clear kardo
            dispatch(setLoading(true)); // Loading state on kar do taki UI me loader dikhe
            
            // Agar chatId nahi hai iska matlab naya chat banne wala hai
            // Toh sidebar me ek naye chat ka skeleton (placeholder) dikhane ke liye isCreating true karte hain
            if (!chatId) {
                dispatch(setIsCreating(true));
            }

            // User ka message turant screen pe dikhane ke liye locally ek temporary message banate hain
            const tempUserMsg = { 
                _id: Date.now(), // Temporary ID current time se
                role: 'user', 
                content: message,
                file: file ? { url: URL.createObjectURL(file) } : null // Agar file hai toh uska local preview URL banate hain
            };
            dispatch(addMessage(tempUserMsg)); // Redux store me user message add kiya

            // AI ka response abhi aana baaki hai (stream hoke aayega)
            // Toh ek khali placeholder AI message add karte hain jismein content baad me fill hoga
            const tempAiMsg = { 
                _id: "streaming-msg-" + Date.now(), 
                role: 'ai', 
                content: "",
                isStreaming: true // Ye flag frontend ko batayega ki typing animation chalo ho raha hai
            };
            dispatch(addMessage(tempAiMsg));

            // Socket object la rahe hain taki backend streaming responses is socket ID pe bhej sake
            const socket = getSocket();
            // Backend endpoint ko message data bheja, sath me chat ID, file aur socket ID bhi diya
            const response = await sendMessage(message, chatId, file, socket?.id);
            
            // Backend se reply me agar chat ki details aayin (yani ki naya chat start hua tha)
            // toh currentChatId set karenge aur saare chats ko dobara fetch karenge sidebar list update karne ke liye
            if (response.chat) {
                dispatch(setCurrentChatId(response.chat._id));
                handleGetChats();
            }
            
            // Jab ek baar message fully load ho gaya, backend me jo updated messages hain ussey dobara layenge
            // Taaki DB wala accurate ID aur content app ki state me aa jaye
            if (response.chat) {
                handleGetMessages(response.chat._id);
            }
            
            return response;
        } catch (error) {
            console.error("❌ Send Message Error:", error); // Console me proper error dump taki developer ko pata chale kya failed hua
            // Agar backend se koi custom message aaya hai toh wo dikhao, varna ek default message
            dispatch(setError(error.response?.data?.message || "Message bhejte waqt kuch galti hui. Kripya dubaara koshish karein."));
            throw error;
        } finally {
            dispatch(setLoading(false)); // Kaam pura hone ke baad loading band karein
            dispatch(setIsCreating(false)); // Naye chat wala loading state bhi band karein
        }
    }

    // Saare chats history / list fetch karne wala function
    async function handleGetChats() {
        try {
            dispatch(setError(null));
            dispatch(setLoading(true)); // List laane se pehle load chalu kiya
            
            const response = await getChats(); // Backend se user ke saare chats mange
            dispatch(setChats(response.chats)); // Aaye huye chats ko redux global state me store kiya
            return response;
        } catch (error) {
            console.error("❌ Fetch Chats Error:", error);
            dispatch(setError(error.response?.data?.message || "Aapke purane chats load nahi ho paa rahe hain."));
            throw error;
        } finally {
            dispatch(setLoading(false));
        }
    }

    // Kisi ek specific chat ke messages fetch karne ka logic
    async function handleGetMessages(chatId) {
        try {
            dispatch(setError(null));
            dispatch(setLoading(true));
            
            const response = await getMessages(chatId); // Backend API call chat ki id ke saath
            dispatch(setMessages(response.messages)); // Jo messages aayein unko state me save kiya
            dispatch(setCurrentChatId(chatId)); // Current active chat ki ID set kar rahe hain
            return response;
        } catch (error) {
            console.error("❌ Fetch Messages Error:", error);
            dispatch(setError(error.response?.data?.message || "Is chat ke messages padhne me dikkat aayi."));
            throw error;
        } finally {
            dispatch(setLoading(false));
        }
    }

    // Ek chat ko permanently delete karne ka function
    async function handleDeleteChat(chatId) {
        try {
            dispatch(setLoading(true)); // Delete process ke dauran loading ON
            const response = await deleteChat(chatId); // Backend delete endpoint
            
            // Agar user usi chat ke page pe tha jiska deletion hua hai
            // Toh usko immediately home page ('/') pe navigate kara dete hain taki 'Not Found' na dikhe
            if (window.location.pathname.includes(chatId)) {
                navigate('/');
            }

            // Ek baar delete ho gaya toh chats ki list ko update karna padega (refresh list)
            handleGetChats();
            return response;
        } catch (error) {
            console.error("❌ Delete Chat Error:", error);
            dispatch(setError(error.response?.data?.message || "Chat delete hone me nakamyab raha. Kuch pareshani hui hai."));
            throw error;
        } finally {
            dispatch(setLoading(false)); // Kaam finish, loading OFF
        }
    }

    // AI suggestions fetch karne ka function (Jaise 'related topics' ya follow up sawaal)
    async function handleGetSuggestions(chatId) {
        try {
            dispatch(setError(null));
            // Backend se context ke basis pe fresh suggestions lo
            const response = await getSuggestions(chatId);
            return response.suggestions; 
        } catch (error) {
            console.error("⚠️ AI Suggestions Failed:", error);
            // Hum isme dispatch(setError(...)) nahi daal rhe kyunki yeh feature thoda 
            // secondary / optional hai. Agar ye fail b ho jaye to user ka main focus 
            // chat rukna nahi chahiye. Isiliye silent error fallback (return null) banaya.
            return null;
        }
    }

    // Naya global search function library section ke liye return kar rhe hain
    async function handleSearchMessagesGlobally(query) {
        try {
            const data = await searchMessagesGlobally(query);
            return data.results;
        } catch (error) {
            console.error("⚠️ Search Global Failed:", error);
            return [];
        }
    }

    // Ye object wo functions aur state return kar raha hai jo kisi aur component (jaise ChatArea ya Sidebar) ko zarurat hongi
    return {
        handleSendMessage,
        handleGetChats,
        handleGetMessages,
        handleDeleteChat,
        handleGetSuggestions,
        handleSearchMessagesGlobally, // export added
        initializeSocketConnection, // Socket server se connect karne wala helper
        loading: useSelector(state => state.chat.loading),       // Current loading state Redux se laya
        isCreating: useSelector(state => state.chat.isCreating)  // Current isCreating state Naye Chat banane wale loader ke liye
    };
};

