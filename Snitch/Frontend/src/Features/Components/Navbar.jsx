import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router';
import { useAuth } from '../auth/Hook/useAuth';

const Navbar = ({ toggleTheme, isDarkMode }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const { handleLogout } = useAuth();

  return (
    <nav className="flex items-center justify-between font-medium text-sm relative">
      <div className="hidden md:flex gap-8">
        <a href="/" className="hover:text-accent transition-colors font-semibold tracking-wide">Shop</a>
        <a href="#" className="hover:text-accent transition-colors font-semibold tracking-wide">Collections</a>
        <a href="#" className="hover:text-accent transition-colors font-semibold tracking-wide">About</a>
        <a href="#" className="hover:text-accent transition-colors font-semibold tracking-wide">Contact</a>
      </div>

      {/* Mobile Menu Button */}
      <button 
        className="md:hidden p-2 -ml-2 text-foreground"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? (
          <i className="ri-close-line text-2xl font-normal"></i>
        ) : (
          <i className="ri-menu-line text-2xl font-normal"></i>
        )}
      </button>
      
      {/* Brand Logo */}
      <Link to="/" className="absolute left-1/2 -translate-x-1/2 text-3xl font-black tracking-widest uppercase text-foreground hover:text-accent transition-colors">
        SNITCH
      </Link>
      
      <div className="flex items-center gap-3 lg:gap-6">
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme} 
          className="hover:text-accent transition-colors p-2 text-foreground"
          aria-label="Toggle Dark Mode"
        >
          {isDarkMode ? (
             <i className="ri-sun-line text-xl"></i>
          ) : (
             <i className="ri-moon-line text-xl"></i>
          )}
        </button>

        {/* Search */}
        <button className="hover:text-accent transition-colors hidden sm:block p-2 text-foreground">
          <i className="ri-search-line text-xl"></i>
        </button>

        {/* Profile / Login */}
        {user ? (
          <div className="relative">
            <button 
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="w-9 h-9 rounded-full overflow-hidden border-2 border-transparent hover:border-accent transition-colors hidden sm:block shadow-lg"
            >
              <img src={user.profilePic} alt="Profile" className="w-full h-full object-cover"/>
            </button>
            
            {profileMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-surface border border-border-theme rounded-xl shadow-2xl py-2 z-50 animate-in fade-in transition-all">
                <div className="px-4 py-2 border-b border-border-theme mb-2">
                  <p className="text-xs text-gray-400">Signed in as</p>
                  <p className="font-bold truncate">{user.fullname}</p>
                </div>
                <Link to="/profile" className="block px-4 py-2 hover:bg-accent/10 hover:text-accent transition-colors">Your Profile</Link>
                <Link to="/orders" className="block px-4 py-2 hover:bg-accent/10 hover:text-accent transition-colors">Orders</Link>
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 hover:bg-red-500/10 hover:text-red-500 transition-colors border-t border-border-theme mt-2"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link 
            to="/login"
            className="hidden sm:flex items-center gap-2 px-5 py-2 bg-foreground text-background dark:bg-accent dark:text-accent-content rounded-full font-bold hover:scale-105 active:scale-95 transition-all text-xs tracking-wider"
          >
            LOGIN
          </Link>
        )}
        
        {/* Cart Button */}
        <button className="flex items-center gap-2 border-2 border-accent text-accent dark:text-accent-content bg-accent/10 dark:bg-accent rounded-full pl-1 pr-4 py-1 hover:bg-accent hover:text-accent-content transition-all group font-bold">
          <div className="bg-accent text-accent-content dark:bg-background dark:text-accent p-1.5 rounded-full group-hover:bg-accent-content group-hover:text-accent transition-all flex items-center justify-center">
             <i className="ri-shopping-bag-3-fill text-sm"></i>
          </div>
          <span className="text-xs">1</span>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-[60px] bg-background/95 backdrop-blur-xl z-40 p-10 flex flex-col gap-8 md:hidden">
          <Link to="/" className="text-4xl font-bold tracking-tighter hover:text-accent transition-colors">SHOP</Link>
          <a href="#" className="text-4xl font-bold tracking-tighter hover:text-accent transition-colors">COLLECTIONS</a>
          <a href="#" className="text-4xl font-bold tracking-tighter hover:text-accent transition-colors">ABOUT</a>
          <a href="#" className="text-4xl font-bold tracking-tighter hover:text-accent transition-colors">CONTACT</a>
          {!user && (
            <Link to="/login" className="text-4xl font-bold tracking-tighter text-accent transition-colors">LOGIN</Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
