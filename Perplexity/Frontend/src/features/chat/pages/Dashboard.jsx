import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useChat } from '../hook/useChat'
import Sidebar from '../../Components/Sidebar'
import ChatArea from '../components/ChatArea'
import { RiMenuLine, RiLoginCircleLine, RiUserAddLine, RiSparkling2Line } from '@remixicon/react'
import { setError } from '../chat.slice'
import { useDispatch } from 'react-redux'
import { Link } from 'react-router'
import PerplexityIcon from '../../Components/PerplexityIcon'
import { addToast } from '../../../utils/toast.slice'

const Dashboard = () => {
    const { user } = useSelector(state => state.auth)
    const error = useSelector(state => state.chat.error)
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
        <div className="flex bg-[#f4f5f7] dark:bg-[#050505] min-h-screen text-zinc-900 dark:text-zinc-100 overflow-hidden font-sans selection:bg-[#60A6AF]/30">
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />


            <div className={`flex-1 flex flex-col h-[100dvh] overflow-hidden relative lg:pl-56 transition-all duration-300 ${isSidebarOpen ? 'opacity-50 blur-sm pointer-events-none lg:opacity-100 lg:blur-none lg:pointer-events-auto' : ''}`}>

                {/* Header (Responsive: Mobile brand + hamburger + Auth actions) */}
                <header className="flex items-center justify-between px-3 sm:px-6 h-12 sm:h-14 bg-[#f4f5f7]/90 dark:bg-[#050505]/85 backdrop-blur-md shrink-0 z-40 border-b border-zinc-200/80 dark:border-white/5">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-2 -ml-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all rounded-lg active:scale-95 cursor-pointer"
                            aria-label="Open sidebar"
                        >
                            <RiMenuLine size={20} />
                        </button>
                        <div className="lg:hidden flex items-center gap-2">
                            <PerplexityIcon className="w-5 h-5 text-zinc-900 dark:text-white" />
                            <span className="font-bold text-sm text-zinc-900 dark:text-white tracking-tight">Perplexity</span>
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
                                className="px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#20b8cd] hover:bg-[#1da9bc] text-zinc-950 shadow-md shadow-[#20b8cd]/20 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
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