import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useSeller } from '../Hooks/useSeller';
import { useUsers } from '../../Users/Hooks/useUsers';
import { useProduct } from '../../Poducts/Hooks/useProduct';
import { useNavigate } from 'react-router';
import Modal from '../../Components/Modal';
import UserDetailPanel from '../../Users/Pages/UserDetailPanel';
import SellerProductCard from '../../Poducts/Components/SellerProductCard';
import PageLoader from '../../Components/PageLoader';
import { SellerDashboardSkeleton } from '../../Components/Skeletons';
import { PrimaryBtn, SecondaryBtn, TertiaryBtn } from '../../Components/Buttons';

const SellerDashboard = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const { allCarts, allWishlists, allOrders, users, loading: sellerLoading } = useSelector((state) => state.seller);
    const { sellerProducts, sellerLoading: productsLoading } = useSelector((state) => state.product);
    const { allUsers: allUsersFromStore } = useSelector((state) => state.users);
    
    const { fetchDashboardData, handleUpdateOrderStatus } = useSeller();
    const { handleGetSellerProducts, handlePublish, handleDeleteProduct } = useProduct();
    const { handleFetchAllUsers } = useUsers();

    const [activeTab, setActiveTab] = useState('catalog');
    const [selectedUserId, setSelectedUserId] = useState(null); // for UserDetailPanel
    const [deleteModal, setDeleteModal] = useState({ open: false, productId: null });
    const [customerSearch, setCustomerSearch] = useState('');

    useEffect(() => {
        if (user?.role !== 'seller' && user?.role !== 'admin') {
            navigate('/');
            return;
        }
        
        fetchDashboardData();
        handleGetSellerProducts();
        handleFetchAllUsers();
    }, [user, navigate]);

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

    const formatPrice = (amount, currencyCode = 'INR') => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: currencyCode,
            maximumFractionDigits: 0
        }).format(amount);
    };

    // ── Derive the seller's own product IDs ──────────────────────────────────
    const myProductIds = useMemo(
        () => new Set(sellerProducts?.map(p => p._id?.toString()) || []),
        [sellerProducts]
    );

    // ── Filter customers: users who have ≥1 of seller's products in cart or wishlist
    const customers = useMemo(() => {
        const cartUserIds = new Set(
            allCarts
                .filter(c => c.items?.some(i => myProductIds.has(i.product?._id?.toString())))
                .map(c => c.user?._id?.toString())
        );
        const wishUserIds = new Set(
            allWishlists
                .filter(w => w.products?.some(p => myProductIds.has(p._id?.toString())))
                .map(w => w.user?._id?.toString())
        );
        const relevantIds = new Set([...cartUserIds, ...wishUserIds]);
        return (allUsersFromStore || users || []).filter(u => relevantIds.has(u._id?.toString()));
    }, [allCarts, allWishlists, myProductIds, allUsersFromStore, users]);

    const tabs = [
        { id: 'catalog',   label: 'Catalog',    icon: 'ri-archive-line'       },
        { id: 'customers', label: 'Customers',   icon: 'ri-user-heart-line',   count: customers.length },
        { id: 'carts',     label: 'User Carts',  icon: 'ri-shopping-cart-line' },
        { id: 'wishlists', label: 'Wishlists',   icon: 'ri-heart-line'         },
        { id: 'orders',    label: 'Orders',      icon: 'ri-bill-line'          },
        { id: 'users',     label: 'Directory',   icon: 'ri-team-line'          },
    ];

    if (sellerLoading || productsLoading) {
        return <PageLoader skeleton={SellerDashboardSkeleton} />;
    }

    return (
        <div className="min-h-screen bg-background text-foreground pt-24 pb-20 px-4 md:px-10">
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

            {/* UserDetailPanel — shared by Customers tab, Directory tab */}
            {selectedUserId && (
                <UserDetailPanel userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
            )}

            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <span className="text-[10px] font-black tracking-widest text-accent uppercase">Management Station</span>
                        <h1 className="text-5xl font-black tracking-tighter text-foreground mt-1">Seller Dashboard</h1>
                        <p className="text-foreground/40 mt-2">Oversee inventory metrics, review wishlists, fulfill active orders, and connect with clients.</p>
                    </div>
                    {activeTab === 'catalog' && (
                        <PrimaryBtn icon="ri-add-line" onClick={() => navigate('/products/create')}>List New Product</PrimaryBtn>
                    )}
                </header>

                {/* Tab Selectors */}
                <div className="flex flex-wrap gap-2 mb-10 bg-surface/50 p-1.5 rounded-2xl border border-border-theme backdrop-blur-md">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={[
                                'flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black tracking-widest uppercase transition-all',
                                activeTab === tab.id ? 'bg-accent text-accent-content shadow-lg shadow-accent/20' : 'text-foreground/30 hover:text-foreground/60 hover:bg-white/5'
                            ].join(' ')}
                        >
                            <i className={tab.icon} />
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`text-[9px] font-black rounded-full w-5 h-5 flex items-center justify-center ${
                                    activeTab === tab.id ? 'bg-white/20' : 'bg-foreground/10'
                                }`}>{tab.count}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Workspace */}
                <div className="w-full">
                    {/* 1. CATALOG TAB */}
                    {activeTab === 'catalog' && (
                        <div>
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
                                <div className="bg-surface border-2 border-dashed border-border-theme rounded-3xl p-16 text-center flex flex-col items-center gap-4">
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
                    )}

                    {/* 2. USER CARTS TAB */}
                    {activeTab === 'carts' && (
                        <div className="space-y-6">
                            {allCarts?.length > 0 ? (
                                allCarts.map((cart) => (
                                    <div key={cart._id} className="bg-surface border border-border-theme rounded-3xl p-6 md:p-8 shadow-sm">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border-theme/40 pb-6 mb-6">
                                            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedUserId(cart.user?._id || cart.user)}>
                                                <div className="w-12 h-12 rounded-full overflow-hidden border border-border-theme">
                                                    <img src={cart.user?.profilePic} alt={cart.user?.fullname} className="w-full h-full object-cover" />
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-lg text-foreground hover:text-accent transition-colors">{cart.user?.fullname}</h3>
                                                    <p className="text-xs text-foreground/40">{cart.user?.email} • {cart.user?.contact}</p>
                                                </div>
                                            </div>
                                            <div className="px-4 py-2 bg-accent/10 border border-accent/20 rounded-xl">
                                                <span className="text-xs font-black text-accent uppercase tracking-widest">
                                                    {cart.items?.length} items in cart
                                                </span>
                                            </div>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="border-b border-border-theme/30 text-[10px] uppercase tracking-widest text-foreground/45">
                                                        <th className="pb-3">Product Info</th>
                                                        <th className="pb-3">Variant Info</th>
                                                        <th className="pb-3 text-center">Qty</th>
                                                        <th className="pb-3 text-right">Price</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border-theme/10">
                                                    {cart.items?.map((item, idx) => (
                                                        <tr key={item._id || idx} className="text-sm font-bold">
                                                            <td className="py-4">
                                                                <div 
                                                                    className="flex items-center gap-3 cursor-pointer hover:text-accent transition-colors"
                                                                    onClick={() => item.product?._id && navigate(`/products/${item.product._id}`)}
                                                                >
                                                                    <div className="w-10 h-12 rounded-lg overflow-hidden bg-background flex-shrink-0">
                                                                        <img src={item.product?.images?.[0]?.url} alt={item.product?.title} className="w-full h-full object-cover" />
                                                                    </div>
                                                                    <span className="truncate max-w-[200px]">{item.product?.title}</span>
                                                                </div>
                                                            </td>
                                                            <td className="py-4 text-xs font-medium text-foreground/60">
                                                                <div className="flex flex-col gap-0.5">
                                                                    <span>Size: {item.size?.name || 'Standard'}</span>
                                                                    <span>Color: {item.color?.name || 'Standard'}</span>
                                                                </div>
                                                            </td>
                                                            <td className="py-4 text-center">{item.quantity}</td>
                                                            <td className="py-4 text-right text-accent font-black">
                                                                {formatPrice((item.product?.price?.saleAmount || item.product?.price?.amount) * item.quantity)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="bg-surface border border-border-theme rounded-3xl p-16 text-center text-foreground/40 font-medium">
                                    <i className="ri-shopping-cart-2-line text-4xl text-accent/20 mb-3 block" />
                                    No active shopping carts found.
                                </div>
                            )}
                        </div>
                    )}

                    {/* 3. USER WISHLISTS TAB */}
                    {activeTab === 'wishlists' && (
                        <div className="space-y-6">
                            {allWishlists?.length > 0 ? (
                                allWishlists.map((wishlist) => (
                                    <div key={wishlist._id} className="bg-surface border border-border-theme rounded-3xl p-6 md:p-8 shadow-sm">
                                        <div className="flex items-center gap-3 cursor-pointer border-b border-border-theme/40 pb-6 mb-6" onClick={() => setSelectedUserId(wishlist.user?._id || wishlist.user)}>
                                            <div className="w-12 h-12 rounded-full overflow-hidden border border-border-theme">
                                                <img src={wishlist.user?.profilePic} alt={wishlist.user?.fullname} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-lg text-foreground hover:text-accent transition-colors">{wishlist.user?.fullname}</h3>
                                                <p className="text-xs text-foreground/40">{wishlist.user?.email} • {wishlist.user?.contact}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                            {wishlist.products?.map((prod, idx) => (
                                                <div 
                                                    key={prod._id || idx} 
                                                    onClick={() => prod._id && navigate(`/products/${prod._id}`)}
                                                    className="bg-background border border-border-theme/60 rounded-2xl p-3 flex flex-col justify-between cursor-pointer hover:border-accent/40 hover:scale-[1.02] transition-all"
                                                >
                                                    <div className="aspect-[4/5] rounded-xl overflow-hidden mb-3 bg-surface">
                                                        <img src={prod.images?.[0]?.url} alt={prod.title} className="w-full h-full object-cover" />
                                                    </div>
                                                    <h4 className="font-bold text-xs truncate uppercase leading-none">{prod.title}</h4>
                                                    <span className="text-[10px] font-black text-accent mt-2">
                                                        {formatPrice(prod.price?.saleAmount || prod.price?.amount)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="bg-surface border border-border-theme rounded-3xl p-16 text-center text-foreground/40 font-medium">
                                    <i className="ri-heart-line text-4xl text-accent/20 mb-3 block" />
                                    No user wishlist records found.
                                </div>
                            )}
                        </div>
                    )}

                    {/* 4. ORDERS TAB */}
                    {activeTab === 'orders' && (
                        <div className="space-y-6">
                            {allOrders?.length > 0 ? (
                                allOrders.map((order) => (
                                    <div key={order._id} className="bg-surface border border-border-theme rounded-3xl p-6 md:p-8 shadow-sm">
                                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-border-theme/40 pb-6 mb-6">
                                            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedUserId(order.buyer?._id || order.buyer)}>
                                                <div className="w-12 h-12 rounded-full overflow-hidden border border-border-theme">
                                                    <img src={order.buyer?.profilePic} alt={order.buyer?.fullname} className="w-full h-full object-cover" />
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-lg text-foreground hover:text-accent transition-colors">{order.buyer?.fullname}</h3>
                                                    <p className="text-xs text-foreground/40">ID: {order._id.slice(-8)} • {new Date(order.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                                                <div className="text-left md:text-right flex-1 lg:flex-none">
                                                    <p className="text-[8px] font-black tracking-widest text-foreground/45 uppercase">Order Bill</p>
                                                    <p className="text-lg font-black text-accent">{formatPrice(order.totalAmount)}</p>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {/* Custom status selector */}
                                                    <select
                                                        value={order.status}
                                                        onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                                                        className={[
                                                            'px-4 py-2.5 rounded-xl border text-xs font-black tracking-widest uppercase outline-none cursor-pointer',
                                                            order.status === 'delivered' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                                                            order.status === 'cancelled' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                                                            order.status === 'shipped' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' :
                                                            'bg-amber-500/10 border-amber-500/20 text-amber-500'
                                                        ].join(' ')}
                                                    >
                                                        <option value="pending">Pending</option>
                                                        <option value="processing">Processing</option>
                                                        <option value="shipped">Shipped</option>
                                                        <option value="delivered">Delivered</option>
                                                        <option value="cancelled">Cancelled</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                            {/* Products ordered */}
                                            <div className="md:col-span-2 overflow-x-auto">
                                                <table className="w-full text-left">
                                                    <thead>
                                                        <tr className="border-b border-border-theme/30 text-[9px] uppercase tracking-widest text-foreground/45">
                                                            <th className="pb-3">Product Name</th>
                                                            <th className="pb-3">Specs</th>
                                                            <th className="pb-3 text-center">Qty</th>
                                                            <th className="pb-3 text-right">Price</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-border-theme/10">
                                                        {order.items?.map((item, idx) => (
                                                            <tr key={item._id || idx} className="text-xs font-bold">
                                                                <td className="py-3">
                                                                    <div 
                                                                        className="flex items-center gap-3 cursor-pointer hover:text-accent transition-colors"
                                                                        onClick={() => item.product?._id && navigate(`/products/${item.product._id}`)}
                                                                    >
                                                                        <div className="w-8 h-10 rounded overflow-hidden bg-background">
                                                                            <img src={item.product?.images?.[0]?.url} alt={item.product?.title} className="w-full h-full object-cover" />
                                                                        </div>
                                                                        <span className="truncate max-w-[150px]">{item.product?.title || 'Removed item'}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="py-3 text-[10px] text-foreground/60 font-medium">
                                                                    Size: {item.size?.name || 'STD'} <br />
                                                                    Col: {item.color?.name || 'STD'}
                                                                </td>
                                                                <td className="py-3 text-center">{item.quantity}</td>
                                                                <td className="py-3 text-right text-accent font-black">
                                                                    {formatPrice(item.price * item.quantity)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Address & contact information */}
                                            <div className="bg-background/50 border border-border-theme/60 rounded-2xl p-5 text-sm space-y-4">
                                                <h4 className="text-[10px] font-black tracking-widest uppercase text-foreground/45">Delivery Address</h4>
                                                <div>
                                                    <p className="font-bold text-foreground/80">{order.shippingAddress.place}</p>
                                                    <p className="font-bold text-foreground/80">{order.shippingAddress.post}, {order.shippingAddress.city}</p>
                                                    <p className="font-bold text-foreground/80">{order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
                                                </div>
                                                <div className="pt-2 border-t border-border-theme/30 flex items-center gap-2 text-foreground/60 font-medium">
                                                    <i className="ri-phone-line text-accent" />
                                                    <span>{order.contactNumber}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="bg-surface border border-border-theme rounded-3xl p-16 text-center text-foreground/40 font-medium">
                                    <i className="ri-bill-line text-4xl text-accent/20 mb-3 block" />
                                    No purchase orders placed yet.
                                </div>
                            )}
                        </div>
                    )}

                    {/* CUSTOMERS TAB — users with seller's products in cart/wishlist */}
                    {activeTab === 'customers' && (
                        <div className="space-y-4">
                            {/* Explanation pill */}
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-accent/5 border border-accent/15 rounded-2xl">
                                <i className="ri-information-line text-accent" />
                                <p className="text-[10px] font-bold text-foreground/50">
                                    Showing <span className="text-accent font-black">{customers.length}</span> user{customers.length !== 1 ? 's' : ''} who have your products in their cart or wishlist.
                                </p>
                            </div>

                            {/* Search */}
                            <div className="relative">
                                <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-foreground/30" />
                                <input
                                    value={customerSearch}
                                    onChange={e => setCustomerSearch(e.target.value)}
                                    placeholder="Search customers by name or email…"
                                    className="w-full pl-10 pr-4 py-3 bg-surface/50 border border-border-theme/50 rounded-2xl text-sm outline-none focus:border-accent/50 transition-colors placeholder:text-foreground/25 font-medium"
                                />
                            </div>

                            {customers.length === 0 ? (
                                <div className="bg-surface border border-border-theme rounded-3xl p-16 text-center">
                                    <i className="ri-user-heart-line text-4xl text-accent/20 mb-3 block" />
                                    <p className="text-foreground/40 font-medium">No customers have your products in their cart or wishlist yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {customers
                                        .filter(u => {
                                            if (!customerSearch) return true;
                                            const q = customerSearch.toLowerCase();
                                            return u.fullname?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
                                        })
                                        .map(u => {
                                            // count how many of this user's cart items are seller's products
                                            const cartEntry = allCarts.find(c => c.user?._id?.toString() === u._id?.toString());
                                            const wishEntry = allWishlists.find(w => w.user?._id?.toString() === u._id?.toString());
                                            const inCart = cartEntry?.items?.filter(i => myProductIds.has(i.product?._id?.toString())).length || 0;
                                            const inWish = wishEntry?.products?.filter(p => myProductIds.has(p._id?.toString())).length || 0;
                                            const roleColors = { admin: 'text-violet-400', seller: 'text-accent', buyer: 'text-sky-400' };
                                            const roleIcons  = { admin: 'ri-shield-star-line', seller: 'ri-store-2-line', buyer: 'ri-user-line' };
                                            return (
                                                <div
                                                    key={u._id}
                                                    onClick={() => setSelectedUserId(u._id)}
                                                    className="flex items-center gap-4 p-4 bg-surface/40 hover:bg-surface border border-border-theme/40 hover:border-accent/30 rounded-2xl cursor-pointer transition-all group"
                                                >
                                                    <div className="w-11 h-11 rounded-xl overflow-hidden bg-background flex-shrink-0 border border-border-theme/40">
                                                        {u.profilePic
                                                            ? <img src={u.profilePic} alt={u.fullname} className="w-full h-full object-cover" />
                                                            : <div className="w-full h-full flex items-center justify-center"><i className="ri-user-3-line text-foreground/30" /></div>}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-black text-sm truncate">{u.fullname}</p>
                                                        <p className="text-[10px] text-foreground/40 truncate">{u.email}</p>
                                                    </div>
                                                    {/* Cart/Wish counts */}
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        {inCart > 0 && (
                                                            <span className="flex items-center gap-1 text-[9px] font-black text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full">
                                                                <i className="ri-shopping-bag-line" />{inCart} in cart
                                                            </span>
                                                        )}
                                                        {inWish > 0 && (
                                                            <span className="flex items-center gap-1 text-[9px] font-black text-pink-400 bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded-full">
                                                                <i className="ri-heart-line" />{inWish} wishlisted
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className={`flex items-center gap-1 text-[9px] font-black uppercase flex-shrink-0 ${roleColors[u.role]}`}>
                                                        <i className={roleIcons[u.role]} />{u.role}
                                                    </div>
                                                    <i className="ri-arrow-right-s-line text-foreground/20 group-hover:text-accent transition-colors" />
                                                </div>
                                            );
                                        })
                                    }
                                </div>
                            )}
                        </div>
                    )}

                    {/* 5. USER DIRECTORY TAB */}
                    {activeTab === 'users' && (
                        <div className="bg-surface border border-border-theme rounded-3xl overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-background/50 border-b border-border-theme text-[10px] uppercase tracking-widest text-foreground/45">
                                            <th className="p-6">Client Info</th>
                                            <th className="p-6">Location</th>
                                            <th className="p-6">Identity Role</th>
                                            <th className="p-6 text-right">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border-theme/40">
                                        {(allUsersFromStore || users || [])?.map((usr) => (
                                            <tr key={usr._id} className="hover:bg-white/[0.01] transition-colors text-sm font-bold">
                                                <td className="p-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full overflow-hidden border border-border-theme/50 flex-shrink-0">
                                                            {usr.profilePic
                                                                ? <img src={usr.profilePic} alt={usr.fullname} className="w-full h-full object-cover" />
                                                                : <div className="w-full h-full flex items-center justify-center bg-background"><i className="ri-user-3-line text-foreground/30" /></div>}
                                                        </div>
                                                        <div>
                                                            <h4 className="text-foreground">{usr.fullname}</h4>
                                                            <p className="text-xs text-foreground/45 font-medium">{usr.email} • {usr.contact}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-6 text-xs text-foreground/60 max-w-[200px] truncate">
                                                    {usr.place || <span className="italic text-foreground/30">No address listing</span>}
                                                </td>
                                                <td className="p-6">
                                                    <span className={[
                                                        'text-[8px] font-black tracking-widest uppercase px-2.5 py-1 rounded-md border',
                                                        usr.role === 'admin' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                                                        usr.role === 'seller' ? 'bg-accent/10 border-accent/20 text-accent' :
                                                        'bg-gray-500/10 border-gray-500/20 text-foreground/60'
                                                    ].join(' ')}>
                                                        {usr.role}
                                                    </span>
                                                </td>
                                                <td className="p-6 text-right">
                                                    <button
                                                        onClick={() => setSelectedUserId(usr._id)}
                                                        className="px-3 py-1.5 bg-foreground/5 hover:bg-accent hover:text-accent-content rounded-lg text-xs transition-colors font-black uppercase tracking-wider"
                                                    >
                                                        View Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SellerDashboard;
