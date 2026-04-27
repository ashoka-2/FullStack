import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useAuth } from '../Hooks/useAuth';
import { useProduct } from '../../Poducts/Hooks/useProduct';
import { useNavigate } from 'react-router';
import Modal from '../../Components/Modal';
import SellerProductCard from '../../Poducts/Components/SellerProductCard';
import { ProfileSkeleton } from '../../Components/Skeletons';
import PageLoader from '../../Components/PageLoader';
import { PrimaryBtn, SecondaryBtn, TertiaryBtn } from '../../Components/Buttons';

const Profile = () => {
    const { user, loading: authLoading } = useSelector((state) => state.auth);
    const { sellerProducts, sellerLoading: productsLoading } = useSelector((state) => state.product);
    const { handleUpdateProfile } = useAuth();
    const { handleGetSellerProducts, handlePublish } = useProduct();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        fullname: '',
        email: '',
        contact: ''
    });
    const [profilePic, setProfilePic] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ open: false, productId: null });

    const { handleDeleteProduct } = useProduct();

    useEffect(() => {
        if (user) {
            // Strip +91 if it exists for the local 10-digit input
            const displayContact = user.contact?.startsWith('+91') 
                ? user.contact.slice(3) 
                : user.contact || '';
                
            setFormData({
                fullname: user.fullname || '',
                email: user.email || '',
                contact: displayContact
            });
            setPreviewUrl(user.profilePic || '');

            // Fetch seller products if applicable
            if (user.role === 'seller') {
                handleGetSellerProducts();
            }
        } else if (!authLoading) {
            navigate('/login');
        }
    }, [user, authLoading, navigate]);

    // Deletion Flow
    const confirmDelete = (id) => setDeleteModal({ open: true, productId: id });
    const runDelete = async () => {
        if (deleteModal.productId) {
            await handleDeleteProduct(deleteModal.productId);
            setDeleteModal({ open: false, productId: null });
        }
    };

    const handleEdit = (product) => {
        navigate(`/products/edit/${product._id}`);
    };

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'profilePic') {
            const file = files[0];
            setProfilePic(file);
            setPreviewUrl(URL.createObjectURL(file));
        } else if (name === 'contact') {
            // Only allow digits and max 10 characters
            const cleaned = value.replace(/\D/g, '').slice(0, 10);
            setFormData(prev => ({
                ...prev,
                [name]: cleaned
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = new FormData();
            data.append('fullname', formData.fullname);
            // Prepend +91 before sending to backend
            data.append('contact', `+91${formData.contact}`);
            if (profilePic) {
                data.append('profilePic', profilePic);
            }
            await handleUpdateProfile(data);
        } catch (error) {
            console.error("Update failed", error);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-background pt-24 px-4">
                <PageLoader skeleton={ProfileSkeleton} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-accent selection:text-accent-content pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            {/* Modal for Deleting Products */}
            <Modal 
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, productId: null })}
                onConfirm={runDelete}
                title="Remove Product?"
                description="This action is permanent. This product will be removed from your catalog and any active customers will no longer see it."
                confirmText="Delete Permanently"
                type="danger"
            />

            <div className="max-w-4xl mx-auto">
                <div className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-foreground mb-4">Your Identity</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-lg">Manage your personal aesthetic and account details.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Left Side: Profile Preview */}
                    <div className="lg:col-span-1">
                        <div className="bg-surface border border-border-theme rounded-3xl p-8 sticky top-32 shadow-2xl overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent"></div>
                            
                            <div className="relative z-10 flex flex-col items-center text-center">
                                <div className="relative mb-6">
                                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-accent/20 group-hover:border-accent transition-colors duration-500 shadow-xl">
                                        <img 
                                            src={previewUrl || "https://i.pravatar.cc/300"} 
                                            alt="Profile" 
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                    </div>
                                    <label htmlFor="profilePicInput" className="absolute -bottom-2 -right-2 bg-accent text-accent-content p-2 rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform">
                                        <i className="ri-camera-3-line text-lg"></i>
                                        <input 
                                            type="file" 
                                            id="profilePicInput" 
                                            name="profilePic" 
                                            onChange={handleChange} 
                                            className="hidden" 
                                            accept="image/*"
                                        />
                                    </label>
                                </div>
                                
                                <h2 className="text-2xl font-bold tracking-tight mb-1">{formData.fullname || "User Name"}</h2>
                                <p className="text-sm text-gray-500 mb-6 uppercase tracking-widest font-semibold">{user?.role || "Member"}</p>
                                
                                <div className="w-full pt-6 border-t border-border-theme flex flex-col gap-4">
                                    <div className="flex items-center gap-3 text-sm text-gray-500">
                                        <i className="ri-mail-line text-accent"></i>
                                        <span className="truncate">{formData.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-500">
                                        <i className="ri-phone-line text-accent"></i>
                                        <span>{formData.contact}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Edit Form */}
                    <div className="lg:col-span-2">
                        <form onSubmit={handleSubmit} className="bg-surface/50 backdrop-blur-sm border border-border-theme rounded-3xl p-8 md:p-12 shadow-xl">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Full Name */}
                                <div className="flex flex-col md:col-span-2">
                                    <label className="text-sm text-gray-400 mb-2 font-medium ml-1">Full Name</label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            name="fullname"
                                            value={formData.fullname}
                                            onChange={handleChange}
                                            required
                                            disabled={authLoading}
                                            className="w-full bg-background border border-border-theme focus:border-accent rounded-xl px-4 py-3 outline-none transition-all focus:ring-4 focus:ring-accent/10 disabled:opacity-50"
                                            placeholder="Enter your full name"
                                        />
                                        <i className="ri-user-smile-line absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-accent transition-colors"></i>
                                    </div>
                                </div>

                                {/* Email (Read-only) */}
                                <div className="flex flex-col md:col-span-2">
                                    <label className="text-sm text-gray-400 mb-2 font-medium ml-1 flex items-center gap-2">
                                        Email Address
                                        <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full uppercase tracking-tighter">Verified</span>
                                    </label>
                                    <div className="relative group">
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            readOnly
                                            className="w-full bg-surface/50 border border-border-theme cursor-not-allowed rounded-xl px-4 py-3 outline-none opacity-70"
                                        />
                                        <i className="ri-lock-line absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                                    </div>
                                    <p className="mt-2 text-xs text-gray-500 ml-1 italic">Email address cannot be changed for security reasons.</p>
                                </div>

                                {/* Contact */}
                                <div className="flex flex-col">
                                    <label className="text-sm text-gray-400 mb-2 font-medium ml-1">Contact Number</label>
                                    <div className="relative group flex">
                                        <div className="flex items-center gap-2 px-3 bg-surface/50 border border-border-theme border-r-0 rounded-l-xl text-gray-400">
                                            <span className="text-xl">🇮🇳</span>
                                            <span className="text-sm font-bold">+91</span>
                                        </div>
                                        <input
                                            type="tel"
                                            name="contact"
                                            value={formData.contact}
                                            onChange={handleChange}
                                            required
                                            disabled={authLoading}
                                            className="w-full bg-background border border-border-theme focus:border-accent rounded-r-xl px-4 py-3 outline-none transition-all focus:ring-4 focus:ring-accent/10 disabled:opacity-50"
                                            placeholder="98765 43210"
                                        />
                                    </div>
                                    <p className="mt-2 text-[10px] text-gray-500 ml-1 uppercase tracking-widest font-bold">10 Digits Required</p>
                                </div>

                                </div>

                            <div className="mt-12 flex justify-end gap-3">
                                {user?.role === 'admin' && (
                                    <SecondaryBtn
                                        type="button"
                                        onClick={() => navigate('/admin')}
                                        icon="ri-dashboard-fill"
                                        size="lg"
                                    >
                                        Admin Dashboard
                                    </SecondaryBtn>
                                )}
                                <PrimaryBtn
                                    type="submit"
                                    loading={authLoading}
                                    icon="ri-save-3-line"
                                    size="lg"
                                >
                                    {authLoading ? 'Updating Identity...' : 'Save Changes'}
                                </PrimaryBtn>
                            </div>
                        </form>

                        {/* Become a Seller Section */}
                        {user?.role === 'buyer' && (
                            <div className="mt-12 bg-gradient-to-br from-accent/10 to-transparent border border-accent/20 rounded-3xl p-8 md:p-12 overflow-hidden relative group">
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <i className="ri-store-2-line text-8xl text-accent"></i>
                                </div>
                                
                                <div className="relative z-10">
                                    <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                        <i className="ri-medal-line text-accent"></i>
                                        Join our Seller Program
                                    </h3>
                                    <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-lg">
                                        Take your brand to the next level. Start listing products, managing orders, and reaching thousands of style-conscious shoppers.
                                    </p>
                                    
                                    <TertiaryBtn
                                        onClick={() => setIsRoleModalOpen(true)}
                                        disabled={authLoading}
                                        trailingIcon="ri-arrow-right-line"
                                        size="md"
                                    >
                                        Upgrade to Seller Account
                                    </TertiaryBtn>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Seller Products Section — wider than max-w-4xl */}
            {user?.role === 'seller' && (
                <div className="max-w-7xl mx-auto mt-20 border-t border-border-theme pt-16 px-0">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                        <div>
                            <span className="text-[10px] font-black tracking-[0.4em] uppercase text-accent mb-1 block">Your Store</span>
                            <h3 className="text-3xl font-black tracking-tighter mb-2">My Products</h3>
                            <p className="text-gray-500 text-sm italic font-serif">Manage and curate your listed products.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <PrimaryBtn
                                icon="ri-add-line"
                                onClick={() => navigate('/products/create')}
                                size="md"
                            >
                                New Product
                            </PrimaryBtn>
                        </div>
                    </div>

                    {user?.role === 'admin' && (
                        <div className="mb-10 p-6 rounded-3xl bg-accent/5 border border-accent/10 flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-700">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent shadow-inner">
                                    <i className="ri-shield-flash-line text-2xl" />
                                </div>
                                <div>
                                    <p className="text-xs font-black tracking-[0.3em] text-accent uppercase">System Authority</p>
                                    <p className="text-lg font-bold text-foreground">You are currently in Admin Mode</p>
                                </div>
                            </div>
                            <SecondaryBtn onClick={() => navigate('/admin')} size="md" icon="ri-settings-4-line">Access Dashboard</SecondaryBtn>
                        </div>
                    )}

                    {productsLoading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="bg-surface/50 border border-border-theme/50 rounded-3xl aspect-[4/5] overflow-hidden animate-pulse">
                                    <div className="w-full h-2/3 bg-foreground/5" />
                                    <div className="p-4 space-y-3">
                                        <div className="h-3 bg-foreground/10 rounded-full w-3/4" />
                                        <div className="h-2 bg-foreground/5 rounded-full w-1/2" />
                                        <div className="flex justify-between pt-2">
                                            <div className="h-6 w-12 bg-foreground/10 rounded-lg" />
                                            <div className="h-6 w-6 bg-foreground/10 rounded-full" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : sellerProducts?.length > 0 ? (
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
                        <div className="bg-surface border-2 border-dashed border-border-theme rounded-3xl p-16 text-center flex flex-col items-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                                <i className="ri-archive-line text-4xl"></i>
                            </div>
                            <div>
                                <h4 className="text-xl font-bold mb-1">No products listed yet</h4>
                                <p className="text-gray-500 text-sm">Start your selling journey by adding your first masterpiece.</p>
                            </div>
                            <PrimaryBtn
                                icon="ri-rocket-line"
                                onClick={() => navigate('/products/create')}
                                size="md"
                                className="mt-2"
                            >
                                List First Product
                              </PrimaryBtn>
                        </div>
                    )}
                </div>
            )}

            <Modal 
                isOpen={isRoleModalOpen}
                onClose={() => setIsRoleModalOpen(false)}
                onConfirm={async () => {
                    await handleUpdateProfile({ role: 'seller' });
                }}
                title="Elevate to Seller?"
                description="This will allow you to list products and manage your brand. This transformation is permanent and cannot be reversed."
                confirmText="Become a Seller"
                type="info"
            />
        </div>
    );
};

export default Profile;
