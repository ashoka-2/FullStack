import { useDispatch, useSelector } from "react-redux";
import { setSettings, setLoading, setError } from "../State/settings.slice";
import * as api from "../Services/settings.api";
import { addToast } from "../../../app/toast.slice";

export const useSettings = () => {
    const dispatch = useDispatch();
    const { settings } = useSelector((state) => state.settings);

    const toast = (message, type = "success") => dispatch(addToast({ message, type }));
    const errMsg = (e) => e?.response?.data?.message || "Failed to load settings.";

    const handleGetSettings = async () => {
        // Skip if already loaded (avoid redundant calls)
        if (settings) return;

        dispatch(setLoading(true));
        try {
            const data = await api.getSettings();
            if (data.settings) {
                dispatch(setSettings(data.settings));
            }
            return data;
        } catch (e) {
            dispatch(setError(errMsg(e)));
        } finally {
            dispatch(setLoading(false));
        }
    };

    const handleUpdateSettings = async (settingsData) => {
        dispatch(setLoading(true));
        try {
            const data = await api.updateSettings(settingsData);
            if (data.settings) {
                dispatch(setSettings(data.settings));
                toast("Settings saved & published to all users! ⚡");
            }
            return data;
        } catch (e) {
            dispatch(setError(errMsg(e)));
            toast(errMsg(e), "error");
            throw e;
        } finally {
            dispatch(setLoading(false));
        }
    };

    return { handleGetSettings, handleUpdateSettings };
};
