import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useChat } from '../hook/useChat'
import Sidebar from '../../Components/Sidebar'
import ChatArea from '../components/ChatArea'
import { RiMenuLine } from '@remixicon/react'
import Toast from '../../Components/Toast'
import { setError } from '../chat.slice'
import { useDispatch } from 'react-redux'

const Dashboard = () => {
    const { user } = useSelector(state => state.auth)
    const error = useSelector(state => state.chat.error)
    const dispatch = useDispatch()
    const chat = useChat();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        chat.initializeSocketConnection();
    }, [])

    return (
        <div className="flex bg-white dark:bg-[#050505] min-h-screen text-zinc-900 dark:text-zinc-100 overflow-hidden font-sans selection:bg-[#60A6AF]/30">
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            <Toast message={error} type="error" onClose={() => dispatch(setError(null))} />

            <div className={`flex-1 flex flex-col relative lg:pl-56 transition-all duration-300 ${isSidebarOpen ? 'opacity-50 blur-sm pointer-events-none lg:opacity-100 lg:blur-none lg:pointer-events-auto' : ''}`}>

                <header className="lg:hidden flex items-center justify-between px-6 h-14 bg-white dark:bg-[#050505] shrink-0 z-40 border-b border-zinc-200 dark:border-white/5">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 -ml-2 text-zinc-500 hover:text-white transition-all"
                    >
                        <RiMenuLine size={20} />
                    </button>
                    <div className="flex items-center gap-3">
                    </div>
                </header>

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