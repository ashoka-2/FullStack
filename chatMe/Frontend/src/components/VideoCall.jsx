import React, { useState, useEffect, useRef } from 'react';
import Draggable from 'react-draggable';
import { 
  Mic, MicOff, Camera, CameraOff, PhoneOff, RefreshCw, 
  Maximize2, Minimize2, User as UserIcon, Volume2, 
  Smartphone, Speaker
} from 'lucide-react';

const VideoCall = ({ 
  callType, myStream, remoteStream, isCalling, callAccepted, 
  leaveCall, switchCamera, toggleMute, toggleCamera, 
  isMuted, isCameraOff 
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const myVideo = useRef();
  const remoteVideo = useRef();
  const nodeRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (myStream && myVideo.current) {
        myVideo.current.srcObject = myStream;
    }
  }, [myStream, isMinimized, isCalling]);

  useEffect(() => {
    if (remoteStream && remoteVideo.current) {
        remoteVideo.current.srcObject = remoteStream;
    }
  }, [remoteStream, isMinimized, callAccepted]);

  const toggleSpeaker = () => {
    if (remoteVideo.current) {
        setIsSpeakerOn(!isSpeakerOn);
        remoteVideo.current.volume = isSpeakerOn ? 0.3 : 1.0; 
    }
  };

  if (!isCalling && !callAccepted) return null;

  return (
    <Draggable 
      nodeRef={nodeRef} 
      handle=".drag-handle"
      disabled={isMobile && !isMinimized} // Full screen pe dragging band
      bounds="parent"
    >
      <div 
        ref={nodeRef}
        className={`fixed z-[2000] overflow-hidden bg-black flex flex-col transition-all duration-300 shadow-2xl border border-border
          ${isMinimized 
            ? (isMobile ? 'w-24 h-32 bottom-20 right-4 rounded-xl' : 'w-48 h-64 bottom-24 right-8 rounded-2xl') 
            : (isMobile ? 'inset-0 w-full h-full rounded-none top-0 left-0 no-transform' : 'w-80 h-[480px] bottom-28 right-8 rounded-[32px]')
          }`}
      >
        <div className="relative flex-1 bg-black overflow-hidden">
          {/* Draggable Handle (Sirf video area se drag hoga) */}
          <div className="absolute inset-0 cursor-move z-10 drag-handle" />
          
          {/* Toggle Minimize/Maximize */}
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className="absolute top-4 left-4 z-[100] bg-black/50 text-white p-2.5 rounded-2xl hover:bg-black/70 transition-colors backdrop-blur-md border border-white/10 pointer-events-auto"
          >
            {isMinimized ? <Maximize2 size={isMobile ? 14 : 20}/> : <Minimize2 size={20}/>}
          </button>

          {/* Remote Video (Opponent) */}
          <video 
              playsInline 
              ref={remoteVideo} 
              autoPlay 
              className={`w-full h-full object-cover pointer-events-none transition-all ${callType === 'video' ? 'block' : 'hidden'}`}
          />

          {/* Audio Call UI */}
          {callType === 'audio' && (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-black">
              <div className={`p-5 rounded-full bg-white/5 border border-white/10 ${!isMinimized ? 'pulse-animation' : ''}`}>
                  <UserIcon size={isMinimized ? (isMobile ? 24 : 40) : 80} className="text-accent" />
              </div>
              {!isMinimized && (
                  <div className="mt-5 text-center px-4">
                      <span className="text-white font-bold tracking-[2px] text-xs uppercase">Voice Call Active</span>
                      {!isMobile && <p className="text-textDim text-[10px] mt-1">CRYSTAL CLEAR AUDIO</p>}
                  </div>
              )}
            </div>
          )}

          {/* Local Video Thumbnail (PiP) */}
          {callType === 'video' && myStream && (
            <video 
              playsInline muted ref={myVideo} autoPlay 
              className={`absolute bottom-3 right-3 rounded-xl border border-white/30 object-cover z-20 shadow-xl transition-all
                ${isMinimized 
                  ? (isMobile ? 'hidden' : 'w-14 h-20') // Mobile minimized pe hide kar rahe hain
                  : (isMobile ? 'w-24 h-32' : 'w-24 h-32')
                }`} 
            />
          )}

          {/* Connecting State */}
          {!callAccepted && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-white font-black z-50 tracking-widest text-[10px] uppercase animate-pulse">
              {isMinimized ? '...' : 'SECURE CONNECTING'}
            </div>
          )}
        </div>

        {/* Video Controls (Minimized mobile pe hide kar rahe hain) */}
        {!(isMobile && isMinimized) && (
          <div className={`relative z-30 pointer-events-auto flex items-center justify-center bg-black/90 backdrop-blur-xl transition-all border-t border-white/5
            ${isMinimized ? 'p-2 gap-2' : 'p-6 gap-[5%] md:gap-4'}
            ${!isMinimized && isMobile ? 'pb-8 pt-4' : ''}`}
          >
            <button 
              onClick={(e) => { e.stopPropagation(); toggleMute(); }} 
              className={`flex items-center justify-center rounded-full transition-all text-white bg-white/5 hover:bg-white/10
                ${isMinimized ? 'w-9 h-9' : 'w-14 h-14 md:w-16 md:h-16'}
                ${isMuted ? '!bg-red-500 hover:!bg-red-600 shadow-lg shadow-red-500/20' : ''}`}
            >
              {isMuted ? <MicOff size={isMinimized ? 14 : 24}/> : <Mic size={isMinimized ? 14 : 24}/>}
            </button>
            
            {callType === 'video' && (
              <>
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleCamera(); }} 
                  className={`flex items-center justify-center rounded-full transition-all text-white bg-white/5 hover:bg-white/10
                    ${isMinimized ? 'w-9 h-9' : 'w-14 h-14 md:w-16 md:h-16'}
                    ${isCameraOff ? '!bg-gray-700' : ''}`}
                >
                  {isCameraOff ? <CameraOff size={isMinimized ? 14 : 24}/> : <Camera size={isMinimized ? 14 : 24}/>}
                </button>
                {!isMinimized && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); switchCamera(); }} 
                    className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-all text-white"
                  >
                    <RefreshCw size={24}/>
                  </button>
                )}
              </>
            )}

            {/* Speaker Toggle - Fixed Icon */}
            {!isMinimized && (
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleSpeaker(); }} 
                  className={`w-14 h-14 md:w-16 md:h-16 flex items-center justify-center rounded-full transition-all text-white
                    ${isSpeakerOn ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-white/5'}`}
                >
                    {isSpeakerOn ? <Volume2 size={24} /> : <Smartphone size={24} />}
                </button>
            )}

            <button 
              onClick={(e) => { e.stopPropagation(); leaveCall(); }} 
              className={`flex items-center justify-center rounded-full bg-red-500 hover:bg-red-600 transition-all text-white shadow-lg shadow-red-500/20
                ${isMinimized ? 'w-9 h-9' : 'w-14 h-14 md:w-16 md:h-16'}`}
            >
              <PhoneOff size={isMinimized ? 14 : 24}/>
            </button>
          </div>
        )}
      </div>
    </Draggable>
  );
};

export default VideoCall;
