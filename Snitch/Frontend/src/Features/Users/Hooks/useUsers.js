import { useDispatch } from "react-redux";
import { addToast } from "../../../app/toast.slice";
import {
  setAllUsers,
  setSelectedUser,
  setLoading,
  setDetailLoading,
  setError,
} from "../State/users.slice";
import * as api from "../Services/users.api";

export const useUsers = () => {
  const dispatch = useDispatch();

  const toast = (message, type = "success") =>
    dispatch(addToast({ message, type }));
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

  // ── Toggle ban/unban on a user ─────────────────────────────────────────
  const handleToggleBanUser = async (userId) => {
    let originalSelectedUser = null;
    let originalAllUsers = [];

    dispatch((_, getState) => {
      originalSelectedUser = getState().users.selectedUser;
      originalAllUsers = [...getState().users.allUsers];
    });

    // 1. Compute optimistic state
    const nextBannedState = originalSelectedUser
      ? !originalSelectedUser.isBanned
      : true;

    if (originalSelectedUser && originalSelectedUser._id === userId) {
      dispatch(
        setSelectedUser({ ...originalSelectedUser, isBanned: nextBannedState }),
      );
    }

    const nextAllUsers = originalAllUsers.map((u) => {
      if (u._id === userId) {
        return { ...u, isBanned: nextBannedState };
      }
      return u;
    });
    dispatch(setAllUsers(nextAllUsers));

    toast(
      nextBannedState
        ? "User banned successfully."
        : "User unbanned successfully.",
    );

    try {
      const data = await api.toggleBanUser(userId);
      // Sync with final backend state returning
      if (originalSelectedUser && originalSelectedUser._id === userId) {
        dispatch(
          setSelectedUser({
            ...originalSelectedUser,
            isBanned: data.user?.isBanned ?? nextBannedState,
          }),
        );
      }
      const syncedAllUsers = originalAllUsers.map((u) => {
        if (u._id === userId) {
          return { ...u, isBanned: data.user?.isBanned ?? nextBannedState };
        }
        return u;
      });
      dispatch(setAllUsers(syncedAllUsers));
      return data;
    } catch (e) {
      // Rollback on failure
      if (originalSelectedUser && originalSelectedUser._id === userId) {
        dispatch(setSelectedUser(originalSelectedUser));
      }
      dispatch(setAllUsers(originalAllUsers));
      toast(errMsg(e), "error");
    }
  };

  return {
    handleFetchAllUsers,
    handleFetchUserDetail,
    clearSelectedUser,
    handleToggleBanUser,
  };
};
