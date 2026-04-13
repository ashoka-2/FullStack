import { createBrowserRouter } from "react-router";
import Register from "../Features/auth/pages/Register.jsx";
import Login from "../Features/auth/pages/Login.jsx";
import Home from "../Features/Home/pages/Home.jsx";
import Profile from "../Features/auth/pages/Profile.jsx";
import MainLayout from "../Features/Components/MainLayout.jsx";

export const routes = createBrowserRouter([
    {
        path: "/",
        element: <MainLayout />,
        children: [
            {
                path: "",
                element: <Home />,
            },
            {
                path: "profile",
                element: <Profile />,
            }
        ]
    },
    {
        path: "/register",
        element: <Register />,
    },
    {
        path: "/login",
        element: <Login />,
    }
])