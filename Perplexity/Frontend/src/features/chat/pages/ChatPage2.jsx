import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router';
import {
    RiMenuLine,
    RiShareLine
} from '@remixicon/react';
import Sidebar from '../../Components/Sidebar';
import ChatMessage from '../components/ChatMessage';
import FollowUpInput from '../components/FollowUpInput';

const ChatPage2 = () => {
    const { id } = useParams();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [input, setInput] = useState('');
    const [isScrolled, setIsScrolled] = useState(false);
    const scrollerRef = useRef(null);
    const fileInputRef = useRef(null);
    const [files, setFiles] = useState([]);
    const [isUploadMenuOpen, setIsUploadMenuOpen] = useState(false);
    const [isLinkInputOpen, setIsLinkInputOpen] = useState(false);
    const [linkInput, setLinkInput] = useState('');

    useEffect(() => {
        const handleScroll = () => {
            if (scrollerRef.current) {
                setIsScrolled(scrollerRef.current.scrollTop > 10);
            }
        };
        const scroller = scrollerRef.current;
        if (scroller) {
            scroller.addEventListener('scroll', handleScroll);
        }
        return () => {
            if (scroller) {
                scroller.removeEventListener('scroll', handleScroll);
            }
        };
    }, []);

    const conversation = [
        {
            id: 'msg_1',
            role: 'user',
            content: 'sheryians/job'
        },
        {
            id: 'msg_2',
            role: 'assistant',
            content: `Sheryians is a coding school and tech community focused on helping people become job-ready developers, designers, and problem-solvers. sheryians +2

### Core Programs
* Frontend Development
* UI/UX Design & Research
* Backend Engineering
* Job Bootcamp 1.0

The curriculum is designed with industry standards and real-world projects to ensure students gain practical skills.`
        }
    ];

    const removeFile = (index) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    const handleFileUpload = (e) => {
        const uploadedFiles = Array.from(e.target.files);
        setFiles([...files, ...uploadedFiles.map(f => ({ name: f.name, isLink: false }))]);
        setIsUploadMenuOpen(false);
    };

    const handleAddLink = (e) => {
        e.preventDefault();
        if (linkInput.trim()) {
            setFiles([...files, { name: linkInput, isLink: true }]);
            setLinkInput('');
            setIsLinkInputOpen(false);
        }
    };

    return (
        <div className="flex bg-[#050505] min-h-screen text-zinc-100 font-sans selection:bg-[#60A6AF]/30 overflow-hidden">
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            <div className={`flex-1 flex flex-col h-screen lg:pl-56 overflow-hidden relative transition-all duration-300`}>

                {/* Header Container */}
                <header className={`h-14 bg-[#050505] z-30 shrink-0 transition-all duration-300 ${isScrolled ? 'border-b border-zinc-900 shadow-lg bg-[#050505]/95 backdrop-blur-md' : ''}`}>
                    <div className="max-w-fluid mx-auto h-full flex items-center justify-between px-6">
                        <div className="flex items-center gap-4 md:gap-6 overflow-hidden">
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="lg:hidden p-2 -ml-2 text-zinc-500 hover:text-white transition-all"
                            >
                                <RiMenuLine size={20} />
                            </button>
                            <button className="flex items-center gap-2 text-[13px] font-bold text-zinc-100 border-b-2 border-white pb-3 mt-3 shrink-0">
                                Knowledge
                            </button>
                        </div>
                        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-all text-[11px] font-bold text-zinc-200 shrink-0">
                            <RiShareLine size={12} />
                            <span className="hidden sm:inline">Share</span>
                        </button>
                    </div>
                </header>

                <div ref={scrollerRef} className="flex-1 overflow-y-auto px-4 md:px-6 py-8 md:py-16 pb-[300px] custom-scrollbar scroll-smooth">
                    <div className="max-w-fluid mx-auto space-y-12">
                        {conversation.map((msg) => (
                            <ChatMessage key={msg.id} msg={msg} />
                        ))}
                    </div>
                </div>

                <FollowUpInput
                    input={input}
                    setInput={setInput}
                    files={files}
                    removeFile={removeFile}
                    isUploadMenuOpen={isUploadMenuOpen}
                    setIsUploadMenuOpen={setIsUploadMenuOpen}
                    isLinkInputOpen={isLinkInputOpen}
                    setIsLinkInputOpen={setIsLinkInputOpen}
                    linkInput={linkInput}
                    setLinkInput={setLinkInput}
                    handleAddLink={handleAddLink}
                    fileInputRef={fileInputRef}
                    handleFileUpload={handleFileUpload}
                />

                {isSidebarOpen && (
                    <div
                        onClick={() => setIsSidebarOpen(false)}
                        className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
                    />
                )}
            </div>
        </div>
    );
};

export default ChatPage2;
