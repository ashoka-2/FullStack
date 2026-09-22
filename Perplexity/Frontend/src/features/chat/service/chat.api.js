import api from "../../../utils/axios.js";

export { api };

export async function sendMessage(message, chatId, fileOrFiles, socketId, modelOptions = null, webSearch = false, memory = true) {
    const formData = new FormData();
    formData.append("message", message);
    if (chatId) formData.append("chat", chatId);
    if (webSearch) formData.append("webSearch", "true");
    if (memory !== undefined) formData.append("memory", String(memory));
    if (fileOrFiles) {
        if (Array.isArray(fileOrFiles)) {
            fileOrFiles.forEach(f => {
                if (f) formData.append("files", f);
            });
        } else {
            formData.append("file", fileOrFiles);
        }
    }
    if (socketId) formData.append("socketId", socketId);
    if (modelOptions) {
        if (modelOptions.id) formData.append("modelId", modelOptions.id);
        if (modelOptions.provider) formData.append("provider", modelOptions.provider);
        if (modelOptions.isCustom) formData.append("isCustom", "true");
        if (modelOptions.keyId) formData.append("keyId", modelOptions.keyId);
        if (modelOptions.webSearch) formData.append("webSearch", "true");
    }

    const response = await api.post("/api/chats/message", formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
}

export async function getChats(page = 1, limit = 50) {
    const response = await api.get("/api/chats/", {
        params: { page, limit }
    });
    return response.data;
}

export async function getMessages(chatId, page = 1, limit = 10){
    const response = await api.get(`/api/chats/${chatId}/messages`, {
        params: { page, limit }
    });
    return response.data;
}

export async function deleteChat(chatId){
    const response = await api.delete(`/api/chats/delete/${chatId}`)
    return response.data
}

export async function getSuggestions(chatId) {
    const response = await api.get("/api/chats/suggestions", {
        params: { chatId }
    });
    return response.data;
}

// Backend par naya global search execute karne wala API call
export async function searchMessagesGlobally(query) {
    const response = await api.get(`/api/chats/search`, {
        params: { q: query }
    });
    return response.data;
}

// ─── Document / RAG APIs ──────────────────────────────────────────────────────
export async function uploadDocument(file, chatId) {
    const formData = new FormData();
    formData.append("file", file);
    if (chatId) formData.append("chatId", chatId);
    const response = await api.post("/api/documents/upload", formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
}

export async function searchDocuments(query) {
    const response = await api.get("/api/documents/search", {
        params: { q: query }
    });
    return response.data;
}

// Record message feedback ('like' | 'dislike' | null)
export async function sendFeedback(messageId, feedback) {
    const response = await api.post(`/api/chats/message/${messageId}/feedback`, { feedback });
    return response.data;
}