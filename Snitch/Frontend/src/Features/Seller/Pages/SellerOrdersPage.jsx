import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { useSeller } from '../Hooks/useSeller';
import { useProduct } from '../../Poducts/Hooks/useProduct';
import PageLoader from '../../Components/PageLoader';
import { SellerOrdersSkeleton } from '../../Components/Skeletons';

const SellerOrdersPage = () => {
    const navigate = useNavigate();
    const { allOrders, loading: sellerLoading } = useSelector((state) => state.seller);
    const { sellerProducts, sellerLoading: productsLoading } = useSelector((state) => state.product);

    const { fetchDashboardData, handleUpdateOrderStatus } = useSeller();
    const { handleGetSellerProducts } = useProduct();
    const [expandedOrderId, setExpandedOrderId] = useState(null);

    useEffect(() => {
        fetchDashboardData();
        handleGetSellerProducts();
    }, []);

    // ── Derive product IDs to highlight seller's own products ──────────────────
    const myProductIds = useMemo(
        () => new Set(sellerProducts?.map(p => p._id?.toString()) || []),
        [sellerProducts]
    );

    if (sellerLoading || productsLoading) {
        return <PageLoader skeleton={SellerOrdersSkeleton} />;
    }

    const formatPrice = (amount, currencyCode = 'INR') => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: currencyCode,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const toggleExpandOrder = (id) => {
        setExpandedOrderId(prev => prev === id ? null : id);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <span className="text-[10px] font-black tracking-widest text-accent uppercase font-mono">Fulfillment Station</span>
                <h1 className="text-3xl font-black tracking-tighter text-foreground mt-0.5">Shop Purchase Orders</h1>
                <p className="text-foreground/45 text-xs mt-1">Real-time ecommerce orders register. Click an order to expand sub-items details, specs, and vendor channels.</p>
            </div>

            {allOrders?.length > 0 ? (
                <div className="space-y-6">
                    {allOrders.map((order) => {
                        const isExpanded = expandedOrderId === order._id;
                        const totalItemsCount = order.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;

                        return (
                            <div 
                                key={order._id} 
                                className={`bg-surface border transition-all duration-300 rounded-3xl p-6 md:p-8 shadow-sm ${
                                    isExpanded ? 'border-accent/40 bg-accent/[0.01]' : 'border-border-theme hover:border-accent/20'
                                }`}
                            >
                                {/* Main Order Summary Panel */}
                                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 cursor-pointer" onClick={() => toggleExpandOrder(order._id)}>
                                    
                                    {/* Left Side: Buyer & Basic Order Details */}
                                    <div className="flex items-center gap-4">
                                        <div 
                                            className="w-12 h-12 rounded-full overflow-hidden border border-border-theme shrink-0 hover:scale-105 transition-transform" 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/seller/users/${order.buyer?._id || order.buyer}`);
                                            }}
                                        >
                                            {order.buyer?.profilePic ? (
                                                <img src={order.buyer.profilePic} alt={order.buyer.fullname} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-background"><i className="ri-user-line text-foreground/30" /></div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-black text-base text-foreground leading-tight">{order.buyer?.fullname || 'Platform Buyer'}</h3>
                                                <span className="text-[9px] font-mono font-black text-foreground/45 bg-foreground/5 px-2 py-0.5 rounded-full border border-border-theme">ID: {order._id.slice(-8).toUpperCase()}</span>
                                            </div>
                                            <p className="text-[10px] text-foreground/40 font-bold mt-1">
                                                Placed: {new Date(order.createdAt).toLocaleString("en-IN", { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Middle: Total items & pricing info */}
                                    <div className="flex flex-wrap items-center gap-6 justify-between w-full lg:w-auto">
                                        <div className="flex gap-4">
                                            <div className="text-left">
                                                <p className="text-[8px] font-black tracking-widest text-foreground/45 uppercase">Total Items</p>
                                                <p className="text-sm font-black text-foreground/70">{totalItemsCount} pcs</p>
                                            </div>
                                            <div className="text-left">
                                                <p className="text-[8px] font-black tracking-widest text-foreground/45 uppercase">Payment</p>
                                                <span className={`inline-block text-[8px] font-black px-2 py-0.5 rounded-md border uppercase tracking-widest mt-0.5 ${
                                                    order.paymentStatus === 'paid' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                                    order.paymentStatus === 'failed' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                                    'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                                }`}>
                                                    {order.paymentStatus || 'pending'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="text-left md:text-right">
                                            <p className="text-[8px] font-black tracking-widest text-foreground/45 uppercase">Total Amount</p>
                                            <p className="text-lg font-black text-accent">{formatPrice(order.totalAmount)}</p>
                                        </div>

                                        {/* Right Side: Status Selector & Collapsible Toggle */}
                                        <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                                            <select
                                                value={order.status}
                                                onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                                                className={[
                                                    'px-4 py-2.5 rounded-xl border text-xs font-black tracking-widest uppercase outline-none cursor-pointer',
                                                    order.status === 'delivered' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                                                    order.status === 'cancelled' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                                                    order.status === 'returned' ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' :
                                                    order.status === 'shipped' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' :
                                                    'bg-amber-500/10 border-amber-500/20 text-amber-500'
                                                ].join(' ')}
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="processing">Processing</option>
                                                <option value="shipped">Shipped</option>
                                                <option value="delivered">Delivered</option>
                                                <option value="cancelled">Cancelled</option>
                                                <option value="returned">Returned</option>
                                            </select>

                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleExpandOrder(order._id);
                                                }}
                                                className="w-10 h-10 rounded-xl border border-border-theme flex items-center justify-center text-foreground/50 hover:text-accent hover:border-accent/40 hover:bg-white/5 active:scale-95 transition-all cursor-pointer animate-in fade-in"
                                            >
                                                <i className={`text-lg transition-transform duration-300 ${isExpanded ? 'ri-arrow-up-s-line rotate-180' : 'ri-arrow-down-s-line'}`} />
                                            </button>
                                        </div>
                                    </div>

                                </div>

                                {/* order-sub Drawer Accordion Section */}
                                {isExpanded && (
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 border-t border-border-theme/40 pt-6 mt-6 animate-in fade-in duration-300">
                                        {/* Products ordered in this cart */}
                                        <div className="lg:col-span-2 overflow-x-auto">
                                            <table className="w-full text-left min-w-[550px]">
                                                <thead>
                                                    <tr className="border-b border-border-theme/30 text-[9px] uppercase tracking-widest text-foreground/45">
                                                        <th className="pb-3">Product Item</th>
                                                        <th className="pb-3">Specifications</th>
                                                        <th className="pb-3">Vendor Channel</th>
                                                        <th className="pb-3 text-center">Qty</th>
                                                        <th className="pb-3 text-right">Price</th>
                                                        <th className="pb-3 text-right">Subtotal</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border-theme/10">
                                                    {order.items?.map((item, idx) => {
                                                        const product = item.product || {};
                                                        const price = product.price?.saleAmount || product.price?.amount || item.price || 0;
                                                        const isMine = myProductIds.has(product._id?.toString() || product.toString());

                                                        return (
                                                            <tr key={item._id || idx} className={`text-xs font-bold ${isMine ? 'bg-accent/[0.02]' : ''}`}>
                                                                <td className="py-3">
                                                                    <div 
                                                                        className="flex items-center gap-3 cursor-pointer hover:text-accent transition-colors"
                                                                        onClick={() => product._id && navigate(`/products/${product._id}`)}
                                                                    >
                                                                        <div className="w-8 h-10 rounded overflow-hidden bg-background shrink-0 border border-border-theme/40">
                                                                            {product.images?.[0]?.url ? (
                                                                                <img src={product.images[0].url} alt={product.title} className="w-full h-full object-cover" />
                                                                            ) : (
                                                                                <div className="w-full h-full flex items-center justify-center bg-background"><i className="ri-image-line text-[10px] text-foreground/20" /></div>
                                                                            )}
                                                                        </div>
                                                                        <div>
                                                                            <span className="truncate max-w-[150px] uppercase font-black block leading-none">{product.title || 'Removed item'}</span>
                                                                            <span className="text-[9px] font-bold text-foreground/35 uppercase tracking-wider block mt-1">Brand: {product.brand?.name || 'Snitch'}</span>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="py-3 text-[10px] text-foreground/60 font-medium">
                                                                    <div className="space-y-1">
                                                                        {product.category?.name && <span className="bg-foreground/5 text-foreground/50 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-bold">{product.category.name}</span>}
                                                                        <div>Size: {item.size?.name || 'STD'}</div>
                                                                        {item.color?.name && (
                                                                            <div className="flex items-center gap-1">
                                                                                <span>Col:</span>
                                                                                <span className="w-2.5 h-2.5 rounded-full border border-white/20 inline-block" style={{ backgroundColor: item.color.hexCode }} />
                                                                                <span>{item.color.name}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="py-3">
                                                                    {isMine ? (
                                                                        <span className="text-[8px] font-black uppercase tracking-widest text-accent bg-accent/15 border border-accent/25 px-2 py-0.5 rounded-md">My Channel</span>
                                                                    ) : (
                                                                        <div className="text-[10px] text-foreground/50 font-medium">
                                                                            <span className="font-bold text-foreground/75 leading-none block uppercase">{product.seller?.fullname || 'Other Partner'}</span>
                                                                            <span className="text-[8px] opacity-75">{product.seller?.email}</span>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td className="py-3 text-center">{item.quantity}</td>
                                                                <td className="py-3 text-right text-foreground/70">{formatPrice(price)}</td>
                                                                <td className="py-3 text-right text-accent font-black">
                                                                    {formatPrice(price * item.quantity)}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Shipping details */}
                                        <div className="bg-background/50 border border-border-theme/60 rounded-2xl p-5 text-sm space-y-4 self-start">
                                            <h4 className="text-[10px] font-black tracking-widest uppercase text-foreground/45">Shipping Destination</h4>
                                            <div>
                                                <p className="font-bold text-foreground/80">{order.shippingAddress?.place}</p>
                                                <p className="font-bold text-foreground/80">{order.shippingAddress?.post}, {order.shippingAddress?.city}</p>
                                                <p className="font-bold text-foreground/80">{order.shippingAddress?.state} - {order.shippingAddress?.pincode}</p>
                                            </div>
                                            <div className="pt-2 border-t border-border-theme/30 flex items-center gap-2 text-foreground/60 font-medium">
                                                <i className="ri-phone-line text-accent" />
                                                <span>{order.contactNumber}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-surface border border-border-theme/40 rounded-3xl p-16 text-center text-foreground/40 font-medium">
                    <i className="ri-bill-line text-4xl text-accent/20 mb-3 block" />
                    No purchase orders placed yet.
                </div>
            )}
        </div>
    );
};

export default SellerOrdersPage;
