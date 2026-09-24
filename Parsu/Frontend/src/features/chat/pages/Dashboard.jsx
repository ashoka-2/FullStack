import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useChat } from '../hook/useChat'
import Sidebar from '../../Components/Sidebar'
import ChatArea from '../components/ChatArea'
import { RiMenuLine, RiLoginCircleLine, RiUserAddLine, RiSparkling2Line, RiSideBarLine } from '@remixicon/react'
import { setError, toggleSidebarCollapse } from '../chat.slice'
import { useDispatch } from 'react-redux'
import { Link } from 'react-router'
import ParsuLogo from '../../Components/ParsuLogo'
import { addToast } from '../../../utils/toast.slice'

const Dashboard = () => {
    const { user } = useSelector(state => state.auth)
    const error = useSelector(state => state.chat.error)
    const isSidebarCollapsed = useSelector(state => state.chat.isSidebarCollapsed)
    const dispatch = useDispatch()
    const chat = useChat();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        if (user) {
            chat.initializeSocketConnection();
        }
    }, [user])

    // Dispatch errors as toasts via Redux
    useEffect(() => {
        if (error) {
            dispatch(addToast({ message: error, type: 'error' }));
            dispatch(setError(null));
        }
    }, [error, dispatch])

    return (
        <div className="flex bg-[var(--bg-primary)] h-[100dvh] overflow-hidden text-zinc-900 dark:text-zinc-100 font-sans selection:bg-[var(--color-clear-hanada)]/30">
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            <div className={`flex-1 flex flex-col h-[100dvh] overflow-hidden relative ${isSidebarCollapsed ? 'lg:pl-16' : 'lg:pl-56'} transition-[padding] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isSidebarOpen ? 'opacity-50 blur-sm pointer-events-none lg:opacity-100 lg:blur-none lg:pointer-events-auto' : ''}`}>

                {/* ChatGPT-style Header (Sidebar toggle, Brand, Auth actions) */}
                <header className="flex items-center justify-between px-3 sm:px-6 h-12 sm:h-14 bg-[#0B0B0B]/90 backdrop-blur-md shrink-0 z-40 border-b border-white/[0.08]">
                    <div className="flex items-center gap-2">
                        {/* Mobile sidebar toggle button */}
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-2 -ml-1 text-zinc-400 hover:text-white transition-all rounded-lg active:scale-95 cursor-pointer"
                            aria-label="Open sidebar"
                        >
                            <RiMenuLine size={20} />
                        </button>

                        <div className="flex items-center gap-1.5">
                            <ParsuLogo className="w-5 h-5 text-[var(--accent-cyan)]" />
                            <span className="font-extrabold text-sm text-zinc-900 dark:text-white tracking-tight">PARSU</span>
                            <span className="text-[10px] font-black uppercase tracking-wider text-black bg-[var(--accent-cyan)] px-1 rounded">AI</span>
                        </div>
                    </div>

                    {/* Top Right Guest Bar */}
                    {!user ? (
                        <div className="flex items-center gap-2.5 ml-auto">
                            <Link
                                to="/auth"
                                className="px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-all duration-200 cursor-pointer"
                            >
                                Log in
                            </Link>
                            <Link
                                to="/auth?mode=register"
                                className="px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-[var(--accent-cyan)] hover:bg-[var(--accent-cyan-hover)] text-zinc-950 shadow-md shadow-[var(--accent-cyan)]/20 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
                            >
                                <span>Sign up</span>
                                <RiSparkling2Line size={14} />
                            </Link>
                        </div>
                    ) : (
                        <div className="ml-auto hidden sm:flex items-center gap-2 text-xs text-zinc-500 font-medium">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Connected</span>
                        </div>
                    )}
                </header>

                {/* Constrain container height so ChatArea manages its own custom scrollbar */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    <ChatArea />
                </div>
            </div>

            {isSidebarOpen && (
                <div
                    onClick={() => setIsSidebarOpen(false)}
                    className="lg:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px]"
                />
            )}
        </div>
    )
}

export default Dashboard