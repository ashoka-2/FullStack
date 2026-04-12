import { createBrowserRouter } from "react-router";
import Register from "../Features/auth/pages/Register.jsx";
import Login from "../Features/auth/pages/Login.jsx";
import Home from "../Features/Home/pages/Home.jsx";

export const routes = createBrowserRouter([
    {
        path: "/",
        element:<Home/>,
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