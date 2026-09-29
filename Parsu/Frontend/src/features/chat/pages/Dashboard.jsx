import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useChat } from '../hook/useChat'
import Sidebar from '../../Components/Sidebar'
import ChatArea from '../components/ChatArea'
import { setError } from '../chat.slice'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'
import { addToast } from '../../../utils/toast.slice'
import ChatNavbar from '../components/ChatNavbar'

const Dashboard = () => {
    const { user } = useSelector(state => state.auth)
    const error = useSelector(state => state.chat.error)
    const isSidebarCollapsed = useSelector(state => state.chat.isSidebarCollapsed)
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const chat = useChat();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        if (user) {
            if (user.role === 'admin') {
                navigate('/admin/dashboard', { replace: true });
                return;
            }
            chat.initializeSocketConnection();
        }
    }, [user, navigate])

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

            <div className={`flex-1 flex flex-col h-[100dvh] overflow-hidden relative ${isSidebarCollapsed ? 'lg:pl-16' : 'lg:pl-56'} transition-[padding] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]`}>

                {/* ChatGPT-style Header */}
                <ChatNavbar
                    onOpenSidebar={() => setIsSidebarOpen(true)}
                    showShareButton={false}
                />

                {/* Constrain container height so ChatArea manages its own custom scrollbar */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    <ChatArea />
                </div>
            </div>
        </div>
    )
}

export default Dashboard