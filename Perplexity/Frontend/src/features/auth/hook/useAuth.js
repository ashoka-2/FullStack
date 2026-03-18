import { useDispatch } from "react-redux";

import { login, register, getMe, resendVerificationEmail, logout } from "../service/auth.api";

import { setUser, setLoading, setError } from "../auth.slice";
import { clearChat } from "../../chat/chat.slice";



export function useAuth(){
    const dispatch = useDispatch();

    async function handleRegister({username,email,password}){
        try{
            dispatch(setLoading(true))
            const response = await register({username,email,password})
            dispatch(setUser(response.user))
            return response;
        }catch(error){
            dispatch(setError(error.response?.data?.message || "Registration failed"))
            throw error;
        }finally{
            dispatch(setLoading(false))
        }
    }

    async function handleLogin({email,password}){
        try{
            dispatch(setLoading(true))
            const response = await login({email,password})
            dispatch(setUser(response.user))
            return response;
        }catch(error){
            dispatch(setError(error.response?.data?.message || "Login failed"))
            throw error;
        }finally{
            dispatch(setLoading(false))
        }

    }


    async function handleGetMe(){
        try{
            dispatch(setLoading(true))
            const response = await getMe()
            dispatch(setUser(response.user))
        }catch(error){
            dispatch(setError(error.response?.data?.message || "Failed to fetch user details"))
            dispatch(setUser(null))
        }finally{
            dispatch(setLoading(false))
        }
    }

    async function handleResendEmail({email}){
        try{
            dispatch(setLoading(true))
            const response = await resendVerificationEmail({email})
            return response;
        }catch(error){
            dispatch(setError(error.response?.data?.message || "Failed to resend verification email"))
            throw error;
        }finally{
            dispatch(setLoading(false))
        }
    }

    async function handleLogout(){
        try{
            dispatch(setLoading(true))
            const response = await logout()
            dispatch(setUser(null))
            dispatch(clearChat())
            return response;
        }catch(error){
            dispatch(setError(error.response?.data?.message || "Failed to logout"))
            throw error;
        }finally{
            dispatch(setLoading(false))
        }
    }

    return {
        handleRegister,
        handleLogin,
        handleGetMe,
        handleResendEmail,
        handleLogout
    }

}