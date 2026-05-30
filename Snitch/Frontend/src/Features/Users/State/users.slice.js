import { createSlice } from "@reduxjs/toolkit";

const usersSlice = createSlice({
    name: "users",
    initialState: {
        allUsers: [],       // flat list for tables
        selectedUser: null, // full detail object for the panel
        loading: false,
        detailLoading: false,
        error: null,
    },
    reducers: {
        setAllUsers: (s, a) => { s.allUsers = a.payload; },
        setSelectedUser: (s, a) => { s.selectedUser = a.payload; },
        setLoading: (s, a) => { s.loading = a.payload; },
        setDetailLoading: (s, a) => { s.detailLoading = a.payload; },
        setError: (s, a) => { s.error = a.payload; },
    },
});

export const { setAllUsers, setSelectedUser, setLoading, setDetailLoading, setError } = usersSlice.actions;
export default usersSlice.reducer;
