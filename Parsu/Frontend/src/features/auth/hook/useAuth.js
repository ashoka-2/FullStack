import { useDispatch } from "react-redux";

import { 
    login, 
    register, 
    getMe, 
    resendVerificationEmail, 
    logout,
    forgotPasswordApi,
    verifyOtpApi,
    resetPasswordApi,
    changePasswordApi
} from "../service/auth.api";
import { AUTH_TOKEN_KEY } from "../../../utils/axios.js";

import { setUser, setLoading, setError } from "../auth.slice";
import { clearChat } from "../../chat/chat.slice";

export function useAuth(){
    const dispatch = useDispatch();

    async function handleRegister({username,email,password}){
        try{
            dispatch(setLoading(true));
            const response = await register({username,email,password});
            // Note: Do not dispatch(setUser) here because the user must verify their email first before logging in
            return response;
        }catch(error){
            const errorMsg = error.response?.data?.message || 
                             error.response?.data?.errors?.[0]?.msg || 
                             "Registration failed";
            dispatch(setError(errorMsg));
            throw error;
        }finally{
            dispatch(setLoading(false));
        }
    }

    async function handleLogin({email,password}){
        try{
            dispatch(setLoading(true));
            const response = await login({email,password});
            if (response.token) {
                try {
                    localStorage.setItem(AUTH_TOKEN_KEY, response.token);
                } catch (e) {}
            }
            dispatch(setUser(response.user));
            return response;
        }catch(error){
            const errorMsg = error.response?.data?.message || 
                             error.response?.data?.errors?.[0]?.msg || 
                             "Login failed";
            dispatch(setError(errorMsg));
            throw error;
        }finally{
            dispatch(setLoading(false));
        }
    }

    async function handleGetMe(){
        try{
            dispatch(setLoading(true));
            // Capture ?token= from Google OAuth redirect (matches Scapegoat setup)
            if (typeof window !== "undefined") {
                const params = new URLSearchParams(window.location.search);
                const oauthToken = params.get("token");
                if (oauthToken) {
                    try {
                        localStorage.setItem(AUTH_TOKEN_KEY, oauthToken);
                    } catch (e) {}
                    params.delete("token");
                    const qs = params.toString();
                    window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : ""));
                }
            }
            const response = await getMe();
            dispatch(setUser(response.user));
        }catch(error){
            // 401 means not logged in - don't show an error toast for this
            if(error.response?.status !== 401) {
                dispatch(setError(error.response?.data?.message || "Failed to fetch user details"));
            }
            dispatch(setUser(null));
        }finally{
            dispatch(setLoading(false));
        }
    }

    async function handleResendEmail({email}){
        try{
            dispatch(setLoading(true));
            const response = await resendVerificationEmail({email});
            return response;
        }catch(error){
            dispatch(setError(error.response?.data?.message || "Failed to resend verification email"));
            throw error;
        }finally{
            dispatch(setLoading(false));
        }
    }

    async function handleLogout(){
        try{
            dispatch(setLoading(true));
            try {
                await logout();
            } catch (err) {
                console.warn("Backend logout network notification:", err);
            }
            try {
                localStorage.removeItem(AUTH_TOKEN_KEY);
                localStorage.removeItem("perplexity_auth_token");
                localStorage.removeItem("parsu_auth_token");
                sessionStorage.clear();
            } catch (e) {}
            dispatch(setUser(null));
            dispatch(clearChat());
            if (typeof window !== "undefined") {
                window.location.href = "/auth";
            }
            return { success: true };
        }catch(error){
            try {
                localStorage.removeItem(AUTH_TOKEN_KEY);
                localStorage.removeItem("perplexity_auth_token");
                localStorage.removeItem("parsu_auth_token");
                sessionStorage.clear();
            } catch (e) {}
            dispatch(setUser(null));
            dispatch(clearChat());
            if (typeof window !== "undefined") {
                window.location.href = "/auth";
            }
            dispatch(setError(error.response?.data?.message || "Failed to logout"));
            throw error;
        }finally{
            dispatch(setLoading(false));
        }
    }

    async function handleForgotPassword({ email }) {
        try {
            dispatch(setLoading(true));
            const response = await forgotPasswordApi({ email });
            return response;
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Failed to send reset code";
            dispatch(setError(errorMsg));
            throw error;
        } finally {
            dispatch(setLoading(false));
        }
    }

    async function handleVerifyOtp({ email, otp }) {
        try {
            dispatch(setLoading(true));
            const response = await verifyOtpApi({ email, otp });
            return response;
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Invalid or expired verification code";
            dispatch(setError(errorMsg));
            throw error;
        } finally {
            dispatch(setLoading(false));
        }
    }

    async function handleResetPassword({ email, otp, newPassword }) {
        try {
            dispatch(setLoading(true));
            const response = await resetPasswordApi({ email, otp, newPassword });
            return response;
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Failed to reset password";
            dispatch(setError(errorMsg));
            throw error;
        } finally {
            dispatch(setLoading(false));
        }
    }

    async function handleChangePassword({ currentPassword, newPassword }) {
        try {
            dispatch(setLoading(true));
            const response = await changePasswordApi({ currentPassword, newPassword });
            return response;
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Failed to change password";
            dispatch(setError(errorMsg));
            throw error;
        } finally {
            dispatch(setLoading(false));
        }
    }

    return {
        handleRegister,
        handleLogin,
        handleGetMe,
        handleResendEmail,
        handleLogout,
        handleForgotPassword,
        handleVerifyOtp,
        handleResetPassword,
        handleChangePassword
    };
}