import React, { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { useSeller } from "../Hooks/useSeller";
import { useProduct } from "../../Poducts/Hooks/useProduct";
import { useUsers } from "../../Users/Hooks/useUsers";
import PageLoader from "../../Components/PageLoader";
import { SellerTableSkeleton } from "../../Components/Skeletons";
import useDebounceThrottle from "../../../utils/useDebounceThrottle";

const SellerUsersPage = () => {
  const navigate = useNavigate();
  const {
    allCarts,
    allWishlists,
    allOrders,
    users,
    loading: sellerLoading,
  } = useSelector((state) => state.seller);
  const { sellerProducts, sellerLoading: productsLoading } = useSelector(
    (state) => state.product,
  );
  const { allUsers: allUsersFromStore } = useSelector((state) => state.users);
  const { user: currentUser } = useSelector((state) => state.auth);

  const { fetchDashboardData } = useSeller();
  const { handleGetSellerProducts } = useProduct();
  const { handleFetchAllUsers } = useUsers();

  const [searchVal, setSearchVal] = useState("");
  const debouncedSearch = useDebounceThrottle(searchVal);

  useEffect(() => {
    fetchDashboardData();
    handleGetSellerProducts();
    handleFetchAllUsers();
  }, []);

  // ── Derive product IDs ──────────────────────────────────
  const myProductIds = useMemo(
    () => new Set(sellerProducts?.map((p) => p._id?.toString()) || []),
    [sellerProducts],
  );

  // ── Filter Customers: Users who have added seller's products to cart, wishlist, or placed orders
  const customers = useMemo(() => {
    const cartUserIds = new Set(
      allCarts
        .filter((c) =>
          c.items?.some((i) => i.product && myProductIds.has(i.product._id?.toString() || i.product.toString())),
        )
        .map((c) => c.user?._id?.toString()),
    );
    const wishUserIds = new Set(
      allWishlists
        .filter((w) =>
          w.products?.some((p) => p && myProductIds.has(p._id?.toString() || p.toString())),
        )
        .map((w) => w.user?._id?.toString()),
    );
    const orderUserIds = new Set(
      allOrders
        .filter((o) =>
          o.items?.some((i) => i.product && myProductIds.has(i.product._id?.toString() || i.product.toString())),
        )
        .map((o) => o.buyer?._id?.toString()),
    );
    const relevantIds = new Set([
      ...cartUserIds,
      ...wishUserIds,
      ...orderUserIds,
    ]);
    const uList = (allUsersFromStore && allUsersFromStore.length > 0) ? allUsersFromStore : (users || []);
    return uList.filter((u) => relevantIds.has(u._id?.toString()));
  }, [
    allCarts,
    allWishlists,
    allOrders,
    myProductIds,
    allUsersFromStore,
    users,
  ]);

  // ── Filter Directory Users: Show ALL users except active user and admin users
  const directoryUsers = useMemo(() => {
    const uList = (allUsersFromStore && allUsersFromStore.length > 0) ? allUsersFromStore : (users || []);
    return uList.filter(
      (u) =>
        u._id?.toString() !== currentUser?._id?.toString() &&
        u.role !== "admin"
    );
  }, [allUsersFromStore, users, currentUser]);

  // ── Filter list by search query
  const filteredUsers = useMemo(() => {
    return directoryUsers.filter((u) => {
      if (!debouncedSearch) return true;
      const q = debouncedSearch.toLowerCase();
      return (
        u.fullname?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
      );
    });
  }, [directoryUsers, debouncedSearch]);

  if (sellerLoading || productsLoading) {
    return <PageLoader skeleton={SellerTableSkeleton} />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <span className="text-[10px] font-black tracking-widest text-accent uppercase font-mono">
          Platform Registry
        </span>
        <h1 className="text-3xl font-black tracking-tighter text-foreground mt-0.5">
          Directory Users
        </h1>
        <p className="text-foreground/45 text-xs mt-1">
          Platform buyers and partners who have not interacted with your shop
          yet.
        </p>
      </div>

      {/* Search Box */}
      <div className="relative">
        <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 text-lg" />
        <input
          type="text"
          placeholder="Search directory by name or email..."
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          className="w-full pl-12 pr-6 py-4 rounded-2xl bg-surface/30 border border-border-theme/40 text-sm focus:outline-none focus:border-accent/40 font-bold transition-all placeholder:text-foreground/20"
        />
      </div>

      {filteredUsers.length > 0 ? (
        <div className="bg-surface/30 border border-border-theme/50 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-theme/40 text-[10px] font-black uppercase tracking-widest text-foreground/40 bg-surface/20">
                  <th className="p-6">User Info</th>
                  <th className="p-6">Location</th>
                  <th className="p-6">Role</th>
                  <th className="p-6 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-theme/40">
                {filteredUsers.map((usr) => (
                  <tr
                    key={usr._id}
                    className="hover:bg-white/[0.01] transition-colors text-sm font-bold"
                  >
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-border-theme/50 shrink-0">
                          {usr.profilePic ? (
                            <img
                              src={usr.profilePic}
                              alt={usr.fullname}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-background">
                              <i className="ri-user-3-line text-foreground/30" />
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="text-foreground">{usr.fullname}</h4>
                          <p className="text-xs text-foreground/45 font-medium">
                            {usr.email} • {usr.contact}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6 text-xs text-foreground/60 max-w-[200px] truncate">
                      {usr.place || (
                        <span className="italic text-foreground/30">
                          No address saved
                        </span>
                      )}
                    </td>
                    <td className="p-6">
                      <span
                        className={[
                          "text-[8px] font-black tracking-widest uppercase px-2.5 py-1 rounded-md border",
                          usr.role === "seller"
                            ? "bg-accent/10 border-accent/20 text-accent"
                            : "bg-gray-500/10 border-gray-500/20 text-foreground/60",
                        ].join(" ")}
                      >
                        {usr.role}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <button
                        onClick={() => navigate(`/seller/users/${usr._id}`)}
                        className="px-3 py-1.5 bg-foreground/5 hover:bg-accent hover:text-accent-content rounded-lg text-xs transition-colors font-black uppercase tracking-wider cursor-pointer"
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
      ) : (
        <div className="bg-surface border border-border-theme/60 rounded-3xl p-16 text-center text-foreground/40 font-medium">
          <i className="ri-team-line text-4xl text-accent/20 mb-3 block" />
          No platform users found.
        </div>
      )}
    </div>
  );
};

export default SellerUsersPage;
