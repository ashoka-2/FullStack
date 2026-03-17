import React, { useState, useRef, useEffect } from 'react';
import {
  RiArrowRightLine,
  RiRobot2Line,
  RiAddLine,
  RiArrowDownSLine,
  RiMicLine,
  RiFileList3Line,
  RiBookOpenLine,
  RiBriefcaseLine,
  RiHeart2Line,
  RiUploadCloudLine,
  RiCloseLine,
  RiFileTextLine,
  RiAttachment2,
  RiArrowUpLine,
  RiCompass3Line,
  RiGlobalLine,
  RiMagicLine
} from '@remixicon/react';
import { useChat } from '../hook/useChat';
import { useNavigate } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import Toast from '../../Components/Toast';
import { setError } from '../chat.slice';

const ChatArea = () => {
  const [input, setInput] = useState('');
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const { handleSendMessage, handleGetSuggestions, loading } = useChat();
  const error = useSelector(state => state.chat.error);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);

  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      setSuggestionsLoading(true);
      const data = await handleGetSuggestions();
      if (data) setAiSuggestions(data);
      setSuggestionsLoading(false);
    };
    fetchSuggestions();
  }, []);

  const iconMap = {
    global: RiGlobalLine,
    robot: RiRobot2Line,
    file: RiFileList3Line,
    magic: RiMagicLine,
    compass: RiCompass3Line,
    book: RiBookOpenLine,
    heart: RiHeart2Line
  };

  const onSubmit = async (e, text = null) => {
    if (e) e.preventDefault();
    const messageToSend = text || input;
    const file = files[0]; // Sending only the first file for now
    
    if ((!messageToSend.trim() && !file) || loading) return;

    try {
      setInput('');
      setFiles([]);
      const response = await handleSendMessage(messageToSend, null, file);
      if (response && response.chat) {
        navigate(`/chat/${response.chat._id}`);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (e.ctrlKey || e.metaKey || e.shiftKey) {
        return;
      }
      e.preventDefault();
      onSubmit(e);
    }
  };

  const handleFileUpload = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      setFiles(prev => [...prev, ...droppedFiles]);
    }
  };

  return (
    <main className="flex-1 w-full flex flex-col items-center bg-[#050505] relative overflow-x-hidden overflow-y-auto custom-scrollbar pb-32 md:pb-16"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Toast message={error} type="error" onClose={() => dispatch(setError(null))} />

      {/* Drag Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none px-6">
          <div className="bg-[#121212]/80 border-2 border-dashed border-[#60A6AF] rounded-3xl p-12 backdrop-blur-xl flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300 shadow-2xl">
            <RiUploadCloudLine size={64} className="text-[#60A6AF] animate-bounce" />
            <h2 className="text-xl font-bold text-white uppercase tracking-wider">Drop to upload</h2>
          </div>
        </div>
      )}

      <div className="w-full max-w-fluid flex flex-col items-center relative z-10 px-4 md:px-0 pt-12 md:pt-[15vh]">
        <h1 className="text-[3.5rem] md:text-[5.5rem] font-extralight text-white tracking-tighter mb-8 md:mb-12 text-center opacity-90 transition-opacity hover:opacity-100">
          perplexity
        </h1>

        {/* Search Input Box */}
        <div className="w-full md:relative md:block fixed bottom-0 left-0 right-0 z-50 p-4 md:p-0 bg-gradient-to-t from-[#050505] via-[#050505] md:bg-transparent to-transparent">
          <div className={`w-full max-w-[800px] mx-auto bg-[#121212] border ${isDragging ? 'border-[#60A6AF]' : 'border-[#2d2e2e]'} focus-within:border-zinc-700 rounded-[24px] md:rounded-[28px] px-4 md:px-6 py-3.5 md:py-5 transition-all duration-300 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)]`}>

            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1 bg-[#1a1a1a] border border-white/5 rounded-lg animate-in zoom-in duration-300">
                    {file.isLink ? <RiAttachment2 size={12} className="text-[#60A6AF]" /> : <RiFileTextLine size={12} className="text-[#60A6AF]" />}
                    <span className="text-[11px] font-bold text-zinc-300 truncate max-w-[120px]">{file.name}</span>
                    <button onClick={() => removeFile(i)} className="text-zinc-600 hover:text-red-400">
                      <RiCloseLine size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              className="w-full bg-transparent border-none outline-none text-zinc-100 text-[16px] md:text-[18px] placeholder:text-zinc-500 resize-none min-h-[44px] md:min-h-[60px] leading-relaxed font-sans font-medium"
            />

            <div className="flex items-center justify-between mt-4">
              <div className="relative">
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="w-8 h-8 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-all"
                >
                  <RiAddLine size={18} />
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple />
              </div>

              <div className="flex items-center gap-2">
                <button className="p-1.5 text-zinc-500 hover:text-zinc-100 transition-colors">
                  <RiMicLine size={18} />
                </button>

                <button
                  onClick={onSubmit}
                  disabled={!input.trim() && files.length === 0}
                  className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${input.trim() || files.length > 0 ? 'bg-white text-black shadow-lg shadow-white/10' : 'bg-zinc-800 text-zinc-600 opacity-50'}`}
                >
                  <RiArrowUpLine size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Assistant Suggestions Pills */}
          <div className="flex items-center justify-center gap-3 mt-6 px-1 overflow-x-auto no-scrollbar max-w-[800px] mx-auto">
            {suggestionsLoading ? (
              [1, 2, 3, 4].map(i => (
                <div key={i} className="flex-shrink-0 w-24 h-8 rounded-full bg-zinc-900 border border-zinc-800 animate-pulse" />
              ))
            ) : (
                (aiSuggestions?.pills || ['For you', 'Study guide', 'Business', 'Health']).map((pillLabel, i) => {
                const Icon = iconMap[aiSuggestions?.topics?.[i]?.iconType] || RiCompass3Line;
                return (
                  <button 
                    key={i} 
                    onClick={(e) => onSubmit(e, pillLabel)}
                    className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full bg-transparent border border-zinc-800 hover:border-zinc-700 text-zinc-500 text-[13px] font-medium transition-all group"
                  >
                    <Icon size={14} className="text-zinc-500 mr-2 group-hover:text-zinc-300" />
                    <span>{pillLabel}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Suggested Queries List */}
        <div className="w-full max-w-[800px] mt-10 space-y-4">
          {suggestionsLoading ? (
            [1, 2, 3, 4, 5].map(i => (
              <div key={i} className="w-full h-8 bg-zinc-900/50 rounded-lg animate-pulse" />
            ))
          ) : (
            (aiSuggestions?.queries || [
              'Show me latest Flipkart deals',
              'Find online courses to master digital art',
              'Recommend Bollywood movies for a long flight',
              'Show me best practices for CSS Grid and Flexbox',
              'Compare CSS flexbox vs grid layouts'
            ]).map((query, i) => (
              <button 
                key={i} 
                onClick={(e) => onSubmit(e, query)}
                className="w-full text-left px-4 py-2 text-[14px] text-zinc-400 hover:text-zinc-100 transition-all border-b border-zinc-900/50 pb-3 block truncate font-medium"
              >
                {query}
              </button>
            ))
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10 w-full max-w-[800px] mb-20 px-1">
          {suggestionsLoading ? (
            [1, 2, 3, 4].map(i => (
              <div key={i} className="h-[120px] bg-zinc-900/30 border border-white/5 rounded-2xl animate-pulse" />
            ))
          ) : (
            (aiSuggestions?.topics || [
              { label: 'Advancements in Fusion Energy', desc: 'Science · 4h ago', iconType: 'global' },
              { label: 'Build AI agents with Node.js', desc: 'Tutorial · Today', iconType: 'robot' },
              { label: 'Deep dive into tech layoffs', desc: 'Business · 1d ago', iconType: 'file' },
              { label: 'The 3-body problem explained', desc: 'Physics · 6h ago', iconType: 'magic' }
            ]).map((topic, i) => {
              const Icon = iconMap[topic.iconType] || RiMagicLine;
              return (
                <button 
                    key={i} 
                    onClick={(e) => onSubmit(e, topic.label)}
                    className="flex flex-col gap-3 p-5 bg-zinc-900/30 border border-white/5 rounded-2xl hover:border-zinc-800 hover:bg-zinc-800/30 transition-all text-left group"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center">
                      <Icon className="text-zinc-600 group-hover:text-zinc-400" size={18} />
                    </div>
                    <RiArrowRightLine size={14} className="text-zinc-800 group-hover:text-zinc-500 mr-1" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-zinc-200 group-hover:text-white transition-colors leading-[1.4]">
                      {topic.label}
                    </h3>
                    <p className="text-[10px] text-zinc-600 mt-1 font-bold uppercase tracking-tight">{topic.desc}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
};

export default ChatArea;
