import axios from "axios"

const backendUrl = import.meta.env.VITE_HOST_URL

export const api = axios.create({
    baseURL:backendUrl,
    withCredentials:true,
})

export async function sendMessage(message, chatId, file) {
    const formData = new FormData();
    formData.append("message", message);
    if (chatId) formData.append("chat", chatId);
    if (file) formData.append("file", file);

    const response = await api.post("api/chats/message", formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
}

export async function getChats(){
    const response = await api.get("api/chats/")
    return response.data
}

export async function getMessages(chatId){
    const response = await api.get(`/api/chats/${chatId}/messages`)
    return response.data
}

export async function deleteChat(chatId){
    const response = await api.delete(`/api/chats/delete/${chatId}`)
    return response.data
}

export async function getSuggestions(){
    const response = await api.get("/api/chats/suggestions")
    return response.data
}