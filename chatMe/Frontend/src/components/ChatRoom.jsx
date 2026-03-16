import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Send, MessageCircle, Menu, Video, Phone, User as UserIcon, Sun, Moon, X } from 'lucide-react';
import { setSelectedUser, logout, toggleTheme } from '../redux/chatSlice';

// Extra components & hooks
import { useWebRTC } from '../hooks/useWebRTC';
import Sidebar from './Sidebar';
import VideoCall from './VideoCall';

const ChatRoom = ({ socket }) => {
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); // Search state (search state ke liye)
  
  const dispatch = useDispatch();
  const { user, messages, privateMessages, onlineUsers, selectedUser, notifications, theme } = useSelector((state) => state.chat);
  const scrollRef = useRef();

  // Custom Hook for WebRTC logic
  const { 
    myStream, remoteStream, receivingCall, caller, callAccepted, callType, isCalling,
    startCall, answerCall, leaveCall, switchCamera, setReceivingCall
  } = useWebRTC(socket, selectedUser, user);

  // States for local controls
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  const toggleMute = () => {
    if (myStream) {
      const audioTrack = myStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        setIsMuted(!isMuted);
      }
    }
  };

  const toggleCamera = () => {
    if (myStream && callType === 'video') {
      const videoTrack = myStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = isCameraOff;
        setIsCameraOff(!isCameraOff);
      }
    }
  };

  const filteredUsers = onlineUsers.filter(u => 
    u.username.toLowerCase() !== user.toLowerCase() &&
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  ); // Filter users based on search (user search ke hisab se filter)

  const currentMessages = selectedUser 
    ? (privateMessages[selectedUser.username.toLowerCase()] || []) 
    : messages;

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, privateMessages, selectedUser]);

  return (
    <div className="w-[100vw] h-[100dvh] flex items-center justify-center animate-in overflow-hidden p-0 md:p-8 bg-bg">
      <div className="w-full h-full max-w-[1400px] md:h-[90vh] flex relative bg-surface md:rounded-[32px] md:border border-border shadow-2xl overflow-hidden">
        
        {/* Error Popup */}
        {errorMsg && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[6000] flex items-center gap-3 bg-red-500 text-white px-6 py-3 rounded-2xl shadow-xl animate-bounce">
            <span className="font-bold text-sm tracking-wide uppercase">{errorMsg}</span>
            <button onClick={() => setErrorMsg('')} className="hover:rotate-90 transition-transform"><X size={18} /></button>
          </div>
        )}

        {/* Incoming Call Overlay */}
        {receivingCall && !callAccepted && (
          <div className="absolute inset-0 bg-black/95 z-[5000] flex items-center justify-center p-6 backdrop-blur-sm">
            <div className="bg-surface p-10 py-12 rounded-[40px] border border-border text-center w-full max-w-[380px] shadow-2xl">
               <div className="w-24 h-24 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/5 shadow-inner">
                  <UserIcon size={48} className="text-accent" />
               </div>
               <h2 className="text-2xl font-black text-text mb-2 uppercase tracking-tight">
                {onlineUsers.find(u => u.id === caller)?.username || "Unknown"}
               </h2>
               <p className="text-textDim font-bold text-xs tracking-widest uppercase mb-10">Incoming {callType} Call</p>
               <div className="flex gap-4">
                  <button 
                    onClick={answerCall} 
                    className="flex-1 bg-green-500 hover:bg-green-600 active:scale-95 transition-all text-white py-5 rounded-2xl font-black uppercase text-sm"
                  >
                    Answer
                  </button>
                  <button 
                    onClick={() => { socket.emit("endCall", {to: caller}); setReceivingCall(false); }} 
                    className="flex-1 bg-red-500 hover:bg-red-600 active:scale-95 transition-all text-white py-5 rounded-2xl font-black uppercase text-sm"
                  >
                    Decline
                  </button>
               </div>
            </div>
          </div>
        )}

        {/* Reusable Video Component */}
        <VideoCall 
          callType={callType}
          myStream={myStream}
          remoteStream={remoteStream}
          isCalling={isCalling}
          callAccepted={callAccepted}
          leaveCall={leaveCall}
          switchCamera={switchCamera}
          toggleMute={toggleMute}
          toggleCamera={toggleCamera}
          isMuted={isMuted}
          isCameraOff={isCameraOff}
        />

        <Sidebar 
          showMobileSidebar={showMobileSidebar}
          setShowMobileSidebar={setShowMobileSidebar}
          user={user}
          theme={theme}
          handleToggleTheme={() => dispatch(toggleTheme())}
          dispatch={dispatch}
          setSelectedUser={setSelectedUser}
          selectedUser={selectedUser}
          searchTerm={searchTerm} // Pass searchTerm state (searchTerm state pass karein)
          setSearchTerm={setSearchTerm} // Pass setSearchTerm function (setSearchTerm function pass karein)
          filteredUsers={filteredUsers} // Pass filtered users (filtered users pass karein)
          notifications={notifications}
          logout={() => dispatch(logout())}
        />

        <div className="flex-1 flex flex-col bg-bg min-w-0 h-full relative">
          {/* Header */}
          <div className="p-5 px-6 border-b border-border flex justify-between items-center bg-surface/80 backdrop-blur-xl z-10 sticky top-0">
            <div className="flex items-center gap-4">
              <button 
                className="md:hidden text-text p-1" 
                onClick={() => setShowMobileSidebar(true)}
              >
                <Menu size={24} />
              </button>
              <div>
                <h3 className="font-black text-text text-lg uppercase tracking-tight">
                  {selectedUser ? `@${selectedUser.username}` : '# Global Lobby'}
                </h3>
                <p className="text-[10px] text-textDim font-bold tracking-[2px] uppercase">
                  {selectedUser ? 'End-to-end Private' : 'Open Community'}
                </p>
              </div>
            </div>
            <div className="flex gap-3 items-center">
              <button 
                onClick={() => dispatch(toggleTheme())} 
                className="md:hidden text-text p-2 hover:bg-white/5 rounded-full transition-colors"
              >
                {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
              </button>
              {selectedUser && (
                <>
                  <button 
                    onClick={() => startCall('audio')} 
                    className="p-3 bg-white/5 border border-border text-text rounded-2xl hover:bg-white/10 transition-all hover:-translate-y-0.5"
                  >
                    <Phone size={20} />
                  </button>
                  <button 
                    onClick={() => startCall('video')} 
                    className="p-3 bg-accent text-bg rounded-2xl hover:scale-105 transition-all shadow-lg shadow-accent/20"
                  >
                    <Video size={20} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4 custom-scrollbar">
            {currentMessages.length === 0 && (
              <div className="flex-1 h-full flex flex-col items-center justify-center opacity-10 blur-[0.5px]">
                <MessageCircle size={100} className="text-text mb-4" />
                <p className="font-black text-2xl tracking-[4px] uppercase">NO SIGNALS</p>
              </div>
            )}
            {currentMessages.map((msg, idx) => {
              const isMe = (msg.user?.toLowerCase() === user.toLowerCase()) || (msg.from?.toLowerCase() === user.toLowerCase());
              return (
                <div key={idx} className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}>
                  <p className="text-[9px] text-textDim mb-1 font-bold group-hover:opacity-100 opacity-60 transition-opacity uppercase tracking-widest">
                    {isMe ? 'Sent by you' : msg.user || msg.from} • {msg.time}
                  </p>
                  <div className={`px-5 py-3.5 text-sm leading-relaxed max-w-[85%] md:max-w-[70%] break-words shadow-sm transition-transform hover:scale-[1.01]
                    ${isMe ? 'bg-accent text-bg rounded-[22px] rounded-br-[4px]' : 'bg-secondary text-text rounded-[22px] rounded-bl-[4px] border border-border'}`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}
            <div ref={scrollRef}></div>
          </div>

          {/* Input Area (Message bar fixed for mobile) */}
          <div className="p-4 md:p-8 pt-0">
            <form 
              className="flex items-center gap-2 bg-surface p-1.5 md:p-2 pr-2 md:pr-2 rounded-2xl md:rounded-3xl border border-border shadow-2xl shadow-black/20 focus-within:border-accent/30 transition-all"
              onSubmit={(e) => {
                e.preventDefault();
                if (message.trim()) {
                  if (selectedUser) socket.emit('sendPrivateMessage', { to: selectedUser, text: message });
                  else socket.emit('sendMessage', message);
                  setMessage('');
                }
              }}
            >
              <input 
                type="text" 
                placeholder="Compose your message..." 
                className="flex-1 bg-transparent px-4 md:px-5 py-2.5 md:py-3 text-text outline-none text-sm md:text-base placeholder:text-textDim/60 placeholder:italic" 
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
              />
              <button 
                type="submit" 
                className="bg-accent text-bg w-10 h-10 md:w-auto md:px-6 rounded-xl md:rounded-[20px] font-black uppercase tracking-tight flex items-center justify-center hover:scale-[1.05] active:scale-95 transition-all shadow-lg shadow-accent/10 shrink-0"
              >
                <Send size={18} className="md:size-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
