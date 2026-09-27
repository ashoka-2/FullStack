/**
 * useDeviceSync — manages real-time device state via socket + REST polling
 *
 * Returns: { devices, auditLogs, loading, refreshing, refresh }
 * Handles: socket events (sync_list, status_change, telemetry), REST fallback polling
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { addToast } from '../../../utils/toast.slice';
import {
    getDevicesApi,
    getDeviceAuditLogsApi
} from '../service/device.api';
import { initializeSocketConnection } from '../../chat/service/chat.socket';

export function useDeviceSync(pollIntervalMs = 8000) {
    const dispatch = useDispatch();
    const [devices, setDevices] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const intervalRef = useRef(null);

    const loadData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const [devRes, auditRes] = await Promise.all([
                getDevicesApi(),
                getDeviceAuditLogsApi({ limit: 20 })
            ]);
            if (devRes.success) setDevices(devRes.devices || []);
            if (auditRes.success) setAuditLogs(auditRes.logs || []);
        } catch (err) {
            if (!silent) {
                dispatch(addToast({ type: 'error', message: 'Failed to load devices' }));
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [dispatch]);

    const refresh = useCallback(() => {
        setRefreshing(true);
        loadData(true);
    }, [loadData]);

    useEffect(() => {
        loadData();

        // Polling fallback
        intervalRef.current = setInterval(() => loadData(true), pollIntervalMs);

        // Real-time socket updates
        const socket = initializeSocketConnection();

        const onSyncList = (updated) => {
            setDevices(updated.map(d => { const c = { ...d }; delete c.deviceSecret; return c; }));
        };
        const onStatusChange = ({ deviceId, status, lastSeen }) => {
            setDevices(prev => prev.map(d =>
                d._id === deviceId ? { ...d, status, lastSeen } : d
            ));
        };
        const onTelemetry = ({ deviceId, systemMetrics, lastSeen }) => {
            setDevices(prev => prev.map(d =>
                d._id === deviceId ? { ...d, systemMetrics, lastSeen } : d
            ));
        };

        socket.on('device:sync_list', onSyncList);
        socket.on('device:status_change', onStatusChange);
        socket.on('device:telemetry', onTelemetry);

        // Also refresh audit log when a command completes
        socket.on('device:action_finished', () => loadData(true));
        socket.on('device:relay_completed', () => loadData(true));

        return () => {
            clearInterval(intervalRef.current);
            socket.off('device:sync_list', onSyncList);
            socket.off('device:status_change', onStatusChange);
            socket.off('device:telemetry', onTelemetry);
            socket.off('device:action_finished');
            socket.off('device:relay_completed');
        };
    }, [loadData, pollIntervalMs]);

    return { devices, setDevices, auditLogs, setAuditLogs, loading, refreshing, refresh, loadData };
}
