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

// Settings Sub-Pages
import ProfileSettingsPage from "../features/auth/pages/settings/ProfileSettingsPage";
import PasswordSettingsPage from "../features/auth/pages/settings/PasswordSettingsPage";
import ApiKeysSettingsPage from "../features/auth/pages/settings/ApiKeysSettingsPage";
import MascotSettingsPage from "../features/auth/pages/settings/MascotSettingsPage";
import VoiceSettingsPage from "../features/auth/pages/settings/VoiceSettingsPage";

// Info Pages
import PrivacyPolicy from "../features/pages/PrivacyPolicy";
import TermsOfService from "../features/pages/TermsOfService";
import About from "../features/pages/About";
import Contact from "../features/pages/Contact";
import FAQ from "../features/pages/FAQ";
import MaintenanceMode from "../features/pages/MaintenanceMode";

import { useSelector } from "react-redux";
import LandingPage from "../features/pages/LandingPage";

// Conditional root page: shows Dashboard for logged-in users, LandingPage for guests/Google reviewers
const RootPage = () => {
    const user = useSelector((state) => state.auth.user);
    return user ? <Dashboard /> : <LandingPage />;
};

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
                element: <RootPage />
            },
            {
                path: "/welcome",
                element: <LandingPage />
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
                path: "/socials",
                element: <Navigate to="/social-connections" replace />
            },
            {
                path: "/settings",
                element: <Protected><Settings /></Protected>
            },
            // Settings Sub-Pages
            {
                path: "/settings/profile",
                element: <Protected><ProfileSettingsPage /></Protected>
            },
            {
                path: "/settings/password",
                element: <Protected><PasswordSettingsPage /></Protected>
            },
            {
                path: "/settings/api-keys",
                element: <Protected><ApiKeysSettingsPage /></Protected>
            },
            {
                path: "/settings/mascot",
                element: <Protected><MascotSettingsPage /></Protected>
            },
            {
                path: "/settings/voice",
                element: <Protected><VoiceSettingsPage /></Protected>
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