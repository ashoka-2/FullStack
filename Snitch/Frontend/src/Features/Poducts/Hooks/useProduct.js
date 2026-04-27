// 📦 Product Hook - v1.0.1 (Force Sync)
import { useDispatch } from "react-redux";
import { 
    setAllProducts, 
    setSellerProducts, 
    prependSellerProduct, 
    setLoading, 
    setSellerLoading, 
    setCreating, 
    updateProductInList, 
    removeProductFromList, 
    setError 
} from "../State/product.slice";
import { 
    createProduct, 
    getAllProducts, 
    getSellerProducts, 
    updateProduct, 
    deleteProduct 
} from "../Services/product.api";
import { addToast } from "../../../app/toast.slice";

/**
 * Custom hook for managing all product-related actions and state transitions.
 * Handles creation, fetching, updating, listing, and publishing.
 */
export const useProduct = () => {
    const dispatch = useDispatch();

    // ─── Create Product ───────────────────────────────────────────────────
    const handleCreateProduct = async (productData) => {
        dispatch(setCreating(true));
        try {
            const data = await createProduct(productData);
            if (data?.product) {
                dispatch(prependSellerProduct(data.product));
            }
            dispatch(addToast({ message: "Product listed successfully! 🚀", type: "success" }));
            return data;
        } catch (error) {
            const message = error.response?.data?.message || "Failed to create product.";
            dispatch(addToast({ message, type: "error" }));
            throw error;
        } finally {
            dispatch(setCreating(false));
        }
    };

    // ─── Fetch All Products (Public) ──────────────────────────────────────
    const handleGetAllProducts = async () => {
        dispatch(setLoading(true));
        try {
            const data = await getAllProducts();
            dispatch(setAllProducts(data.products));
            return data;
        } catch (error) {
            const message = error.response?.data?.message || "Failed to fetch products.";
            dispatch(setError(message));
            dispatch(addToast({ message, type: "error" }));
            throw error;
        } finally {
            dispatch(setLoading(false));
        }
    };

    // ─── Fetch Seller's Products ──────────────────────────────────────────
    const handleGetSellerProducts = async () => {
        dispatch(setSellerLoading(true));
        try {
            const data = await getSellerProducts();
            dispatch(setSellerProducts(data.products));
            return data;
        } catch (error) {
            const message = error.response?.data?.message || "Failed to fetch your products.";
            dispatch(setError(message));
            dispatch(addToast({ message, type: "error" }));
            throw error;
        } finally {
            dispatch(setSellerLoading(false));
        }
    };

    // ─── Update Existing Product ─────────────────────────────────────────
    const handleUpdateProduct = async (id, productData) => {
        dispatch(setCreating(true));
        try {
            const data = await updateProduct(id, productData);
            if (data?.product) {
                dispatch(updateProductInList(data.product));
            }
            dispatch(addToast({ message: "Product updated successfully!", type: "success" }));
            return data;
        } catch (error) {
            const message = error.response?.data?.message || "Failed to update product.";
            dispatch(addToast({ message, type: "error" }));
            throw error;
        } finally {
            dispatch(setCreating(false));
        }
    };

    // ─── Delete Product ───────────────────────────────────────────────────
    const handleDeleteProduct = async (id) => {
        try {
            await deleteProduct(id);
            dispatch(removeProductFromList(id));
            dispatch(addToast({ message: "Product removed from catalog. 🗑️", type: "success" }));
        } catch (error) {
            const message = error.response?.data?.message || "Failed to delete product.";
            dispatch(addToast({ message, type: "error" }));
            throw error;
        }
    };

    // ─── QUICK PUBLISH (Draft to Active) ──────────────────────────────────
    const handlePublish = async (id) => {
        try {
            const data = await updateProduct(id, { status: "active" });
            if (data?.product) {
                dispatch(updateProductInList(data.product));
            }
            dispatch(addToast({ message: "Product is now LIVE! 🚀", type: "success" }));
            return data;
        } catch (error) {
            const message = error.response?.data?.message || "Failed to publish product.";
            dispatch(addToast({ message, type: "error" }));
            throw error;
        }
    };

    // Return all actions in a single coherent object
    return {
        handleCreateProduct,
        handleGetAllProducts,
        handleGetSellerProducts,
        handleUpdateProduct,
        handleDeleteProduct,
        handlePublish
    };
};