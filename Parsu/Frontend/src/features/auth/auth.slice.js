import { createSlice } from "@reduxjs/toolkit";

function getInitialUserState() {
    if (typeof window === "undefined") {
        return { user: null, loading: false };
    }
    try {
        const token = localStorage.getItem("parsu_auth_token") || localStorage.getItem("perplexity_auth_token") || localStorage.getItem("token");
        if (!token) {
            return { user: null, loading: false };
        }
        const cached = localStorage.getItem("parsu_cached_user");
        if (cached) {
            const parsed = JSON.parse(cached);
            return { user: parsed, loading: true };
        }
        return { user: null, loading: true };
    } catch {
        return { user: null, loading: false };
    }
}

const initialAuth = getInitialUserState();

const authSlice = createSlice({
    name: "auth",
    initialState: {
        user: initialAuth.user,
        loading: initialAuth.loading,
        error: null,
    },
    reducers: {
        setUser: (state, action) => {
            state.user = action.payload;
            try {
                if (action.payload) {
                    localStorage.setItem("parsu_cached_user", JSON.stringify(action.payload));
                } else {
                    localStorage.removeItem("parsu_cached_user");
                }
            } catch {}
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        }
    }
});

export const { setUser, setLoading, setError, clearError } = authSlice.actions;

export default authSlice.reducer;