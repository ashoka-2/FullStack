import { createBrowserRouter } from "react-router";
import Register from "../Features/auth/Pages/Register.jsx";
import Login from "../Features/auth/Pages/Login.jsx";
import Home from "../Features/Home/pages/Home.jsx";
import Profile from "../Features/auth/Pages/Profile.jsx";
import MainLayout from "../Features/Components/MainLayout.jsx";
import CreateProduct from "../Features/Poducts/Pages/CreateProduct.jsx";
import ProductDetails from "../Features/Poducts/Pages/ProductDetails.jsx";
import AdminDashboard from "../Features/Admin/Pages/AdminDashboard.jsx";
import AdminLayout from "../Features/Components/AdminLayout.jsx";
import AdminUsersPage from "../Features/Admin/Pages/AdminUsersPage.jsx";
import AdminUserDetailPage from "../Features/Admin/Pages/AdminUserDetailPage.jsx";
import AdminProductDetailPage from "../Features/Admin/Pages/AdminProductDetailPage.jsx";
import AdminCategoriesPage from "../Features/Admin/Pages/AdminCategoriesPage.jsx";
import AdminBrandsPage from "../Features/Admin/Pages/AdminBrandsPage.jsx";
import AdminColorsPage from "../Features/Admin/Pages/AdminColorsPage.jsx";
import AdminSizesPage from "../Features/Admin/Pages/AdminSizesPage.jsx";
import AdminUnitsPage from "../Features/Admin/Pages/AdminUnitsPage.jsx";
import SellerDashboard from "../Features/Seller/Pages/SellerDashboard.jsx";
import Wishlist from "../Features/Wishlist/Pages/Wishlist.jsx";
import Orders from "../Features/Orders/Pages/Orders.jsx";

import Protected from "../Features/auth/components/Protected.jsx";
import AdminRoute from "../Features/auth/components/AdminRoute.jsx";
import SellerRoute from "../Features/auth/components/SellerRoute.jsx";

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
                element: <Protected><SellerRoute><CreateProduct /></SellerRoute></Protected>,
            },
            {
                path: "products/edit/:id",
                element: <Protected><SellerRoute><CreateProduct /></SellerRoute></Protected>,
            },
            {
                path: "products/:id",
                element: <ProductDetails />,
            },
            {
                path: "wishlist",
                element: <Protected><Wishlist /></Protected>,
            },
            {
                path: "orders",
                element: <Protected><Orders /></Protected>,
            },
            {
                path: "seller/dashboard",
                element: <Protected><SellerRoute><SellerDashboard /></SellerRoute></Protected>,
            }
        ]
    },
    {
        path: "/admin",
        element: <AdminRoute><AdminLayout /></AdminRoute>,
        children: [
            {
                path: "",
                element: <AdminDashboard />,
            },
            {
                path: "users",
                element: <AdminUsersPage />,
            },
            {
                path: "users/:id",
                element: <AdminUserDetailPage />,
            },
            {
                path: "products/:id",
                element: <AdminProductDetailPage />,
            },
            {
                path: "categories",
                element: <AdminCategoriesPage />,
            },
            {
                path: "brands",
                element: <AdminBrandsPage />,
            },
            {
                path: "colors",
                element: <AdminColorsPage />,
            },
            {
                path: "sizes",
                element: <AdminSizesPage />,
            },
            {
                path: "units",
                element: <AdminUnitsPage />,
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