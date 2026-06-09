import { useDispatch } from "react-redux";
import axios from "axios";
import {
    setActivePopups,
    setAllPopups,
    setLoading,
    setError,
    addPopup,
    updatePopupInState,
    removePopup,
} from "../State/popup.slice";
import { addToast } from "../../../app/toast.slice";

export const usePopup = () => {
    const dispatch = useDispatch();

    const toast = (message, type = "success") => dispatch(addToast({ message, type }));
    const errMsg = (e) => e?.response?.data?.message || "Operation failed. Please try again.";

    const fetchActivePopups = async () => {
        try {
            const res = await axios.get("/api/popups/active");
            if (res.data?.success) {
                dispatch(setActivePopups(res.data.popups));
            }
            return res.data;
        } catch (e) {
            console.error("Fetch active popups error:", e);
        }
    };

    const fetchAllPopups = async () => {
        dispatch(setLoading(true));
        try {
            const res = await axios.get("/api/popups", { withCredentials: true });
            if (res.data?.success) {
                dispatch(setAllPopups(res.data.popups));
            }
            return res.data;
        } catch (e) {
            dispatch(setError(errMsg(e)));
            toast(errMsg(e), "error");
        } finally {
            dispatch(setLoading(false));
        }
    };

    const handleCreatePopup = async (formData) => {
        dispatch(setLoading(true));
        try {
            const headers = formData instanceof FormData 
                ? { "Content-Type": "multipart/form-data" } 
                : { "Content-Type": "application/json" };
                
            const res = await axios.post("/api/popups", formData, {
                headers,
                withCredentials: true,
            });

            if (res.data?.success) {
                dispatch(addPopup(res.data.popup));
                toast("Popup campaign created! 🎉");
            }
            return res.data;
        } catch (e) {
            toast(errMsg(e), "error");
            throw e;
        } finally {
            dispatch(setLoading(false));
        }
    };

    const handleUpdatePopup = async (id, formData) => {
        dispatch(setLoading(true));
        try {
            const headers = formData instanceof FormData 
                ? { "Content-Type": "multipart/form-data" } 
                : { "Content-Type": "application/json" };

            const res = await axios.put(`/api/popups/${id}`, formData, {
                headers,
                withCredentials: true,
            });

            if (res.data?.success) {
                dispatch(updatePopupInState(res.data.popup));
                toast("Popup campaign updated! 📝");
            }
            return res.data;
        } catch (e) {
            toast(errMsg(e), "error");
            throw e;
        } finally {
            dispatch(setLoading(false));
        }
    };

    const handleDeletePopup = async (id) => {
        dispatch(setLoading(true));
        try {
            const res = await axios.delete(`/api/popups/${id}`, { withCredentials: true });
            if (res.data?.success) {
                dispatch(removePopup(id));
                toast("Popup deleted successfully.");
            }
            return res.data;
        } catch (e) {
            toast(errMsg(e), "error");
            throw e;
        } finally {
            dispatch(setLoading(false));
        }
    };

    const handleTogglePopupActive = async (id) => {
        try {
            const res = await axios.patch(`/api/popups/${id}/toggle`, {}, { withCredentials: true });
            if (res.data?.success) {
                dispatch(updatePopupInState(res.data.popup));
                toast(res.data.popup.isActive ? "Popup is now LIVE! ⚡" : "Popup set to Draft.");
            }
            return res.data;
        } catch (e) {
            toast(errMsg(e), "error");
            throw e;
        }
    };

    return {
        fetchActivePopups,
        fetchAllPopups,
        handleCreatePopup,
        handleUpdatePopup,
        handleDeletePopup,
        handleTogglePopupActive,
    };
};
