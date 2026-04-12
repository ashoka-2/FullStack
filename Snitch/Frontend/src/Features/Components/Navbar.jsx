import React, { useState } from 'react';

const Navbar = ({ toggleTheme, isDarkMode }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="flex items-center justify-between font-medium text-sm relative">
      <div className="hidden md:flex gap-8">
        <a href="#" className="hover:text-accent transition-colors font-semibold tracking-wide">Shop</a>
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
      <div className="absolute left-1/2 -translate-x-1/2 text-3xl font-black tracking-widest uppercase text-foreground">
        SNITCH
      </div>
      
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

        {/* Profile */}
        <button className="w-9 h-9 rounded-full overflow-hidden border-2 border-transparent hover:border-accent transition-colors hidden sm:block">
          <img src="https://i.pravatar.cc/100?img=5" alt="Profile" className="w-full h-full object-cover"/>
        </button>
        
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
        <div className="absolute top-full left-0 w-full mt-4 bg-surface dark:bg-surface p-4 rounded-2xl shadow-xl z-50 flex flex-col gap-4 md:hidden border border-border-theme">
          <a href="#" className="hover:text-accent transition-colors font-semibold tracking-wide py-2 border-b border-border-theme">Shop</a>
          <a href="#" className="hover:text-accent transition-colors font-semibold tracking-wide py-2 border-b border-border-theme">Collections</a>
          <a href="#" className="hover:text-accent transition-colors font-semibold tracking-wide py-2 border-b border-border-theme">About</a>
          <a href="#" className="hover:text-accent transition-colors font-semibold tracking-wide py-2">Contact</a>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
