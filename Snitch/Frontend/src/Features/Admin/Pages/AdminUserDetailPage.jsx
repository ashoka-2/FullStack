import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useNavigate, useLocation } from 'react-router';
import { useUsers } from '../../Users/Hooks/useUsers';
import { PrimaryBtn, SecondaryBtn } from '../../Components/Buttons';
import PageLoader from '../../Components/PageLoader';
import { AdminUserDetailSkeleton } from '../../Components/Skeletons';

// Role Badge
const RoleBadge = ({ role }) => {
    const map = {
        admin:  { cls: "bg-violet-500/10 text-violet-400 border-violet-500/20", icon: "ri-shield-star-line" },
        seller: { cls: "bg-accent/10 text-accent border-accent/20",             icon: "ri-store-2-line"    },
        buyer:  { cls: "bg-sky-500/10 text-sky-400 border-sky-500/20",          icon: "ri-user-line"       },
    };
    const { cls, icon } = map[role] || map.buyer;
    return (
        <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${cls}`}>
            <i className={icon} />{role}
        </span>
    );
};

// Product Mini-card
const ProductChip = ({ product }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const isSellerMode = location.pathname.startsWith('/seller');
    const img = product?.images?.[0]?.url;
    const price = product?.price?.saleAmount || product?.price?.amount;
    return (
        <div
            onClick={() => product?._id && navigate(isSellerMode ? `/products/${product._id}` : `/admin/products/${product._id}`)}
            className="flex items-center gap-3 p-3 rounded-2xl bg-background/50 border border-border-theme/30 hover:border-accent/30 transition-colors cursor-pointer hover:bg-surface/10 hover:shadow-sm"
        >
            <div className="w-11 h-11 rounded-xl overflow-hidden bg-surface flex-shrink-0">
                {img ? <img src={img} alt={product.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><i className="ri-image-line text-foreground/20" /></div>}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-black truncate">{product?.title}</p>
                <p className="text-[10px] text-foreground/40 font-bold">{product?.category?.name || product?.category}</p>
            </div>
            {price && (
                <span className="text-[10px] font-black text-accent flex-shrink-0">
                    ₹{price.toLocaleString("en-IN")}
                </span>
            )}
        </div>
    );
};

// Cart Item Row
const CartItem = ({ item }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const isSellerMode = location.pathname.startsWith('/seller');
    const img = item?.product?.images?.[0]?.url;
    return (
        <div
            onClick={() => item?.product?._id && navigate(isSellerMode ? `/products/${item.product._id}` : `/admin/products/${item.product._id}`)}
            className="flex items-center gap-3 p-3 rounded-2xl bg-background/50 border border-border-theme/30 hover:border-accent/30 transition-colors cursor-pointer hover:bg-surface/10 hover:shadow-sm"
        >
            <div className="w-11 h-11 rounded-xl overflow-hidden bg-surface flex-shrink-0">
                {img ? <img src={img} alt={item.product?.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><i className="ri-image-line text-foreground/20" /></div>}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-black truncate">{item.product?.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                    {item.size?.name && <span className="text-[9px] font-bold text-foreground/40 bg-foreground/5 px-1.5 py-0.5 rounded-md">{item.size.name}</span>}
                    {item.color?.name && (
                        <span className="flex items-center gap-1 text-[9px] font-bold text-foreground/40">
                            <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: item.color.hexCode }} />
                            {item.color.name}
                        </span>
                    )}
                </div>
            </div>
            <div className="text-right flex-shrink-0">
                <p className="text-[10px] font-black text-accent">×{item.quantity}</p>
            </div>
        </div>
    );
};

// Order Row
const statusMap = {
    pending:    { cls: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
    processing: { cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    shipped:    { cls: "bg-sky-500/10 text-sky-400 border-sky-500/20" },
    delivered:  { cls: "bg-green-500/10 text-green-400 border-green-500/20" },
    cancelled:  { cls: "bg-red-500/10 text-red-400 border-red-500/20" },
};

const OrderRow = ({ order }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const isSellerMode = location.pathname.startsWith('/seller');
    const { cls } = statusMap[order.status] || statusMap.pending;
    const date = new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    return (
        <div className="p-4 rounded-2xl bg-background/50 border border-border-theme/30 space-y-3 animate-in fade-in duration-200">
            {/* Header row */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[9px] font-black text-foreground/30 font-mono">{order._id?.slice(-8).toUpperCase()}</span>
                <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${cls}`}>{order.status}</span>
                    <span className="text-[9px] font-bold text-foreground/30">{date}</span>
                </div>
            </div>
            {/* Items */}
            <div className="space-y-1.5">
                {order.items?.map((item, idx) => (
                    <div
                        key={idx}
                        onClick={() => item.product?._id && navigate(isSellerMode ? `/products/${item.product._id}` : `/admin/products/${item.product._id}`)}
                        className="flex items-center gap-2 hover:bg-foreground/5 p-1 rounded-xl cursor-pointer transition-colors group"
                    >
                        <div className="w-7 h-7 rounded-lg overflow-hidden bg-surface flex-shrink-0">
                            {item.product?.images?.[0]?.url ? <img src={item.product.images[0].url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><i className="ri-image-line text-[8px] text-foreground/20" /></div>}
                        </div>
                        <p className="text-[10px] font-bold truncate flex-1 group-hover:text-accent transition-colors">{item.product?.title}</p>
                        <span className="text-[9px] text-foreground/40 flex-shrink-0">×{item.quantity}</span>
                    </div>
                ))}
            </div>
            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-border-theme/20">
                <span className="text-[9px] font-bold text-foreground/35">{order.shippingAddress?.city}, {order.shippingAddress?.state}</span>
                <span className="text-xs font-black text-accent">₹{order.totalAmount?.toLocaleString("en-IN")}</span>
            </div>
        </div>
    );
};

const EmptyTabState = ({ icon, label }) => (
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-foreground/25 border border-dashed border-border-theme/40 rounded-3xl bg-background/20 w-full">
        <i className={`${icon} text-3xl`} />
        <p className="text-xs font-black uppercase tracking-widest">{label}</p>
    </div>
);

const AdminUserDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const isSellerMode = location.pathname.startsWith('/seller');
    const { handleFetchUserDetail, clearSelectedUser, handleToggleBanUser } = useUsers();
    const { selectedUser: user, detailLoading } = useSelector(state => state.users);
    const [tab, setTab] = useState("wishlist");

    useEffect(() => {
        if (id) handleFetchUserDetail(id);
        return () => clearSelectedUser();
    }, [id]);

    if (detailLoading) return <PageLoader skeleton={AdminUserDetailSkeleton} />;

    if (!user) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-center">
                <i className="ri-user-unfollow-line text-6xl text-foreground/25" />
                <h2 className="text-2xl font-black">User Not Found</h2>
                <SecondaryBtn onClick={() => navigate(isSellerMode ? '/seller/users' : '/admin/users')}>Back to Users</SecondaryBtn>
            </div>
        );
    }

    const tabs = [
        { id: "wishlist", label: "Wishlist", icon: "ri-heart-line",    count: user.wishlist?.products?.length },
        { id: "cart",     label: "Cart",     icon: "ri-shopping-bag-line", count: user.cart?.items?.length },
        { id: "orders",   label: "Orders",   icon: "ri-receipt-line",   count: user.orders?.length },
        ...(user.role === "seller" ? [{ id: "products", label: "Products", icon: "ri-store-2-line", count: user.products?.length }] : []),
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header / Navigation */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(isSellerMode ? '/seller/users' : '/admin/users')}
                    className="w-10 h-10 rounded-xl border border-border-theme flex items-center justify-center hover:bg-white/5 hover:text-accent hover:border-accent/40 active:scale-95 transition-all cursor-pointer text-foreground/60"
                >
                    <i className="ri-arrow-left-line text-lg" />
                </button>
                <div>
                    <span className="text-[10px] font-black tracking-widest text-accent uppercase">{isSellerMode ? "Seller Partners" : "Users Registry"}</span>
                    <h1 className="text-3xl font-black tracking-tighter text-foreground mt-0.5">User Profile Details</h1>
                </div>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Side: General Profile Info */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="p-6 rounded-3xl bg-surface/30 border border-border-theme/60 backdrop-blur-md space-y-6">
                        {/* Avatar */}
                        <div className="flex flex-col items-center text-center space-y-3">
                            <div className="w-24 h-24 rounded-3xl overflow-hidden border border-border-theme/40 bg-background shadow-inner">
                                {user.profilePic ? (
                                    <img src={user.profilePic} alt={user.fullname} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-accent/5">
                                        <i className="ri-user-line text-4xl text-accent/50" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <h2 className="text-xl font-black tracking-tight">{user.fullname}</h2>
                                <p className="text-xs text-foreground/40 mt-0.5">{user.email}</p>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <RoleBadge role={user.role} />
                                {user.verified ? (
                                    <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-1 rounded-full">
                                        <i className="ri-checkbox-circle-fill" /> Verified
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-foreground/30 bg-foreground/5 border border-border-theme/35 px-2.5 py-1 rounded-full">
                                        Unverified
                                    </span>
                                )}
                            </div>
                        </div>

                        <hr className="border-border-theme/30" />

                        {/* Contact details */}
                        <div className="space-y-3">
                            <div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-foreground/35">Contact</span>
                                <p className="text-sm font-bold text-foreground/80 mt-0.5">{user.contact || 'No contact saved'}</p>
                            </div>
                            <div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-foreground/35">Status</span>
                                <p className={`text-sm font-black mt-0.5 ${user.isBanned ? 'text-red-500' : 'text-emerald-400'}`}>
                                    {user.isBanned ? 'Banned (Blocked Access)' : 'Active (Access Granted)'}
                                </p>
                            </div>
                        </div>

                        {/* Ban / Unban actions (only show in Admin mode) */}
                        {!isSellerMode && (
                            <div className="pt-2">
                                <button
                                    onClick={() => handleToggleBanUser(user._id)}
                                    className={`w-full py-3 rounded-2xl text-xs font-black tracking-widest uppercase transition-all duration-300 shadow-md cursor-pointer border ${
                                        user.isBanned
                                            ? 'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600'
                                            : 'bg-red-500/10 text-red-500 border-red-500/25 hover:bg-red-500 hover:text-white'
                                    }`}
                                >
                                    <i className={user.isBanned ? 'ri-user-shared-line mr-1.5' : 'ri-user-forbid-line mr-1.5'} />
                                    {user.isBanned ? 'Unban Account' : 'Ban Account'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Address details */}
                    <div className="p-6 rounded-3xl bg-surface/30 border border-border-theme/60 backdrop-blur-md space-y-4">
                        <div className="flex items-center gap-2">
                            <i className="ri-map-pin-2-line text-accent text-lg" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Address Location</span>
                        </div>
                        {user.addressDetails ? (
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-foreground/80">{user.addressDetails.place}</p>
                                <p className="text-xs text-foreground/50">{user.addressDetails.post}, {user.addressDetails.city}, {user.addressDetails.state} — {user.addressDetails.pincode}</p>
                            </div>
                        ) : (
                            <div className="py-4 text-center text-foreground/25 border border-dashed border-border-theme/40 rounded-2xl bg-background/10">
                                <span className="text-xs font-bold">No Address Registered</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Tabbed Cart/Wishlist/Orders info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Stat Pills */}
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: "Wishlist",  val: user.wishlist?.products?.length ?? 0, icon: "ri-heart-line"       },
                            { label: "Cart",      val: user.cart?.items?.length ?? 0,        icon: "ri-shopping-bag-line"},
                            { label: "Orders",    val: user.orders?.length ?? 0,             icon: "ri-receipt-line"     },
                        ].map(({ label, val, icon }) => (
                            <div key={label} className="flex flex-col items-center gap-1 p-4 rounded-2xl bg-surface/30 border border-border-theme/60 backdrop-blur-md animate-in fade-in duration-200">
                                <i className={`${icon} text-accent text-xl`} />
                                <span className="text-2xl font-black mt-1">{val}</span>
                                <span className="text-[9px] font-black uppercase tracking-wider text-foreground/35">{label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Tab Row */}
                    <div className="flex gap-1 bg-surface/50 p-1.5 rounded-2xl border border-border-theme/40 backdrop-blur-md flex-wrap">
                        {tabs.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                className={`flex items-center gap-1.5 px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest flex-1 justify-center transition-all cursor-pointer
                                    ${tab === t.id ? "bg-accent text-accent-content shadow-md font-black" : "text-foreground/40 hover:text-foreground/70"}`}
                            >
                                <i className={t.icon} />
                                {t.label}
                                {t.count > 0 && (
                                    <span className={`text-[8px] font-black rounded-full w-4 h-4 flex items-center justify-center ${tab === t.id ? "bg-white/20" : "bg-foreground/10"}`}>
                                        {t.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content Box */}
                    <div className="p-6 rounded-3xl bg-surface/30 border border-border-theme/60 backdrop-blur-md min-h-[300px]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {tab === "wishlist" && (
                                user.wishlist?.products?.length > 0
                                    ? user.wishlist.products.map(p => <ProductChip key={p._id} product={p} />)
                                    : <div className="col-span-2"><EmptyTabState icon="ri-heart-line" label="No wishlist items" /></div>
                            )}
                            {tab === "cart" && (
                                user.cart?.items?.length > 0
                                    ? user.cart.items.map((item, i) => <CartItem key={i} item={item} />)
                                    : <div className="col-span-2"><EmptyTabState icon="ri-shopping-bag-line" label="Cart is empty" /></div>
                            )}
                            {tab === "orders" && (
                                user.orders?.length > 0
                                    ? user.orders.map(o => <OrderRow key={o._id} order={o} />)
                                    : <div className="col-span-2"><EmptyTabState icon="ri-receipt-line" label="No orders placed" /></div>
                            )}
                            {tab === "products" && (
                                user.products?.length > 0
                                    ? user.products.map(p => <ProductChip key={p._id} product={p} />)
                                    : <div className="col-span-2"><EmptyTabState icon="ri-store-2-line" label="No products listed" /></div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminUserDetailPage;
