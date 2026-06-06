import React from "react";
import { Link, useLocation } from "react-router";
import { useSelector } from "react-redux";
import { useAuth } from "../auth/Hooks/useAuth";

const AdminNavbar = ({ toggleTheme, isDarkMode }) => {
  const { user } = useSelector((state) => state.auth);
  const { handleLogout } = useAuth();
  const location = useLocation();

  const { unreadCount } = useSelector((state) => state.messages);

  const menuItems = [
    { name: "Dashboard", path: "/admin", icon: "ri-dashboard-line" },
    { name: "Inbox", path: "/admin/inbox", icon: "ri-inbox-line", badge: unreadCount },
    { name: "Users", path: "/admin/users", icon: "ri-team-line" },
    { name: "Categories", path: "/admin/categories", icon: "ri-apps-2-line" },
    { name: "Brands", path: "/admin/brands", icon: "ri-award-line" },
    { name: "Colors", path: "/admin/colors", icon: "ri-palette-line" },
    { name: "Sizes", path: "/admin/sizes", icon: "ri-ruler-line" },
    { name: "Units", path: "/admin/units", icon: "ri-scales-line" },
    { name: "Settings", path: "/admin/settings", icon: "ri-settings-3-line" },
  ];

  const isActive = (path) => {
    if (path === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="w-64 bg-surface border-r border-border-theme h-full flex flex-col justify-between p-5 z-50 flex-shrink-0">
      <div className="flex flex-col min-h-0 flex-1">

        {/* Profile Card — at the very top */}
        <div className="flex items-center justify-between p-3 bg-background/50 border border-border-theme/60 rounded-2xl mb-6">
          <Link to="/admin" className="flex items-center gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-accent/30 shadow-inner">
                <img
                  src={user?.profilePic}
                  alt={user?.fullname}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Live indicator dot */}
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-accent rounded-full border-2 border-surface animate-pulse"></span>
            </div>
            <div className="min-w-0">
              <p className="font-black text-xs text-foreground truncate leading-tight">
                {user?.fullname}
              </p>
              <p className="text-[9px] font-black text-accent tracking-widest uppercase mt-0.5">
                Platform Admin
              </p>
            </div>
          </Link>
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
        <nav className="flex flex-col gap-1.5 overflow-y-auto flex-1 scrollbar-hide">
          {menuItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className={[
                "flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all duration-200",
                isActive(item.path)
                  ? "bg-accent text-accent-content shadow-lg shadow-accent/15 scale-[1.02]"
                  : "text-foreground/45 hover:text-foreground hover:bg-white/5 hover:translate-x-1",
              ].join(" ")}
            >
              <i className={`${item.icon} text-base flex-shrink-0`} />
              <span className="flex-1">{item.name}</span>
              {item.badge > 0 && (
                <span className="bg-red-500 text-white text-[9px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-black px-1">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </div>

      {/* Logout Action — pinned to bottom */}
      <div className="pt-4 mt-4 border-t border-border-theme/40 flex-shrink-0">
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
