import api from '../../../utils/axios.js';

// ─── Device Registry ────────────────────────────────────────────────────────
export async function getDevicesApi() {
    const res = await api.get('/api/devices');
    return res.data;
}

export async function autoRegisterDeviceApi(payload) {
    const res = await api.post('/api/devices/auto-register', payload);
    return res.data;
}

export async function pairDeviceApi(payload) {
    const res = await api.post('/api/devices/pair', payload);
    return res.data;
}

export async function getDeviceByIdApi(deviceId) {
    const res = await api.get(`/api/devices/${deviceId}`);
    return res.data;
}

export async function unpairDeviceApi(deviceId) {
    const res = await api.delete(`/api/devices/${deviceId}`);
    return res.data;
}

// ─── Command Execution & Confirmation ───────────────────────────────────────
export async function executeDeviceCommandApi(payload) {
    const res = await api.post('/api/devices/execute', payload);
    return res.data;
}

export async function confirmDeviceActionApi(auditId) {
    const res = await api.post(`/api/devices/confirm/${auditId}`);
    return res.data;
}

export async function undoDeviceActionApi(auditId) {
    const res = await api.post(`/api/devices/undo/${auditId}`);
    return res.data;
}

// ─── Audit Logs ─────────────────────────────────────────────────────────────
export async function getDeviceAuditLogsApi(params = {}) {
    const res = await api.get('/api/devices/audit/logs', { params });
    return res.data;
}

// ─── Macros ─────────────────────────────────────────────────────────────────
export async function getDeviceMacrosApi() {
    const res = await api.get('/api/devices/macros');
    return res.data;
}

export async function createDeviceMacroApi(payload) {
    const res = await api.post('/api/devices/macros', payload);
    return res.data;
}

export async function runDeviceMacroApi(macroId) {
    const res = await api.post(`/api/devices/macros/${macroId}/run`);
    return res.data;
}

// ─── Clipboard ──────────────────────────────────────────────────────────────
export async function syncClipboardApi(payload) {
    const res = await api.post('/api/devices/clipboard/sync', payload);
    return res.data;
}
