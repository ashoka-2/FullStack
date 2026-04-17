import { setAllProducts, setSellerProducts, setLoading, setError } from "../State/product.slice";
import { createProduct, getAllProducts, getSellerProducts } from "../Services/product.api";
import { addToast } from "../../../app/toast.slice";
import { useDispatch } from "react-redux";

export const useProduct = () => {
    const dispatch = useDispatch();

    async function handleCreateProduct(productData) {
        dispatch(setLoading(true));
        try {
            const data = await createProduct(productData);
            dispatch(addToast({ message: "Product created successfully!", type: "success" }));
            return data;
        } catch (error) {
            const message = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || "Failed to create product. Please try again.";
            dispatch(addToast({ message, type: "error" }));
            throw error;
        } finally {
            dispatch(setLoading(false));
        }
    }

    async function handleGetAllProducts() {
        dispatch(setLoading(true));
        try {
            const data = await getAllProducts();
            dispatch(setAllProducts(data.products));
            return data;
        } catch (error) {
            const message = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || "Failed to get all products. Please try again.";
            dispatch(setError(message));
            dispatch(addToast({ message, type: "error" }));
            throw error;
        } finally {
            dispatch(setLoading(false));
        }
    }

    async function handleGetSellerProducts() {
        dispatch(setLoading(true));
        try {
            const data = await getSellerProducts();
            dispatch(setSellerProducts(data.products));
            return data;
        } catch (error) {
            const message = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || "Failed to get seller products. Please try again.";
            dispatch(setError(message));
            dispatch(addToast({ message, type: "error" }));
            throw error;
        } finally {
            dispatch(setLoading(false));
        }
    }

    return {
        handleCreateProduct,
        handleGetAllProducts,
        handleGetSellerProducts,
    };
};