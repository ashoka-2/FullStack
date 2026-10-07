import React, { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router";
import Auth from "../features/auth/pages/Auth";
import Dashboard from "../features/chat/pages/Dashboard";
import ChatPage2 from "../features/chat/pages/ChatPage2";
import Protected from "../features/auth/components/Protected";
import AdminProtected from "../features/admin/components/AdminProtected";
import Layout from "./Layout";
import ErrorBoundary from "./ErrorBoundary";
import { useSelector } from "react-redux";
import LandingPage from "../features/pages/LandingPage";

// Route Loading Spinner for Lazy Chunk Loading
const RouteLoadingFallback = () => (
    <div className="min-h-[50vh] w-full flex items-center justify-center p-8" aria-label="Loading page">
        <div className="w-7 h-7 rounded-full border-2 border-zinc-700 border-t-[var(--accent-cyan)] animate-spin" />
    </div>
);

const withLazy = (importFn) => {
    const LazyComponent = lazy(importFn);
    return function LazyWrapper(props) {
        return (
            <Suspense fallback={<RouteLoadingFallback />}>
                <LazyComponent {...props} />
            </Suspense>
        );
    };
};

// Secondary Chat & Hub Pages (Lazy Loaded)
const Library = withLazy(() => import("../features/chat/pages/Library"));
const SocialConnections = withLazy(() => import("../features/auth/pages/SocialConnections"));
const Settings = withLazy(() => import("../features/auth/pages/Settings"));

// Settings Sub-Pages (Lazy Loaded)
const ProfileSettingsPage = withLazy(() => import("../features/auth/pages/settings/ProfileSettingsPage"));
const PasswordSettingsPage = withLazy(() => import("../features/auth/pages/settings/PasswordSettingsPage"));
const ApiKeysSettingsPage = withLazy(() => import("../features/auth/pages/settings/ApiKeysSettingsPage"));
const MascotSettingsPage = withLazy(() => import("../features/auth/pages/settings/MascotSettingsPage"));
const VoiceSettingsPage = withLazy(() => import("../features/auth/pages/settings/VoiceSettingsPage"));
const SubscriptionSettingsPage = withLazy(() => import("../features/auth/pages/settings/SubscriptionSettingsPage"));
const MemorySettingsPage = withLazy(() => import("../features/auth/pages/settings/MemorySettingsPage"));
const GeneralSettingsPage = withLazy(() => import("../features/auth/pages/settings/GeneralSettingsPage"));
const NotificationsSettingsPage = withLazy(() => import("../features/auth/pages/settings/NotificationsSettingsPage"));
const SafetySettingsPage = withLazy(() => import("../features/auth/pages/settings/SafetySettingsPage"));
const StorageSettingsPage = withLazy(() => import("../features/auth/pages/settings/StorageSettingsPage"));
const ReportBugPage = withLazy(() => import("../features/auth/pages/settings/ReportBugPage"));
const DevicesPage = withLazy(() => import("../features/device/pages/DevicesPage"));

// Info & Legal Pages (Lazy Loaded)
const PrivacyPolicy = withLazy(() => import("../features/pages/PrivacyPolicy"));
const TermsOfService = withLazy(() => import("../features/pages/TermsOfService"));
const About = withLazy(() => import("../features/pages/About"));
const Contact = withLazy(() => import("../features/pages/Contact"));
const FAQ = withLazy(() => import("../features/pages/FAQ"));
const Pricing = withLazy(() => import("../features/pages/Pricing"));
const SystemStatus = withLazy(() => import("../features/pages/SystemStatus"));
const Changelog = withLazy(() => import("../features/pages/Changelog"));
const NotFound = withLazy(() => import("../features/pages/NotFound"));
const MaintenanceMode = withLazy(() => import("../features/pages/MaintenanceMode"));

// Admin Console (Lazy Loaded)
const AdminLayout = withLazy(() => import("../features/admin/components/AdminLayout"));
const AdminDashboardPage = withLazy(() => import("../features/admin/pages/AdminDashboardPage"));
const AdminUsersPage = withLazy(() => import("../features/admin/pages/AdminUsersPage"));
const AdminNewsletterPage = withLazy(() => import("../features/admin/pages/AdminNewsletterPage"));
const AdminContactsPage = withLazy(() => import("../features/admin/pages/AdminContactsPage"));
const AdminApiUsagePage = withLazy(() => import("../features/admin/pages/AdminApiUsagePage"));
const AdminPricingPage = withLazy(() => import("../features/admin/pages/AdminPricingPage"));
const AdminSocialHubPage = withLazy(() => import("../features/admin/pages/AdminSocialHubPage"));
const AdminMediaVaultPage = withLazy(() => import("../features/admin/pages/AdminMediaVaultPage"));
const AdminAiWorkspacePage = withLazy(() => import("../features/admin/pages/AdminAiWorkspacePage"));
const AdminSettingsPage = withLazy(() => import("../features/admin/pages/AdminSettingsPage"));
const AdminBugReportsPage = withLazy(() => import("../features/admin/pages/AdminBugReportsPage"));

const RootRoute = () => {
    const user = useSelector(state => state.auth.user);
    if (user) {
        // Admins go directly to their console
        if (user.role === 'admin') {
            return <Navigate to="/admin/dashboard" replace />;
        }
        return <Navigate to="/ai" replace />;
    }
    return <LandingPage />;
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
                path: "/auth/google/callback",
                element: <Auth />
            },
            {
                path: "/auth/callback",
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
                element: <RootRoute />
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
                path: "/settings/models",
                element: <Protected><ApiKeysSettingsPage /></Protected>
            },
            {
                path: "/models",
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
            {
                path: "/settings/memory",
                element: <Protected><MemorySettingsPage /></Protected>
            },
            {
                path: "/settings/general",
                element: <Protected><GeneralSettingsPage /></Protected>
            },
            {
                path: "/settings/notifications",
                element: <Protected><NotificationsSettingsPage /></Protected>
            },
            {
                path: "/settings/safety",
                element: <Protected><SafetySettingsPage /></Protected>
            },
            {
                path: "/settings/storage",
                element: <Protected><StorageSettingsPage /></Protected>
            },
            {
                path: "/settings/report-bug",
                element: <Protected><ReportBugPage /></Protected>
            },
            {
                path: "/settings/devices",
                element: <Protected><DevicesPage /></Protected>
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
    },
    {
        path: "/admin",
        element: <AdminProtected><AdminLayout /></AdminProtected>,
        errorElement: <ErrorBoundary />,
        children: [
            { index: true, element: <Navigate to="/admin/dashboard" replace /> },
            { path: "dashboard", element: <AdminDashboardPage /> },
            { path: "users", element: <AdminUsersPage /> },
            { path: "pricing", element: <AdminPricingPage /> },
            { path: "ai-workspace", element: <AdminAiWorkspacePage /> },
            { path: "ai", element: <Navigate to="/admin/ai-workspace" replace /> },
            { path: "social-connections", element: <AdminSocialHubPage /> },
            { path: "social-hub", element: <Navigate to="/admin/social-connections" replace /> },
            { path: "media-vault", element: <AdminMediaVaultPage /> },
            { path: "library", element: <Navigate to="/admin/media-vault" replace /> },
            { path: "settings", element: <AdminSettingsPage /> },
            { path: "newsletter", element: <AdminNewsletterPage /> },
            { path: "contacts", element: <AdminContactsPage /> },
            { path: "bug-reports", element: <AdminBugReportsPage /> },
            { path: "api-usage", element: <AdminApiUsagePage /> }
        ]
    }
])