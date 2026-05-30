import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { useProduct } from '../../Poducts/Hooks/useProduct';
import SellerProductCard from '../../Poducts/Components/SellerProductCard';
import Modal from '../../Components/Modal';
import PageLoader from '../../Components/PageLoader';
import { SellerCatalogSkeleton } from '../../Components/Skeletons';
import { PrimaryBtn } from '../../Components/Buttons';

const SellerCatalogPage = () => {
    const navigate = useNavigate();
    const { sellerProducts, sellerLoading } = useSelector((state) => state.product);
    const { handleGetSellerProducts, handlePublish, handleDeleteProduct } = useProduct();
    const [deleteModal, setDeleteModal] = useState({ open: false, productId: null });

    useEffect(() => {
        handleGetSellerProducts();
    }, []);

    const handleEdit = (product) => {
        navigate(`/products/edit/${product._id}`);
    };

    const confirmDelete = (id) => setDeleteModal({ open: true, productId: id });
    
    const runDelete = async () => {
        if (deleteModal.productId) {
            await handleDeleteProduct(deleteModal.productId);
            setDeleteModal({ open: false, productId: null });
        }
    };

    if (sellerLoading) {
        return <PageLoader skeleton={SellerCatalogSkeleton} />;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Delete Modal */}
            <Modal 
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, productId: null })}
                onConfirm={runDelete}
                title="Remove Product?"
                description="This action is permanent. This product will be removed from your catalog and active clients will no longer see it."
                confirmText="Delete Permanently"
                type="danger"
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <span className="text-[10px] font-black tracking-widest text-accent uppercase font-mono">Catalog Registry</span>
                    <h1 className="text-3xl font-black tracking-tighter text-foreground mt-0.5">My Products</h1>
                </div>
                <PrimaryBtn icon="ri-add-line" onClick={() => navigate('/products/create')}>List New Product</PrimaryBtn>
            </div>

            {sellerProducts?.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                    {sellerProducts.map((product) => (
                        <SellerProductCard
                            key={product._id}
                            product={product}
                            onEdit={handleEdit}
                            onDelete={confirmDelete}
                            onPublish={handlePublish}
                        />
                    ))}
                </div>
            ) : (
                <div className="bg-surface border-2 border-dashed border-border-theme/40 rounded-3xl p-16 text-center flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                        <i className="ri-archive-line text-4xl"></i>
                    </div>
                    <div>
                        <h4 className="text-xl font-bold mb-1">No products listed yet</h4>
                        <p className="text-gray-500 text-sm">Start your selling journey by adding your first masterpiece.</p>
                    </div>
                    <PrimaryBtn icon="ri-rocket-line" onClick={() => navigate('/products/create')} className="mt-2">List First Product</PrimaryBtn>
                </div>
            )}
        </div>
    );
};

export default SellerCatalogPage;
