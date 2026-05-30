import React, { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { useSeller } from '../Hooks/useSeller';
import { useProduct } from '../../Poducts/Hooks/useProduct';
import PageLoader from '../../Components/PageLoader';
import { SellerTableSkeleton } from '../../Components/Skeletons';

const SellerWishlistsPage = () => {
    const navigate = useNavigate();
    const { allWishlists, loading: sellerLoading } = useSelector((state) => state.seller);
    const { sellerProducts, sellerLoading: productsLoading } = useSelector((state) => state.product);

    const { fetchDashboardData } = useSeller();
    const { handleGetSellerProducts } = useProduct();

    useEffect(() => {
        fetchDashboardData();
        handleGetSellerProducts();
    }, []);

    // ── Derive product IDs ──────────────────────────────────
    const myProductIds = useMemo(
        () => new Set(sellerProducts?.map(p => p._id?.toString()) || []),
        [sellerProducts]
    );

    // ── Flatten Wishlist items to: { product, user, wishlistedAt } sorted by latest wishlistedAt
    const wishlistedItems = useMemo(() => {
        const list = [];
        allWishlists?.forEach((wishlist) => {
            const userObj = wishlist.user;
            wishlist.products?.forEach((prod) => {
                if (myProductIds.has(prod._id?.toString() || prod.toString())) {
                    list.push({
                        _id: `${wishlist._id}-${prod._id}`,
                        product: prod,
                        user: userObj,
                        wishlistedAt: wishlist.updatedAt || wishlist.createdAt,
                    });
                }
            });
        });
        return list.sort((a, b) => new Date(b.wishlistedAt) - new Date(a.wishlistedAt));
    }, [allWishlists, myProductIds]);

    if (sellerLoading || productsLoading) {
        return <PageLoader skeleton={SellerTableSkeleton} />;
    }

    const formatPrice = (amount, currencyCode = 'INR') => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: currencyCode,
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <span className="text-[10px] font-black tracking-widest text-accent uppercase font-mono">Retail Vault</span>
                <h1 className="text-3xl font-black tracking-tighter text-foreground mt-0.5">Wishlisted Products</h1>
                <p className="text-foreground/45 text-xs mt-1">Real-time flat view of individual wishlists additions, sorted by latest.</p>
            </div>

            {wishlistedItems.length > 0 ? (
                <div className="bg-surface/30 border border-border-theme/50 rounded-3xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border-theme/40 text-[10px] font-black uppercase tracking-widest text-foreground/40 bg-surface/20">
                                    <th className="p-6">Garment Info</th>
                                    <th className="p-6">Wishlisted By</th>
                                    <th className="p-6">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-theme/40">
                                {wishlistedItems.map((item) => (
                                    <tr
                                        key={item._id}
                                        className="hover:bg-white/[0.01] transition-colors text-sm font-bold"
                                    >
                                        <td className="p-6">
                                            <div 
                                                className="flex items-center gap-3 cursor-pointer hover:text-accent transition-colors"
                                                onClick={() => item.product?._id && navigate(`/products/${item.product._id}`)}
                                            >
                                                <div className="w-10 h-12 rounded-lg bg-background overflow-hidden border border-border-theme shrink-0">
                                                    {item.product?.images?.[0]?.url ? (
                                                        <img src={item.product.images[0].url} alt={item.product.title} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-background"><i className="ri-image-line text-foreground/20" /></div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-black text-foreground truncate max-w-[200px] uppercase leading-none">{item.product?.title || 'Removed garment'}</p>
                                                    <span className="text-[10px] font-black text-accent mt-2 block">{formatPrice(item.product?.price?.saleAmount || item.product?.price?.amount || 0)}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            {item.user ? (
                                                <div 
                                                    className="flex items-center gap-3 cursor-pointer hover:text-accent transition-colors"
                                                    onClick={() => navigate(`/seller/users/${item.user?._id || item.user}`)}
                                                >
                                                    <div className="w-8 h-8 rounded-full overflow-hidden border border-border-theme shrink-0">
                                                        {item.user.profilePic ? (
                                                            <img src={item.user.profilePic} alt={item.user.fullname} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-background"><i className="ri-user-line text-foreground/30" /></div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-foreground leading-tight text-xs font-black">{item.user.fullname}</h4>
                                                        <p className="text-[10px] text-foreground/45 font-medium">{item.user.email}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="italic text-foreground/30 text-xs">Unknown Client</span>
                                            )}
                                        </td>
                                        <td className="p-6 text-xs text-foreground/45">
                                            {new Date(item.wishlistedAt).toLocaleString("en-IN", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit"
                                            })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-surface border border-border-theme/40 rounded-3xl p-16 text-center text-foreground/40 font-medium">
                    <i className="ri-heart-line text-4xl text-accent/20 mb-3 block" />
                    No user wishlist records found.
                </div>
            )}
        </div>
    );
};

export default SellerWishlistsPage;
