import { setError, setLoading, setUser } from "../state/auth.slice"
import { register, login, getMe, logout } from "../service/auth.api"
import { useDispatch } from "react-redux"

import { addToast } from "../../../app/toast.slice"

export const useAuth = () => {

    const dispatch = useDispatch()

    async function handleRegister({ email, contact, password, fullname, isSeller = false }) {
        dispatch(setLoading(true))
        try {
            const data = await register({ email, contact, password, fullname, isSeller })
            dispatch(setUser(data.user))
            dispatch(addToast({ message: "Welcome to Snitch! Account created successfully.", type: "success" }))
        } catch (error) {
            const message = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || "Registration failed. Please try again."
            dispatch(addToast({ message, type: "error" }))
            throw error
        } finally {
            dispatch(setLoading(false))
        }
    }

    async function handleLogin({ identifier, password }) {
        dispatch(setLoading(true))
        try {
            const data = await login({ identifier, password })
            dispatch(setUser(data.user))
            dispatch(addToast({ message: "Welcome back! Login successful.", type: "success" }))
        } catch (error) {
            const message = error.response?.data?.message || "Invalid credentials. Please check your email/contact and password."
            dispatch(addToast({ message, type: "error" }))
            throw error
        } finally {
            dispatch(setLoading(false))
        }
    }

    async function fetchMe() {
        try {
            const data = await getMe()
            dispatch(setUser(data.user))
        } catch (error) {
            console.log("Not logged in");
            dispatch(setUser(null))
        }
    }

    async function handleLogout() {
        try {
            await logout()
            dispatch(setUser(null))
            dispatch(addToast({ message: "Logged out successfully.", type: "info" }))
        } catch (error) {
            console.error("Logout failed", error);
            // Even if backend fails, we should probably clear local state
            dispatch(setUser(null))
        }
    }

    return { handleRegister, handleLogin, fetchMe, handleLogout }
}