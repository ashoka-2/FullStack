import { createBrowserRouter, Navigate } from "react-router";
import Login from "../features/auth/pages/Login";
import Register from "../features/auth/pages/Register";
import Dashboard from "../features/chat/pages/Dashboard";
import ChatPage2 from "../features/chat/pages/ChatPage2";
import Library from "../features/chat/pages/Library";
import ConnectInstagram from "../features/auth/pages/ConnectInstagram"; // New import
import Protected from "../features/auth/components/Protected";
import Layout from "./Layout";
import ErrorBoundary from "./ErrorBoundary"; // Global Error handler import

export const router = createBrowserRouter([
    {
        element: <Layout />,
        errorElement: <ErrorBoundary />, // Jab koi bhi routing error ya app-level component crash ho toh ye component render hoga
        children: [
            {
                path: "/login",
                element: <Login />
            },
            {
                path: "/register",
                element: <Register />
            },
            {
                path: "/",
                element: <Protected><Dashboard /></Protected>
            },
            {
                path: "/chat/:id",
                element: <Protected><ChatPage2 /></Protected>
            },
            {
                path: "/library",
                element: <Protected><Library /></Protected>
            },
            {
                path: "/connect-instagram",
                element: <Protected><ConnectInstagram /></Protected>
            },
            {
                path: "/dashboard",
                element: <Navigate to="/" />
            },
            {
                path: "*",
                element: <Navigate to="/login" />
            }
        ]
    }
])