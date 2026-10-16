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

export async function addMemoryFactApi(fact) {
    const res = await api.post('/api/settings/memory/fact', { fact });
    return res.data;
}

export async function deleteMemoryFactApi(index) {
    const res = await api.delete(`/api/settings/memory/fact/${index}`);
    return res.data;
}

export async function getUserSkills() {
    const res = await api.get('/api/settings/skills');
    return res.data;
}

export async function createUserSkill(payload) {
    const res = await api.post('/api/settings/skills', payload);
    return res.data;
}

export async function updateUserSkill(skillId, payload) {
    const res = await api.put(`/api/settings/skills/${skillId}`, payload);
    return res.data;
}

export async function deleteUserSkill(skillId) {
    const res = await api.delete(`/api/settings/skills/${skillId}`);
    return res.data;
}

// ─── Model Context Protocol (MCP) ─────────────────────────────────────────
export async function getMcpServers() {
    const res = await api.get('/api/settings/mcp');
    return res.data;
}

export async function createMcpServer(payload) {
    const res = await api.post('/api/settings/mcp', payload);
    return res.data;
}

export async function deleteMcpServer(serverId) {
    const res = await api.delete(`/api/settings/mcp/${serverId}`);
    return res.data;
}

export async function testMcpServer(serverId) {
    const res = await api.post(`/api/settings/mcp/${serverId}/test`);
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

export async function getUserBugReports() {
    const res = await api.get('/api/settings/bug-reports');
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
