import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useUsers } from "../Hooks/useUsers";

// ─── Role Badge ───────────────────────────────────────────────────────────────
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

// ─── Product Mini-card ────────────────────────────────────────────────────────
const ProductChip = ({ product }) => {
    const img = product?.images?.[0]?.url;
    const price = product?.price?.saleAmount || product?.price?.amount;
    return (
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-background/50 border border-border-theme/30 hover:border-accent/30 transition-colors">
            <div className="w-11 h-11 rounded-xl overflow-hidden bg-surface flex-shrink-0">
                {img ? <img src={img} alt={product.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><i className="ri-image-line text-foreground/20" /></div>}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-black truncate">{product?.title}</p>
                <p className="text-[10px] text-foreground/40 font-bold">{product?.category?.name}</p>
            </div>
            {price && (
                <span className="text-[10px] font-black text-accent flex-shrink-0">
                    ₹{price.toLocaleString("en-IN")}
                </span>
            )}
        </div>
    );
};

// ─── Cart Item Row ────────────────────────────────────────────────────────────
const CartItem = ({ item }) => {
    const img = item?.product?.images?.[0]?.url;
    return (
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-background/50 border border-border-theme/30">
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

// ─── Order Row ────────────────────────────────────────────────────────────────
const statusMap = {
    pending:    { cls: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
    processing: { cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    shipped:    { cls: "bg-sky-500/10 text-sky-400 border-sky-500/20" },
    delivered:  { cls: "bg-green-500/10 text-green-400 border-green-500/20" },
    cancelled:  { cls: "bg-red-500/10 text-red-400 border-red-500/20" },
};

const OrderRow = ({ order }) => {
    const { cls } = statusMap[order.status] || statusMap.pending;
    const date = new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    return (
        <div className="p-4 rounded-2xl bg-background/50 border border-border-theme/30 space-y-3">
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
                    <div key={idx} className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg overflow-hidden bg-surface flex-shrink-0">
                            {item.product?.images?.[0]?.url ? <img src={item.product.images[0].url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><i className="ri-image-line text-[8px] text-foreground/20" /></div>}
                        </div>
                        <p className="text-[10px] font-bold truncate flex-1">{item.product?.title}</p>
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

// ─── Main Panel ───────────────────────────────────────────────────────────────
const UserDetailPanel = ({ userId, onClose }) => {
    const { handleFetchUserDetail, clearSelectedUser } = useUsers();
    const { selectedUser: user, detailLoading } = useSelector(s => s.users);
    const [tab, setTab] = useState("wishlist");

    useEffect(() => {
        if (userId) handleFetchUserDetail(userId);
        return () => clearSelectedUser();
    }, [userId]);

    const handleClose = () => {
        clearSelectedUser();
        onClose?.();
    };

    const tabs = [
        { id: "wishlist", label: "Wishlist", icon: "ri-heart-line",    count: user?.wishlist?.products?.length },
        { id: "cart",     label: "Cart",     icon: "ri-shopping-bag-line", count: user?.cart?.items?.length },
        { id: "orders",   label: "Orders",   icon: "ri-receipt-line",   count: user?.orders?.length },
        ...(user?.role === "seller" ? [{ id: "products", label: "Products", icon: "ri-store-2-line", count: user?.products?.length }] : []),
    ];

    return (
        // Backdrop
        <div className="fixed inset-0 z-[200] flex items-start justify-end" onClick={handleClose}>
            {/* Blur overlay */}
            <div className="absolute inset-0 bg-background/60 backdrop-blur-md" />

            {/* Panel */}
            <div
                className="relative z-10 h-full w-full max-w-md bg-surface border-l border-border-theme/50 shadow-2xl flex flex-col overflow-hidden animate-slide-in-right"
                onClick={e => e.stopPropagation()}
                style={{ animation: "slideInRight 0.3s cubic-bezier(0.16,1,0.3,1)" }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-border-theme/30 flex-shrink-0">
                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40">User Profile</span>
                    <button
                        onClick={handleClose}
                        className="w-8 h-8 rounded-xl flex items-center justify-center bg-foreground/5 hover:bg-foreground/10 transition-colors text-foreground/50"
                    >
                        <i className="ri-close-line text-lg" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                    {detailLoading ? (
                        <div className="p-6 space-y-4 animate-pulse">
                            <div className="flex gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-foreground/[0.08] dark:bg-surface/70" />
                                <div className="flex-1 space-y-2 pt-1">
                                    <div className="h-4 bg-foreground/[0.08] dark:bg-surface/70 rounded-lg w-3/4" />
                                    <div className="h-3 bg-foreground/[0.05] dark:bg-surface/50 rounded-lg w-1/2" />
                                    <div className="h-3 bg-foreground/[0.05] dark:bg-surface/50 rounded-lg w-1/3" />
                                </div>
                            </div>
                            <div className="h-24 bg-foreground/[0.05] dark:bg-surface/50 rounded-2xl" />
                            <div className="h-32 bg-foreground/[0.05] dark:bg-surface/50 rounded-2xl" />
                        </div>
                    ) : !user ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-3 text-foreground/30">
                            <i className="ri-user-unfollow-line text-4xl" />
                            <p className="text-sm font-bold">User not found</p>
                        </div>
                    ) : (
                        <div className="p-5 space-y-5">
                            {/* Avatar + Identity */}
                            <div className="flex gap-4 items-start">
                                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-background border border-border-theme/40 flex-shrink-0">
                                    {user.profilePic
                                        ? <img src={user.profilePic} alt={user.fullname} className="w-full h-full object-cover" />
                                        : <div className="w-full h-full flex items-center justify-center bg-accent/10"><i className="ri-user-3-line text-2xl text-accent" /></div>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-lg font-black tracking-tight truncate">{user.fullname}</h2>
                                    <p className="text-[11px] text-foreground/45 font-medium truncate">{user.email}</p>
                                    <p className="text-[11px] text-foreground/45 font-medium">{user.contact}</p>
                                    <div className="mt-2">
                                        <RoleBadge role={user.role} />
                                    </div>
                                </div>
                            </div>

                            {/* Address block */}
                            {user.addressDetails ? (
                                <div className="p-4 rounded-2xl bg-background/50 border border-border-theme/30 space-y-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <i className="ri-map-pin-2-line text-accent text-sm" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Address</span>
                                    </div>
                                    <p className="text-xs font-bold text-foreground/80">{user.addressDetails.place}, {user.addressDetails.post}</p>
                                    <p className="text-xs text-foreground/50">{user.addressDetails.city}, {user.addressDetails.state} — {user.addressDetails.pincode}</p>
                                </div>
                            ) : (
                                <div className="p-3 rounded-2xl bg-background/30 border border-border-theme/20 flex items-center gap-2 text-foreground/30">
                                    <i className="ri-map-pin-line text-sm" />
                                    <span className="text-[11px] font-bold">No address saved</span>
                                </div>
                            )}

                            {/* Stat pills */}
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { label: "Wishlist",  val: user.wishlist?.products?.length ?? 0, icon: "ri-heart-line"       },
                                    { label: "Cart",      val: user.cart?.items?.length ?? 0,        icon: "ri-shopping-bag-line"},
                                    { label: "Orders",    val: user.orders?.length ?? 0,             icon: "ri-receipt-line"     },
                                ].map(({ label, val, icon }) => (
                                    <div key={label} className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-background/50 border border-border-theme/30">
                                        <i className={`${icon} text-accent text-lg`} />
                                        <span className="text-lg font-black">{val}</span>
                                        <span className="text-[9px] font-black uppercase tracking-wider text-foreground/35">{label}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-1 bg-background/50 p-1 rounded-xl border border-border-theme/30 flex-wrap">
                                {tabs.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setTab(t.id)}
                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest flex-1 justify-center transition-all
                                            ${tab === t.id ? "bg-accent text-accent-content shadow-sm" : "text-foreground/40 hover:text-foreground/70"}`}
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

                            {/* Tab Content */}
                            <div className="space-y-2 pb-4">
                                {tab === "wishlist" && (
                                    user.wishlist?.products?.length > 0
                                        ? user.wishlist.products.map(p => <ProductChip key={p._id} product={p} />)
                                        : <EmptyTabState icon="ri-heart-line" label="No wishlist items" />
                                )}
                                {tab === "cart" && (
                                    user.cart?.items?.length > 0
                                        ? user.cart.items.map((item, i) => <CartItem key={i} item={item} />)
                                        : <EmptyTabState icon="ri-shopping-bag-line" label="Cart is empty" />
                                )}
                                {tab === "orders" && (
                                    user.orders?.length > 0
                                        ? user.orders.map(o => <OrderRow key={o._id} order={o} />)
                                        : <EmptyTabState icon="ri-receipt-line" label="No orders placed" />
                                )}
                                {tab === "products" && (
                                    user.products?.length > 0
                                        ? user.products.map(p => <ProductChip key={p._id} product={p} />)
                                        : <EmptyTabState icon="ri-store-2-line" label="No products listed" />
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to   { transform: translateX(0);    opacity: 1; }
                }
            `}</style>
        </div>
    );
};

// ─── Empty state ──────────────────────────────────────────────────────────────
const EmptyTabState = ({ icon, label }) => (
    <div className="flex flex-col items-center justify-center py-10 gap-3 text-foreground/25">
        <i className={`${icon} text-3xl`} />
        <p className="text-xs font-black uppercase tracking-widest">{label}</p>
    </div>
);

export default UserDetailPanel;
