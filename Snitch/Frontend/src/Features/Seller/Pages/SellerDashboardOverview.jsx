import React, { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { useSeller } from '../Hooks/useSeller';
import { useProduct } from '../../Poducts/Hooks/useProduct';
import { useUsers } from '../../Users/Hooks/useUsers';
import PageLoader from '../../Components/PageLoader';
import { SellerOverviewSkeleton } from '../../Components/Skeletons';

const SellerDashboardOverview = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const { allCarts, allWishlists, allOrders, users, loading: sellerLoading } = useSelector((state) => state.seller);
    const { sellerProducts, sellerLoading: productsLoading } = useSelector((state) => state.product);
    const { allUsers: allUsersFromStore } = useSelector((state) => state.users);

    const { fetchDashboardData } = useSeller();
    const { handleGetSellerProducts } = useProduct();
    const { handleFetchAllUsers } = useUsers();

    useEffect(() => {
        fetchDashboardData();
        handleGetSellerProducts();
        handleFetchAllUsers();
    }, []);

    // ── Derive product IDs ──────────────────────────────────
    const myProductIds = useMemo(
        () => new Set(sellerProducts?.map(p => p._id?.toString()) || []),
        [sellerProducts]
    );

    // ── Filter Customers: Users who have added seller's products to cart, wishlist, or placed orders
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
        const orderUserIds = new Set(
            allOrders
                .filter(o => o.items?.some(i => myProductIds.has(i.product?._id?.toString())))
                .map(o => o.buyer?._id?.toString())
        );
        const relevantIds = new Set([...cartUserIds, ...wishUserIds, ...orderUserIds]);
        const uList = (allUsersFromStore && allUsersFromStore.length > 0) ? allUsersFromStore : (users || []);
        return uList.filter(u => relevantIds.has(u._id?.toString()));
    }, [allCarts, allWishlists, allOrders, myProductIds, allUsersFromStore, users]);

    // ── Filter Directory Users: other buyers/sellers who are NOT customers
    const directoryUsers = useMemo(() => {
        const customerIds = new Set(customers.map(c => c._id?.toString()));
        const uList = (allUsersFromStore && allUsersFromStore.length > 0) ? allUsersFromStore : (users || []);
        return uList.filter(u => 
            u._id?.toString() !== user?._id?.toString() &&
            u.role !== 'admin' &&
            !customerIds.has(u._id?.toString())
        );
    }, [allUsersFromStore, users, customers, user]);

    if (sellerLoading || productsLoading) {
        return <PageLoader skeleton={SellerOverviewSkeleton} />;
    }

    const stats = [
        { label: 'Catalog Products', val: sellerProducts?.length || 0, icon: 'ri-archive-line', path: '/seller/catalog', color: 'from-blue-500/10 to-indigo-500/10 hover:border-blue-500/30' },
        { label: 'Managed Orders', val: allOrders?.length || 0, icon: 'ri-bill-line', path: '/seller/orders', color: 'from-amber-500/10 to-orange-500/10 hover:border-amber-500/30' },
        { label: 'Active Customers', val: customers.length, icon: 'ri-user-heart-line', path: '/seller/customers', color: 'from-pink-500/10 to-rose-500/10 hover:border-pink-500/30' },
        { label: 'User Carts', val: allCarts?.length || 0, icon: 'ri-shopping-cart-line', path: '/seller/carts', color: 'from-emerald-500/10 to-teal-500/10 hover:border-emerald-500/30' },
        { label: 'Wishlisted Products', val: allWishlists?.length || 0, icon: 'ri-heart-line', path: '/seller/wishlists', color: 'from-violet-500/10 to-fuchsia-500/10 hover:border-violet-500/30' },
        { label: 'Other Platform Users', val: directoryUsers.length, icon: 'ri-team-line', path: '/seller/users', color: 'from-sky-500/10 to-cyan-500/10 hover:border-sky-500/30' },
    ];

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div>
                <span className="text-[10px] font-black tracking-widest text-accent uppercase">Overview Hub</span>
                <h1 className="text-4xl font-black tracking-tighter text-foreground mt-1">Seller Performance</h1>
                <p className="text-foreground/45 mt-2">Browse metrics summaries and manage inventory settings.</p>
            </div>

            {/* Stats Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stats.map((stat, idx) => (
                    <div
                        key={idx}
                        onClick={() => navigate(stat.path)}
                        className={`p-8 rounded-3xl bg-gradient-to-br ${stat.color} border border-border-theme/40 dark:border-border-theme/20 shadow-sm flex flex-col justify-between h-52 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-md group`}
                    >
                        <div className="flex justify-between items-start">
                            <div className="w-12 h-12 rounded-2xl bg-surface border border-border-theme flex items-center justify-center text-accent group-hover:text-foreground group-hover:bg-accent transition-all duration-300">
                                <i className={`${stat.icon} text-xl`} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-accent group-hover:underline">Manage &rarr;</span>
                        </div>
                        <div>
                            <span className="text-4xl font-black block tracking-tight">{stat.val}</span>
                            <span className="text-xs font-black uppercase tracking-widest text-foreground/40 mt-1 block">{stat.label}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SellerDashboardOverview;
