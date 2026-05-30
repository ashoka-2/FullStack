import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useOrder } from '../Orders/Hooks/useOrder';
import { useCart } from '../Cart/Hooks/useCart';
import { useNavigate } from 'react-router';
import { PrimaryBtn, SecondaryBtn } from './Buttons';
import axios from 'axios';

const CheckoutModal = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const { cart } = useSelector((state) => state.cart);
    const { user } = useSelector((state) => state.auth);
    const { handlePlaceOrder } = useOrder();
    const { clearCart } = useCart();

    const [formData, setFormData] = useState({
        pincode: '',
        post: '',
        place: '',
        city: '',
        state: '',
        contactNumber: ''
    });
    const [loadingAddress, setLoadingAddress] = useState(false);
    const [placing, setPlacing] = useState(false);

    // Populate user's saved address and contact info when modal opens
    useEffect(() => {
        if (isOpen && user) {
            setLoadingAddress(true);
            axios.get('/api/places', { withCredentials: true })
                .then(res => {
                    const savedPlace = res.data.place;
                    const contactDigits = user.contact?.startsWith('+91') 
                        ? user.contact.slice(3) 
                        : user.contact || '';
                        
                    if (savedPlace) {
                        setFormData({
                            pincode: savedPlace.pincode || '',
                            post: savedPlace.post || '',
                            place: savedPlace.place || '',
                            city: savedPlace.city || '',
                            state: savedPlace.state || '',
                            contactNumber: contactDigits
                        });
                    } else {
                        setFormData(prev => ({
                            ...prev,
                            contactNumber: contactDigits
                        }));
                    }
                })
                .catch(err => console.error("Error fetching checkout address", err))
                .finally(() => setLoadingAddress(false));
        }
    }, [isOpen, user]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'contactNumber') {
            const cleaned = value.replace(/\D/g, '').slice(0, 10);
            setFormData(prev => ({ ...prev, [name]: cleaned }));
        } else if (name === 'pincode') {
            const cleaned = value.replace(/\D/g, '').slice(0, 6);
            setFormData(prev => ({ ...prev, [name]: cleaned }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const calculateTotal = () => {
        if (!cart || !cart.items) return 0;
        return cart.items.reduce((acc, item) => {
            const price = item.product?.price?.saleAmount || item.product?.price?.amount || 0;
            return acc + (price * item.quantity);
        }, 0);
    };

    const formatPrice = (amount, currencyCode = 'INR') => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: currencyCode,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setPlacing(true);
        try {
            const address = {
                pincode: formData.pincode,
                post: formData.post,
                place: formData.place,
                city: formData.city,
                state: formData.state
            };
            const contact = `+91${formData.contactNumber}`;

            await handlePlaceOrder(address, contact);
            onClose();
            navigate('/orders');
        } catch (error) {
            console.error("Checkout order placement failed", error);
        } finally {
            setPlacing(false);
        }
    };

    const inputCls = "w-full bg-background border border-border-theme focus:border-accent rounded-xl px-4 py-2.5 text-xs font-bold outline-none transition-all";

    return (
        <div className="fixed inset-0 z-[1500] flex items-center justify-center bg-background/80 backdrop-blur-xl p-4 overflow-y-auto">
            <div className="bg-surface border border-border-theme rounded-3xl p-6 md:p-8 w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-300 grid grid-cols-1 md:grid-cols-5 gap-8">
                {/* Left pane: Checkout details */}
                <div className="md:col-span-3">
                    <h2 className="text-2xl font-black tracking-tighter mb-1">Shipping Vault</h2>
                    <p className="text-[10px] text-foreground/45 uppercase tracking-widest font-black mb-6">Verify dispatch details</p>
                    
                    {loadingAddress ? (
                        <div className="py-12 flex flex-col items-center justify-center text-accent">
                            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-[8px] font-black uppercase tracking-widest mt-2 animate-pulse">Checking credentials...</span>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="text-[9px] font-black uppercase text-foreground/40 ml-1">Street Address / House No.</label>
                                    <input required name="place" value={formData.place} onChange={handleChange} className={inputCls} placeholder="e.g. Penthouse, 5th Avenue" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase text-foreground/40 ml-1">Pincode</label>
                                    <input required name="pincode" value={formData.pincode} onChange={handleChange} className={inputCls} placeholder="6 Digits" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase text-foreground/40 ml-1">Post Office / Area</label>
                                    <input required name="post" value={formData.post} onChange={handleChange} className={inputCls} placeholder="e.g. Bandra West" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase text-foreground/40 ml-1">City</label>
                                    <input required name="city" value={formData.city} onChange={handleChange} className={inputCls} placeholder="e.g. Mumbai" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase text-foreground/40 ml-1">State</label>
                                    <input required name="state" value={formData.state} onChange={handleChange} className={inputCls} placeholder="e.g. Maharashtra" />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[9px] font-black uppercase text-foreground/40 ml-1">Contact Phone</label>
                                    <div className="flex">
                                        <div className="flex items-center gap-1.5 px-3 bg-surface/50 border border-border-theme border-r-0 rounded-l-xl text-gray-400 text-xs font-bold">
                                            <span>🇮🇳</span>
                                            <span>+91</span>
                                        </div>
                                        <input required name="contactNumber" value={formData.contactNumber} onChange={handleChange} className={inputCls + " rounded-l-none"} placeholder="10 Digits" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-6">
                                <SecondaryBtn type="button" onClick={onClose} className="flex-1">Abort</SecondaryBtn>
                                <PrimaryBtn type="submit" loading={placing} className="flex-1" icon="ri-check-double-line">
                                    {placing ? 'Fulfilling...' : 'Confirm Order'}
                                </PrimaryBtn>
                            </div>
                        </form>
                    )}
                </div>

                {/* Right pane: Invoice details */}
                <div className="md:col-span-2 flex flex-col justify-between border-t md:border-t-0 md:border-l border-border-theme/40 pt-6 md:pt-0 md:pl-6">
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-foreground/45 mb-4">Summary</h3>
                        
                        <div className="space-y-3 max-h-48 overflow-y-auto scrollbar-hide pr-1">
                            {cart?.items?.map((item, idx) => (
                                <div key={item._id || idx} className="flex justify-between items-center text-xs font-bold">
                                    <span className="truncate max-w-[120px] text-foreground/80">{item.product?.title}</span>
                                    <span className="text-foreground/40 text-[10px]">x{item.quantity}</span>
                                    <span className="text-accent">{formatPrice((item.product?.price?.saleAmount || item.product?.price?.amount) * item.quantity)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-6 border-t border-border-theme/40 mt-6">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-[8px] font-black uppercase tracking-widest text-foreground/45">Shipping fee</span>
                            <span className="text-xs font-black text-green-500 uppercase">FREE</span>
                        </div>
                        <div className="flex justify-between items-end">
                            <span className="text-[8px] font-black uppercase tracking-widest text-foreground/45">Payable amount</span>
                            <span className="text-xl font-black text-accent">{formatPrice(calculateTotal())}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutModal;
