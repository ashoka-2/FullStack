import React from 'react';
import { Globe, Search, User as UserIcon, Sun, Moon, ChevronLeft } from 'lucide-react';

const Sidebar = ({ 
  showMobileSidebar, setShowMobileSidebar, user, theme, handleToggleTheme, 
  dispatch, setSelectedUser, selectedUser, searchTerm, setSearchTerm, 
  filteredUsers, notifications, logout 
}) => {
  return (
    <>
      {/* Click-away overlay for mobile (Bahar click karke band karne ke liye) */}
      {showMobileSidebar && (
        <div 
          className="fixed inset-0 bg-black/40 z-[999] md:hidden backdrop-blur-[2px] transition-opacity animate-in"
          onClick={() => setShowMobileSidebar(false)}
        />
      )}
      <div className={`flex flex-col h-full border-r border-border bg-surface transition-transform duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] z-[1000]
        ${showMobileSidebar ? 'translate-x-0 w-[85%] max-w-[320px] absolute top-0 left-0 bg-surface' : 'max-md:-translate-x-full max-md:absolute top-0 left-0 w-[340px] shadow-none'}`}
      >
      <div className="p-6 border-b border-border flex justify-between items-center">
        <h2 className="text-2xl font-black text-text tracking-tight">chatMe</h2>
        <div className="flex gap-2 items-center">
          <button 
            onClick={handleToggleTheme} 
            className="p-2 rounded-full hover:bg-white/5 transition-colors text-text"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button 
            className="md:hidden p-2 text-text" 
            onClick={() => setShowMobileSidebar(false)}
          >
            <ChevronLeft size={24} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
        {/* Global Lobby Link */}
        <div 
          onClick={() => dispatch(setSelectedUser(null))} 
          className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all mb-6
            ${!selectedUser ? 'bg-secondary text-text' : 'text-textDim hover:bg-white/5'}`}
        >
          <Globe size={20} />
          <span className="font-extrabold">Global Lobby</span>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-textDim" />
          <input 
            type="text" 
            placeholder="Search friends..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-bg border border-border text-text outline-none text-sm placeholder:text-textDim focus:border-accent/50 transition-colors"
          />
        </div>

        {/* Online Users List */}
        <h4 className="text-[10px] font-black text-textDim uppercase tracking-widest mb-3 pl-2">Online Now</h4>
        <div className="space-y-1">
          {filteredUsers.map(u => {
            const isActive = selectedUser?.id === u.id;
            return (
              <div 
                key={u.id} 
                onClick={() => dispatch(setSelectedUser(u))} 
                className={`flex items-center justify-between p-3 px-4 rounded-xl cursor-pointer transition-all border
                  ${isActive ? 'bg-secondary border-border text-text' : 'border-transparent text-text hover:bg-white/5'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${u.isBusy ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'}`} />
                  <span className="font-semibold text-sm">{u.username}</span>
                </div>
                {notifications[u.username.toLowerCase()] > 0 && (
                  <div className="bg-accent text-bg text-[10px] font-black px-2 py-0.5 rounded-full">
                    {notifications[u.username.toLowerCase()]}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Profile & Logout */}
      <div className="p-5 border-t border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center shadow-lg shadow-accent/20">
            <UserIcon size={20} className="text-bg" />
          </div>
          <div>
            <p className="font-black text-text text-base leading-tight uppercase">{user}</p>
            <p className="text-[10px] text-green-500 font-bold tracking-tighter">STATUS: ACTIVE</p>
          </div>
        </div>
        <button 
          onClick={logout} 
          className="w-full py-3 rounded-xl border border-border text-text font-bold text-sm hover:bg-white/5 transition-all"
        >
          Logout Account
        </button>
      </div>
    </div>
  </>
  );
};

export default Sidebar; // Exporting Sidebar (Sidebar export ho raha hai)
