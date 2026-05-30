import { useDispatch } from "react-redux";
import { addToast } from "../../../app/toast.slice";
import { setAllUsers, setSelectedUser, setLoading, setDetailLoading, setError } from "../State/users.slice";
import * as api from "../Services/users.api";

export const useUsers = () => {
    const dispatch = useDispatch();

    const toast = (message, type = "success") => dispatch(addToast({ message, type }));
    const errMsg = (e) => e?.response?.data?.message || "Something went wrong.";

    // ── Fetch all users (for admin/seller user list) ───────────────────────
    const handleFetchAllUsers = async () => {
        dispatch(setLoading(true));
        try {
            const data = await api.getAllUsers();
            dispatch(setAllUsers(data.users || []));
            return data.users;
        } catch (e) {
            dispatch(setError(errMsg(e)));
            toast(errMsg(e), "error");
        } finally {
            dispatch(setLoading(false));
        }
    };

    // ── Fetch one user's full detail for the panel ─────────────────────────
    const handleFetchUserDetail = async (userId) => {
        dispatch(setDetailLoading(true));
        dispatch(setSelectedUser(null));
        try {
            const data = await api.getUserDetail(userId);
            dispatch(setSelectedUser(data.user));
            return data.user;
        } catch (e) {
            toast(errMsg(e), "error");
        } finally {
            dispatch(setDetailLoading(false));
        }
    };

    // ── Clear the selected user (close panel) ─────────────────────────────
    const clearSelectedUser = () => dispatch(setSelectedUser(null));

    return { handleFetchAllUsers, handleFetchUserDetail, clearSelectedUser };
};
