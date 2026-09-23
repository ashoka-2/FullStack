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
import SubscriptionSettingsPage from "../features/auth/pages/settings/SubscriptionSettingsPage";

// Info Pages
import PrivacyPolicy from "../features/pages/PrivacyPolicy";
import TermsOfService from "../features/pages/TermsOfService";
import About from "../features/pages/About";
import Contact from "../features/pages/Contact";
import FAQ from "../features/pages/FAQ";
import Pricing from "../features/pages/Pricing";
import SystemStatus from "../features/pages/SystemStatus";
import Changelog from "../features/pages/Changelog";
import NotFound from "../features/pages/NotFound";
import MaintenanceMode from "../features/pages/MaintenanceMode";
import AdminLayout from "../features/admin/components/AdminLayout";
import AdminDashboardPage from "../features/admin/pages/AdminDashboardPage";
import AdminUsersPage from "../features/admin/pages/AdminUsersPage";
import AdminNewsletterPage from "../features/admin/pages/AdminNewsletterPage";
import AdminContactsPage from "../features/admin/pages/AdminContactsPage";
import AdminApiUsagePage from "../features/admin/pages/AdminApiUsagePage";
import AdminPricingPage from "../features/admin/pages/AdminPricingPage";
import AdminProtected from "../features/admin/components/AdminProtected";

import LandingPage from "../features/pages/LandingPage";

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
                element: <LandingPage />
            },
            {
                path: "/ai",
                element: <Dashboard />
            },
            {
                path: "/dashboard",
                element: <Navigate to="/ai" replace />
            },
            {
                path: "/welcome",
                element: <Navigate to="/" replace />
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
            {
                path: "/admin",
                element: <AdminProtected><AdminLayout /></AdminProtected>,
                children: [
                    { index: true, element: <Navigate to="/admin/dashboard" replace /> },
                    { path: "dashboard", element: <AdminDashboardPage /> },
                    { path: "users", element: <AdminUsersPage /> },
                    { path: "pricing", element: <AdminPricingPage /> },
                    { path: "newsletter", element: <AdminNewsletterPage /> },
                    { path: "contacts", element: <AdminContactsPage /> },
                    { path: "api-usage", element: <AdminApiUsagePage /> }
                ]
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
            {
                path: "/settings/subscription",
                element: <Protected><SubscriptionSettingsPage /></Protected>
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
                path: "/pricing",
                element: <Pricing />
            },
            {
                path: "/status",
                element: <SystemStatus />
            },
            {
                path: "/changelog",
                element: <Changelog />
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
                path: "/404",
                element: <NotFound />
            },
            {
                path: "*",
                element: <NotFound />
            }
        ]
    }
])