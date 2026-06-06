import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useMessages } from "../../Messages/Hooks/useMessages";
import PageLoader from "../../Components/PageLoader";
import { AdminInboxSkeleton } from "../../Components/Skeletons";

const AdminInboxPage = () => {
    const { handleFetchMessages, handleMarkRead, handleDeleteMessage } = useMessages();
    const { messages, unreadCount, loading } = useSelector((state) => state.messages);
    const [activeFilter, setActiveFilter] = useState("all");
    const [selectedMsg, setSelectedMsg] = useState(null);

    useEffect(() => {
        handleFetchMessages();
    }, []);

    const filtered = messages.filter((m) => {
        if (activeFilter === "all") return true;
        if (activeFilter === "contact") return m.type === "contact";
        if (activeFilter === "newsletter") return m.type === "newsletter";
        if (activeFilter === "unread") return !m.isRead;
        return true;
    });

    const handleOpen = (msg) => {
        setSelectedMsg(msg);
        if (!msg.isRead) handleMarkRead(msg._id);
    };

    const handleDelete = (id) => {
        handleDeleteMessage(id);
        if (selectedMsg?._id === id) setSelectedMsg(null);
    };

    const formatTime = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    };

    if (loading && messages.length === 0) {
        return <PageLoader skeleton={AdminInboxSkeleton} />;
    }

    return (
        <div className="p-4 md:p-6 max-w-6xl mx-auto h-[calc(100vh-100px)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-widest text-foreground">Inbox</h1>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">
                        {unreadCount > 0 ? (
                            <span className="text-accent">{unreadCount} unread messages</span>
                        ) : "All caught up!"}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-accent animate-pulse"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Live</span>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
                {[
                    { key: "all", label: "All", icon: "ri-inbox-line" },
                    { key: "contact", label: "Contact", icon: "ri-mail-line" },
                    { key: "newsletter", label: "Newsletter", icon: "ri-newspaper-line" },
                    { key: "unread", label: "Unread", icon: "ri-circle-fill" },
                ].map((f) => (
                    <button
                        key={f.key}
                        onClick={() => setActiveFilter(f.key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeFilter === f.key ? "bg-accent text-accent-content" : "bg-surface border border-border-theme/50 text-gray-400 hover:text-foreground"}`}
                    >
                        <i className={f.icon}></i> {f.label}
                        {f.key === "unread" && unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-black">{unreadCount}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Main Inbox Layout */}
            <div className="flex gap-4 flex-1 min-h-0 overflow-hidden">
                {/* Message List */}
                <div className={`w-full md:w-80 flex-shrink-0 overflow-y-auto scrollbar-hide space-y-2 ${selectedMsg ? "hidden md:block" : "block"}`}>
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                            <i className="ri-inbox-2-line text-4xl mb-3"></i>
                            <p className="text-xs font-bold uppercase tracking-widest">No messages</p>
                        </div>
                    ) : (
                        filtered.map((msg) => (
                            <div
                                key={msg._id}
                                onClick={() => handleOpen(msg)}
                                className={`p-4 rounded-2xl border cursor-pointer transition-all group relative
                                    ${selectedMsg?._id === msg._id
                                        ? "border-accent bg-accent/5 shadow-lg"
                                        : "border-border-theme/50 bg-surface/50 hover:border-accent/40"}`}
                            >
                                {!msg.isRead && (
                                    <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-accent"></span>
                                )}
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${msg.type === "contact" ? "bg-blue-500/10 text-blue-400" : "bg-purple-500/10 text-purple-400"}`}>
                                        {msg.type}
                                    </span>
                                    <span className="text-[9px] text-gray-500">{formatTime(msg.createdAt)}</span>
                                </div>
                                <p className="font-bold text-sm truncate">{msg.name || msg.email}</p>
                                <p className="text-xs text-gray-500 truncate">{msg.subject || msg.email}</p>
                            </div>
                        ))
                    )}
                </div>

                {/* Message Detail Panel */}
                <div className={`flex-1 flex flex-col min-h-0 ${selectedMsg ? "block" : "hidden md:block"}`}>
                    {selectedMsg ? (
                        <div className="bg-surface/50 border border-border-theme/50 rounded-3xl p-6 md:p-8 h-full overflow-y-auto">
                            {/* Back Button for mobile */}
                            <button
                                onClick={() => setSelectedMsg(null)}
                                className="md:hidden flex items-center gap-2 mb-6 text-xs font-black uppercase tracking-widest text-accent hover:underline cursor-pointer"
                            >
                                <i className="ri-arrow-left-line text-base"></i> Back to Inbox
                            </button>

                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                                <div>
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mb-3 inline-block ${selectedMsg.type === "contact" ? "bg-blue-500/10 text-blue-400" : "bg-purple-500/10 text-purple-400"}`}>
                                        {selectedMsg.type}
                                    </span>
                                    <h2 className="text-2xl font-black">{selectedMsg.name || "Anonymous"}</h2>
                                    <a href={`mailto:${selectedMsg.email}`} className="text-accent text-sm hover:underline">{selectedMsg.email}</a>
                                    <p className="text-xs text-gray-500 mt-1">{formatTime(selectedMsg.createdAt)}</p>
                                </div>
                                <div className="flex gap-2">
                                    <a
                                        href={`mailto:${selectedMsg.email}`}
                                        className="w-10 h-10 rounded-xl bg-accent/10 text-accent hover:bg-accent hover:text-accent-content flex items-center justify-center transition-all"
                                        title="Reply via Email"
                                    >
                                        <i className="ri-reply-line"></i>
                                    </a>
                                    <button
                                        onClick={() => handleDelete(selectedMsg._id)}
                                        className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all"
                                        title="Delete"
                                    >
                                        <i className="ri-delete-bin-line"></i>
                                    </button>
                                </div>
                            </div>
                            {selectedMsg.subject && (
                                <div className="mb-4">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Subject</span>
                                    <p className="font-bold mt-1">{selectedMsg.subject}</p>
                                </div>
                            )}
                            {selectedMsg.content && (
                                <div className="bg-background/50 border border-border-theme/30 rounded-2xl p-4 md:p-6">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-3">Message</span>
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedMsg.content}</p>
                                </div>
                            )}
                            {!selectedMsg.content && (
                                <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-6 text-center">
                                    <i className="ri-newspaper-line text-3xl text-purple-400 mb-3 block"></i>
                                    <p className="text-sm font-bold text-gray-500">Newsletter signup from <span className="text-accent">{selectedMsg.email}</span></p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full bg-surface/30 border border-border-theme/50 rounded-3xl text-gray-500 p-6 text-center">
                            <i className="ri-mail-open-line text-5xl mb-4 opacity-30"></i>
                            <p className="text-xs font-black uppercase tracking-[0.3em]">Select a message to read</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminInboxPage;
