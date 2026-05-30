import React from "react";
import { Link, useLocation } from "react-router";
import { useSelector } from "react-redux";
const SellerNavbar = ({ toggleTheme, isDarkMode }) => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();

  const menuItems = [
    { name: "Dashboard", path: "/seller/dashboard", icon: "ri-dashboard-line" },
    { name: "Catalog", path: "/seller/catalog", icon: "ri-archive-line" },
    {
      name: "Customers",
      path: "/seller/customers",
      icon: "ri-user-heart-line",
    },
    {
      name: "User Carts",
      path: "/seller/carts",
      icon: "ri-shopping-cart-line",
    },
    { name: "Wishlists", path: "/seller/wishlists", icon: "ri-heart-line" },
    { name: "Orders", path: "/seller/orders", icon: "ri-bill-line" },
    { name: "Users", path: "/seller/users", icon: "ri-team-line" },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <aside className="w-64 bg-surface border border-border-theme/60 rounded-[32px] p-6 shrink-0 flex flex-col gap-6 sticky top-28 z-40 backdrop-blur-md">
      {/* Brand */}
      <div className="flex items-center gap-3 px-2">
        <span className="w-3 h-3 bg-accent rounded-full animate-pulse"></span>
        <span className="text-lg font-black tracking-[0.25em] text-foreground uppercase">
          SNITCH SLR
        </span>
      </div>

      {/* Profile Widget */}
      <div className="flex items-center justify-between p-4 bg-background/50 border border-border-theme/60 rounded-2xl">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-accent/30 shadow-inner shrink-0">
            {user?.profilePic ? (
              <img
                src={user.profilePic}
                alt={user.fullname}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-accent/5">
                <i className="ri-user-line text-accent" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-black text-xs text-foreground truncate leading-tight">
              {user?.fullname}
            </p>
            <p className="text-[9px] font-black text-accent tracking-widest uppercase mt-0.5">
              SELLER PARTNER
            </p>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex flex-col gap-2">
        {menuItems.map((item, index) => (
          <Link
            key={index}
            to={item.path}
            className={[
              "flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black tracking-widest uppercase transition-all duration-300",
              isActive(item.path)
                ? "bg-accent text-accent-content shadow-lg shadow-accent/15 scale-[1.02]"
                : "text-foreground/45 hover:text-foreground hover:bg-white/5 hover:translate-x-1",
            ].join(" ")}
          >
            <i className={`${item.icon} text-base`} />
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default SellerNavbar;
