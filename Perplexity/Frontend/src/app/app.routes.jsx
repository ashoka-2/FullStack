import { createBrowserRouter, Navigate } from "react-router";
import Login from "../features/auth/pages/Login";
import Register from "../features/auth/pages/Register";
import Dashboard from "../features/chat/pages/Dashboard";
import ChatPage2 from "../features/chat/pages/ChatPage2";
import Library from "../features/chat/pages/Library";
import Protected from "../features/auth/components/Protected";
import Layout from "./Layout";


export const router = createBrowserRouter([
    {
        element: <Layout />,
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
                path: "/dashboard",
                element: <Navigate to="/" />
            }
        ]
    }
])