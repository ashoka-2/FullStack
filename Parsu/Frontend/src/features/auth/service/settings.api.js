import api from '../../../utils/axios.js';

// ─── Settings ─────────────────────────────────────────────────────────────
export async function getUserSettings() {
    const res = await api.get('/api/settings');
    return res.data;
}

export async function updateUserSettings(payload) {
    const res = await api.put('/api/settings', payload);
    return res.data;
}

export async function clearUserMemory() {
    const res = await api.delete('/api/settings/memory');
    return res.data;
}

// ─── Media ─────────────────────────────────────────────────────────────────
export async function getUserMedia() {
    const res = await api.get('/api/settings/media');
    return res.data;
}

export async function deleteUserMedia(fileId) {
    const res = await api.delete(`/api/settings/media/${fileId}`);
    return res.data;
}

// ─── Bug Reports ──────────────────────────────────────────────────────────
export async function submitBugReport(payload) {
    const res = await api.post('/api/settings/bug-report', payload);
    return res.data;
}

// ─── Chat Thread Actions ───────────────────────────────────────────────────
export async function renameChat(chatId, title) {
    const res = await api.put(`/api/chats/${chatId}/rename`, { title });
    return res.data;
}

export async function togglePinChat(chatId) {
    const res = await api.put(`/api/chats/${chatId}/pin`);
    return res.data;
}
