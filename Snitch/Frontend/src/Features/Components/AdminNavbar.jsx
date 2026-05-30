import React from "react";
import { Link, useLocation } from "react-router";
import { useSelector } from "react-redux";
import { useAuth } from "../auth/Hooks/useAuth";

const AdminNavbar = ({ toggleTheme, isDarkMode }) => {
  const { user } = useSelector((state) => state.auth);
  const { handleLogout } = useAuth();
  const location = useLocation();

  const menuItems = [
    { name: "Dashboard", path: "/admin", icon: "ri-dashboard-line" },
    { name: "Users", path: "/admin/users", icon: "ri-team-line" },
    { name: "Categories", path: "/admin/categories", icon: "ri-apps-2-line" },
    { name: "Brands", path: "/admin/brands", icon: "ri-award-line" },
    { name: "Colors", path: "/admin/colors", icon: "ri-palette-line" },
    { name: "Sizes", path: "/admin/sizes", icon: "ri-ruler-line" },
    { name: "Units", path: "/admin/units", icon: "ri-scales-line" },
  ];

  const isActive = (path) => {
    if (path === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="w-64 bg-surface border-r border-border-theme h-screen sticky top-0 flex flex-col justify-between p-6 z-50 flex-shrink-0">
      {/* Logo and Brand */}
      <div>
        <Link to="/admin" className="flex items-center gap-3 mb-8 px-2">
          <span className="w-3 h-3 bg-accent rounded-full animate-ping"></span>
          <span className="text-xl font-black tracking-[0.25em] text-foreground uppercase">
            SNITCH ADM
          </span>
        </Link>

        {/* Profile Header */}
        <div className="flex items-center justify-between p-4 bg-background/50 border border-border-theme/60 rounded-2xl mb-8">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-accent/30 shadow-inner flex-shrink-0">
              <img
                src={user?.profilePic}
                alt={user?.fullname}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="font-black text-xs text-foreground truncate leading-tight">
                {user?.fullname}
              </p>
              <p className="text-[9px] font-black text-accent tracking-widest uppercase mt-0.5">
                PLATFORM ADMIN
              </p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-xl border border-border-theme/60 flex items-center justify-center text-foreground hover:text-accent hover:border-accent/40 bg-surface/50 active:scale-95 transition-all cursor-pointer flex-shrink-0"
            aria-label="Toggle Theme"
          >
            {isDarkMode ? (
              <i className="ri-sun-fill text-sm"></i>
            ) : (
              <i className="ri-moon-fill text-sm"></i>
            )}
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-270px)] scrollbar-hide">
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
      </div>

      {/* Logout Action */}
      <div className="pt-4 border-t border-border-theme/40">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all duration-300 group cursor-pointer"
        >
          <span className="text-xs font-black tracking-widest uppercase">
            Logout
          </span>
          <i className="ri-logout-box-r-line text-lg group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </aside>
  );
};

export default AdminNavbar;
