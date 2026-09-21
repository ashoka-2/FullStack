import { createBrowserRouter, Navigate } from "react-router";
import Auth from "../features/auth/pages/Auth";
import Dashboard from "../features/chat/pages/Dashboard";
import ChatPage2 from "../features/chat/pages/ChatPage2";
import Library from "../features/chat/pages/Library";
import SocialConnections from "../features/auth/pages/SocialConnections";
import Settings from "../features/auth/pages/Settings";
import Protected from "../features/auth/components/Protected";
import Layout from "./Layout";
import ErrorBoundary from "./ErrorBoundary"; // Global Error handler import

// Info Pages
import PrivacyPolicy from "../features/pages/PrivacyPolicy";
import TermsOfService from "../features/pages/TermsOfService";
import About from "../features/pages/About";
import Contact from "../features/pages/Contact";
import FAQ from "../features/pages/FAQ";
import MaintenanceMode from "../features/pages/MaintenanceMode";

export const router = createBrowserRouter([
    {
        element: <Layout />,
        errorElement: <ErrorBoundary />, // Jab koi bhi routing error ya app-level component crash ho toh ye component render hoga
        children: [
            {
                path: "/auth",
                element: <Auth />
            },
            {
                path: "/login",
                element: <Navigate to="/auth" replace />
            },
            {
                path: "/register",
                element: <Navigate to="/auth?mode=register" replace />
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
                path: "/social-connections",
                element: <Protected><SocialConnections /></Protected>
            },
            {
                path: "/settings",
                element: <Protected><Settings /></Protected>
            },
            // Info / Legal Pages (public)
            {
                path: "/privacy",
                element: <PrivacyPolicy />
            },
            {
                path: "/terms",
                element: <TermsOfService />
            },
            {
                path: "/about",
                element: <About />
            },
            {
                path: "/contact",
                element: <Contact />
            },
            {
                path: "/faq",
                element: <FAQ />
            },
            {
                path: "/maintenance",
                element: <MaintenanceMode />
            },
            {
                path: "/dashboard",
                element: <Navigate to="/" />
            },
            {
                // Legacy redirect
                path: "/connect-instagram",
                element: <Navigate to="/social-connections" />
            },
            {
                path: "*",
                element: <Navigate to="/" />
            }
        ]
    }
])