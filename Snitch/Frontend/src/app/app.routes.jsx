import { createBrowserRouter } from "react-router";
import Register from "../Features/auth/Pages/Register.jsx";
import Login from "../Features/auth/pages/Login.jsx";
import Home from "../Features/Home/pages/Home.jsx";
import Profile from "../Features/auth/pages/Profile.jsx";
import MainLayout from "../Features/Components/MainLayout.jsx";
import CreateProduct from "../Features/Poducts/Pages/CreateProduct.jsx";
import AdminDashboard from "../Features/Admin/Pages/AdminDashboard.jsx";

import Protected from "../Features/auth/components/Protected.jsx";

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
                element: <Protected><Profile /></Protected>,
            },
            {
                path: "products/create",
                element: <Protected><CreateProduct /></Protected>,
            },
            {
                path: "products/edit/:id",
                element: <Protected><CreateProduct /></Protected>,
            },
            {
                path: "admin",
                element: <Protected><AdminDashboard /></Protected>,
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