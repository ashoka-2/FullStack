import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useWishlist } from '../Hooks/useWishlist';
import { useCart } from '../../Cart/Hooks/useCart';
import { useNavigate } from 'react-router';
import { PrimaryBtn, SecondaryBtn } from '../../Components/Buttons';
import PageLoader from '../../Components/PageLoader';
import { WishlistSkeleton } from '../../Components/Skeletons';

const Wishlist = () => {
    const navigate = useNavigate();
    const { user } = useSelector(state => state.auth);
    const { wishlist, loading } = useSelector(state => state.wishlist);
    const { getWishlist, toggleWishlist } = useWishlist();
    const { addToCart } = useCart();

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        getWishlist();
    }, [user]);

    const formatPrice = (amount, currencyCode = 'INR') => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: currencyCode,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const handleMoveToCart = async (productId) => {
        try {
            await addToCart(productId, null, null, 1);
            await toggleWishlist(productId); // Remove from wishlist
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) {
        return <PageLoader skeleton={WishlistSkeleton} />;
    }

    return (
        <div className="min-h-screen bg-background text-foreground pt-24 pb-20 px-4 md:px-10">
            <div className="max-w-7xl mx-auto">
                <header className="mb-12">
                    <span className="text-[10px] font-black tracking-widest text-accent uppercase">Your Favorites</span>
                    <h1 className="text-5xl font-black tracking-tighter text-foreground mt-1">My Wishlist</h1>
                    <p className="text-foreground/40 mt-2">Saved garments ready for checkout.</p>
                </header>

                {wishlist?.products?.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {wishlist.products.map((product) => {
                            const img = product.images?.[0]?.url || "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=400&q=80";
                            const price = product.price?.saleAmount || product.price?.amount || 0;
                            return (
                                <div 
                                    key={product._id} 
                                    onClick={() => navigate(`/products/${product._id}`)}
                                    className="group relative bg-surface border border-border-theme/40 rounded-[2.2rem] overflow-hidden p-3 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer"
                                >
                                    <div className="relative w-full aspect-[4/5] rounded-[1.6rem] overflow-hidden bg-background mb-4">
                                        <img src={img} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                        
                                        {/* Remove button overlay */}
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); toggleWishlist(product._id); }}
                                            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/80 hover:bg-red-500 hover:text-white backdrop-blur-md flex items-center justify-center text-red-500 shadow transition-colors"
                                            title="Remove item"
                                        >
                                            <i className="ri-heart-fill text-sm" />
                                        </button>
                                    </div>

                                    <div className="px-1 flex flex-col justify-between flex-1">
                                        <div className="mb-4">
                                            <h4 className="font-bold text-xs truncate uppercase leading-none">{product.title}</h4>
                                            <span className="text-[10px] font-black text-accent mt-2 block">
                                                {formatPrice(price)}
                                            </span>
                                        </div>

                                        <PrimaryBtn 
                                            onClick={(e) => { e.stopPropagation(); handleMoveToCart(product._id); }} 
                                            icon="ri-shopping-bag-line" 
                                            fullWidth
                                        >
                                            Add to Bag
                                        </PrimaryBtn>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-surface border border-border-theme rounded-3xl p-20 text-center max-w-xl mx-auto flex flex-col items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                            <i className="ri-heart-line text-4xl"></i>
                        </div>
                        <div>
                            <h4 className="text-xl font-bold mb-1">Your wishlist is empty</h4>
                            <p className="text-gray-500 text-sm">Save items to this vault while browsing the collections.</p>
                        </div>
                        <PrimaryBtn onClick={() => navigate('/')} className="mt-2" icon="ri-arrow-right-line">Discover Products</PrimaryBtn>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Wishlist;
