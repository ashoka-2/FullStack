import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setUser } from '../redux/chatSlice';
import { MessageSquare, ArrowRight } from 'lucide-react';

const Login = ({ socket }) => {
  const [userName, setUserName] = useState('');
  const [error, setError] = useState('');
  const dispatch = useDispatch();

  useEffect(() => {
    socket.on('loginError', (msg) => {
      setError(msg);
    });

    socket.on('loginSuccess', (name) => {
      dispatch(setUser(name));
      setError('');
    });

    return () => {
      socket.off('loginError');
      socket.off('loginSuccess');
    };
  }, [dispatch, socket]);

  const handleLogin = (e) => {
    e.preventDefault();
    const cleanName = userName.trim();
    if (cleanName) {
      setError('');
      socket.emit('login', cleanName);
    }
  };

  return (
    <div className="w-[100vw] h-[100dvh] flex items-center justify-center p-6 bg-bg overflow-hidden">
      <div className="w-full max-w-[420px] bg-surface p-10 md:p-14 rounded-[40px] border border-border shadow-2xl animate-in text-center relative overflow-hidden group">
        
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-20" />
        
        <div className="mb-12">
          <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-accent/20 rotate-3 group-hover:rotate-0 transition-transform duration-500">
            <MessageSquare size={32} className="text-bg" />
          </div>
          <h1 className="text-4xl font-black text-text tracking-tighter mb-2">chatMe</h1>
          <p className="text-textDim text-sm font-medium tracking-wide uppercase opacity-60">Elevate your conversations</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="relative">
            <input
              type="text"
              placeholder="Your digital alias"
              value={userName}
              onChange={(e) => {
                setUserName(e.target.value);
                if(error) setError('');
              }}
              className="w-full px-6 py-4 rounded-2xl bg-bg border border-border text-text outline-none text-center font-bold placeholder:text-textDim/50 placeholder:font-normal focus:border-accent/40 transition-all shadow-inner"
              required
            />
          </div>
          
          {error && (
            <div className="py-2 px-4 bg-red-500/10 border border-red-500/20 rounded-xl">
               <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">{error}</p>
            </div>
          )}

          <button 
            type="submit" 
            className="w-full py-5 bg-accent text-bg rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 hover:translate-y-[-2px] active:scale-95 transition-all shadow-xl shadow-accent/10"
          >
            Enter Lounge
            <ArrowRight size={18} />
          </button>
        </form>

        <p className="mt-12 text-[10px] text-textDim font-bold tracking-[3px] uppercase opacity-40">Secure • Real-time • Minimal</p>
      </div>
    </div>
  );
};

export default Login;
