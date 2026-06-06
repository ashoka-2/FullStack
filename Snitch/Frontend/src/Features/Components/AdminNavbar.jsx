import React, { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router";
import { useSelector } from "react-redux";
import { useAuth } from "../auth/Hooks/useAuth";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const AdminNavbar = ({ toggleTheme, isDarkMode, isOpen, onClose }) => {
  const { user } = useSelector((state) => state.auth);
  const { handleLogout } = useAuth();
  const location = useLocation();

  const { unreadCount } = useSelector((state) => state.messages);

  const drawerRef = useRef(null);
  const linksRef = useRef([]);
  const tl = useRef(null);

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

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  useGSAP(() => {
    let mm = gsap.matchMedia();

    mm.add("(max-width: 1023px)", () => {
      tl.current = gsap.timeline({ paused: true })
        .to(drawerRef.current, {
          display: "flex",
          clipPath: "circle(150% at 32px 32px)",
          duration: 1.1,
          ease: "power4.inOut",
        })
        .fromTo(
          linksRef.current.filter(Boolean),
          { y: 40, opacity: 0, skewY: 4 },
          { y: 0, opacity: 1, skewY: 0, duration: 0.7, stagger: 0.05, ease: "power4.out" },
          "-=0.6"
        );
    });

    return () => {
      mm.revert();
    };
  }, { scope: drawerRef });

  useEffect(() => {
    if (window.innerWidth < 1024) {
      if (isOpen) {
        tl.current?.play();
        document.body.style.overflow = "hidden";
      } else {
        tl.current?.reverse();
        document.body.style.overflow = "unset";
      }
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <>
      <style>{`
        @media (max-width: 1023px) {
          .admin-sidebar-mobile-clip {
            clip-path: circle(0% at 32px 32px);
            display: none;
          }
        }
      `}</style>
      <aside
        ref={drawerRef}
        className={`fixed inset-0 lg:inset-y-0 lg:left-0 w-full lg:w-64 bg-background lg:bg-surface border-r border-border-theme h-full flex flex-col justify-between p-6 lg:p-5 z-[1500] lg:z-50 lg:static flex-shrink-0 admin-sidebar-mobile-clip hidden lg:flex`}
      >
        <div className="flex flex-col min-h-0 flex-1 relative z-10">
          {/* Subtle Brand Watermark Background - Mobile Only */}
          <div className="absolute inset-0 pointer-events-none hidden max-lg:flex items-center justify-center opacity-[0.03] select-none z-0">
            <h1 className="text-[14vw] font-black tracking-tighter text-foreground">SNITCH</h1>
          </div>

          {/* Profile Card — at the very top */}
          <div
            ref={(el) => (linksRef.current[0] = el)}
            className="flex items-center justify-between p-3 bg-surface/50 border border-border-theme/60 lg:bg-background/50 rounded-2xl mb-6 gap-2 opacity-0 lg:opacity-100 z-10"
          >
            <Link to="/admin" onClick={handleLinkClick} className="flex items-center gap-3 min-w-0">
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
                  Admin
                </p>
              </div>
            </Link>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={toggleTheme}
                className="w-10 h-10 lg:w-7 lg:h-7 rounded-xl lg:rounded-lg border border-border-theme/60 flex items-center justify-center text-foreground hover:text-accent hover:border-accent/40 bg-surface/50 active:scale-95 transition-all cursor-pointer"
                aria-label="Toggle Theme"
              >
                {isDarkMode ? (
                  <i className="ri-sun-fill text-base lg:text-xs"></i>
                ) : (
                  <i className="ri-moon-fill text-base lg:text-xs"></i>
                )}
              </button>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl border border-border-theme/60 lg:hidden flex items-center justify-center text-foreground hover:text-accent hover:border-accent/40 bg-surface/50 active:scale-95 transition-all cursor-pointer"
                aria-label="Close Sidebar"
              >
                <i className="ri-close-line text-lg"></i>
              </button>
            </div>
          </div>

          {/* Mobile Nav Links */}
          <nav className="flex flex-col gap-3.5 overflow-y-auto flex-1 scrollbar-hide max-lg:justify-center relative z-10 lg:hidden">
            {menuItems.map((item, index) => (
              <Link
                key={index}
                to={item.path}
                onClick={handleLinkClick}
                ref={(el) => (linksRef.current[index + 1] = el)}
                className={[
                  "group relative flex items-baseline gap-4 py-1.5 opacity-0 select-none",
                  isActive(item.path)
                    ? "text-accent"
                    : "text-foreground/50 hover:text-foreground",
                ].join(" ")}
              >
                <span className="text-[10px] font-bold text-accent font-mono tracking-widest">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="overflow-hidden flex-1 flex justify-between items-center group-hover:pl-2 transition-all duration-500">
                  <h2 className="text-2xl sm:text-4xl font-black tracking-tighter uppercase group-hover:italic transition-all duration-500">
                    {item.name}
                  </h2>
                  {item.badge > 0 ? (
                    <span className="bg-red-500 text-white text-[9px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-black px-1">
                      {item.badge}
                    </span>
                  ) : (
                    <i className="ri-arrow-right-up-line text-lg text-border-theme/40 opacity-0 group-hover:opacity-100 group-hover:rotate-45 transition-all duration-500"></i>
                  )}
                </div>
              </Link>
            ))}
          </nav>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex flex-col gap-1.5 overflow-y-auto flex-1 scrollbar-hide">
            {menuItems.map((item, index) => (
              <Link
                key={index}
                to={item.path}
                onClick={handleLinkClick}
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
        <div
          ref={(el) => (linksRef.current[menuItems.length + 1] = el)}
          className="pt-4 mt-4 border-t border-border-theme/40 flex-shrink-0 opacity-0 lg:opacity-100 z-10"
        >
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all duration-300 group cursor-pointer"
          >
            <span className="text-xs font-black tracking-widest uppercase">Logout</span>
            <i className="ri-logout-box-r-line text-lg group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminNavbar;
