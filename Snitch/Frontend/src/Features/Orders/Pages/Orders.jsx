import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useOrder } from '../Hooks/useOrder';
import { useNavigate } from 'react-router';
import { PrimaryBtn } from '../../Components/Buttons';

const Orders = () => {
    const navigate = useNavigate();
    const { user } = useSelector(state => state.auth);
    const { orders, loading } = useSelector(state => state.order);
    const { getMyOrders } = useOrder();

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        getMyOrders();
    }, [user]);

    const formatPrice = (amount, currencyCode = 'INR') => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: currencyCode,
            maximumFractionDigits: 0
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-10">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[10px] font-black tracking-widest uppercase text-accent animate-pulse">Retrieving Orders...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground pt-24 pb-20 px-4 md:px-10">
            <div className="max-w-4xl mx-auto">
                <header className="mb-12">
                    <span className="text-[10px] font-black tracking-widest text-accent uppercase">Receipt Vault</span>
                    <h1 className="text-5xl font-black tracking-tighter text-foreground mt-1">Order History</h1>
                    <p className="text-foreground/40 mt-2">Track status logs and past transactions.</p>
                </header>

                {orders?.length > 0 ? (
                    <div className="space-y-8">
                        {orders.map((order) => (
                            <div key={order._id} className="bg-surface border border-border-theme rounded-3xl p-6 md:p-8 shadow-sm">
                                {/* Header order card details */}
                                <div className="flex flex-wrap justify-between items-start md:items-center gap-4 border-b border-border-theme/40 pb-6 mb-6">
                                    <div>
                                        <h3 className="font-black text-sm uppercase">Order #{order._id.slice(-8)}</h3>
                                        <p className="text-[10px] text-foreground/45 mt-0.5">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-left md:text-right">
                                            <p className="text-[8px] font-black tracking-widest text-foreground/45 uppercase">TOTAL BILL</p>
                                            <p className="text-lg font-black text-accent">{formatPrice(order.totalAmount)}</p>
                                        </div>
                                        <span className={[
                                            'text-[8px] font-black tracking-widest uppercase px-3 py-1.5 rounded-lg border ml-2',
                                            order.status === 'delivered' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                                            order.status === 'cancelled' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                                            order.status === 'shipped' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' :
                                            'bg-amber-500/10 border-amber-500/20 text-amber-500'
                                        ].join(' ')}>
                                            {order.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Items summary table */}
                                    <div className="md:col-span-2 space-y-4">
                                        <h4 className="text-[9px] font-black tracking-widest uppercase text-foreground/40 mb-2">Items Bought</h4>
                                        {order.items?.map((item, idx) => (
                                            <div 
                                                key={item._id || idx} 
                                                onClick={() => item.product?._id && navigate(`/products/${item.product._id}`)}
                                                className="flex gap-4 p-3 bg-background/50 border border-border-theme/30 rounded-2xl cursor-pointer hover:border-accent/40 transition-colors"
                                            >
                                                <div className="w-12 h-14 bg-surface rounded-xl overflow-hidden flex-shrink-0">
                                                    <img src={item.product?.images?.[0]?.url} alt={item.product?.title} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                                    <div>
                                                        <h5 className="text-[11px] font-black truncate uppercase leading-none">{item.product?.title || 'Removed garment'}</h5>
                                                        <p className="text-[9px] text-foreground/45 mt-1 font-semibold">
                                                            Qty: {item.quantity} • Size: {item.size?.name || 'STD'} • Color: {item.color?.name || 'STD'}
                                                        </p>
                                                    </div>
                                                    <span className="text-[10px] font-black text-accent">{formatPrice(item.price * item.quantity)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Shipping Address summary */}
                                    <div className="bg-background/40 border border-border-theme/60 rounded-2xl p-5 text-xs h-fit self-start space-y-3">
                                        <h4 className="text-[9px] font-black tracking-widest uppercase text-foreground/40">Shipping Address</h4>
                                        <div className="text-foreground/80 leading-relaxed font-bold">
                                            <p>{order.shippingAddress.place}</p>
                                            <p>{order.shippingAddress.post}, {order.shippingAddress.city}</p>
                                            <p>{order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-surface border border-border-theme rounded-3xl p-20 text-center max-w-xl mx-auto flex flex-col items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                            <i className="ri-bill-line text-4xl"></i>
                        </div>
                        <div>
                            <h4 className="text-xl font-bold mb-1">No orders found</h4>
                            <p className="text-gray-500 text-sm">You haven't placed any orders on Snitch yet.</p>
                        </div>
                        <PrimaryBtn onClick={() => navigate('/')} className="mt-2" icon="ri-arrow-right-line">Start Shopping</PrimaryBtn>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Orders;
