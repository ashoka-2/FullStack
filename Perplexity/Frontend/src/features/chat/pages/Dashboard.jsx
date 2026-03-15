import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useChat } from '../hook/useChat'
import Sidebar from '../../Components/Sidebar'
import ChatArea from '../components/ChatArea'
import { RiMenuLine } from '@remixicon/react'

const Dashboard = () => {
    const { user } = useSelector(state => state.auth)
    const chat = useChat();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        chat.initializeSocketConnection();
    }, [])

    return (
        <div className="flex bg-[#050505] min-h-screen text-zinc-100 overflow-hidden font-sans selection:bg-[#60A6AF]/30">
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            <div className={`flex-1 flex flex-col relative lg:pl-56 transition-all duration-300 ${isSidebarOpen ? 'opacity-50 blur-sm pointer-events-none lg:opacity-100 lg:blur-none lg:pointer-events-auto' : ''}`}>

                <header className="lg:hidden flex items-center justify-between px-6 h-14 bg-[#050505] shrink-0 z-40 border-b border-white/5">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 -ml-2 text-zinc-500 hover:text-white transition-all"
                    >
                        <RiMenuLine size={20} />
                    </button>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-[#60A6AF] to-[#4a8a92] text-zinc-950 font-bold text-[10px] uppercase tracking-widest rounded-full shadow-lg shadow-[#60A6AF]/5">
                            Pro
                        </button>
                    </div>
                </header>

                <div className="hidden lg:block absolute top-8 right-8 z-30">
                    <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#60A6AF] to-[#4a8a92] text-zinc-950 font-bold text-xs uppercase tracking-widest rounded-full transition-all hover:scale-105 shadow-xl shadow-[#60A6AF]/10">
                        Try Pro
                    </button>
                </div>

                <div className="flex-1 flex flex-col items-center responsive-container py-4">
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