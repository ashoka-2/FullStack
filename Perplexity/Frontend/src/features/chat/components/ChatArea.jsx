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
  RiMagicLine,
  RiInstagramLine,
  RiMailSendLine
} from '@remixicon/react';
import { useChat } from '../hook/useChat';
import { useNavigate } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import Toast from '../../Components/Toast';
import { setError, setMessages } from '../chat.slice';
import PerplexityIcon from '../../Components/PerplexityIcon';

const ChatArea = () => {
  // Input message store karne ke liye
  const [input, setInput] = useState('');
  
  // Agar user koi file ya image attach karta hai toh usko isme store karte hain
  const [files, setFiles] = useState([]);
  
  // Drag and drop UI toggle ke liye flag
  const [isDragging, setIsDragging] = useState(false);
  
  // Custom hook se function le rahe hain jo chat bhejne aur suggestions lane me madad karega
  const { handleSendMessage, handleGetSuggestions, loading } = useChat();
  
  // Global error state laye hain Redux se, taaki upar Toast me dikha sakein
  const error = useSelector(state => state.chat.error);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Naye AI suggestions (pills, queries, topics) store karne ke liye
  const [aiSuggestions, setAiSuggestions] = useState(null);
  
  // Initial suggestions laate waqt skeleton dikhane ke liye loading flag
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);

  // Hidden file input element ka reference taaki attachment button se waha click karwa sakein
  const fileInputRef = useRef(null);

  // Jaise hi component pehli baar load ho, default suggestions backend se fetch karo
  useEffect(() => {
    const fetchSuggestions = async () => {
      setSuggestionsLoading(true);
      const data = await handleGetSuggestions();
      if (data) setAiSuggestions(data); // Agar data aaya toh state update kardo
      setSuggestionsLoading(false);
    };
    fetchSuggestions();
  }, []);

  // Icon ka dictionary taaki backend se sirf string (jaise 'robot') aaye aur hum proper icon dikha sakein
  const iconMap = {
    global: RiGlobalLine,
    robot: RiRobot2Line,
    file: RiFileList3Line,
    magic: RiMagicLine,
    compass: RiCompass3Line,
    book: RiBookOpenLine,
    heart: RiHeart2Line
  };

  // AI ke extra capabilities ko yaha dynamic array mein rakha gaya hai
  // Taaki future mein naye tools aane par simply yahan unhe joda ja sake bina UI code badle
  const capabilities = [
    {
       title: "Post to Instagram",
       description: "Instantly create and publish image posts directly to your Instagram account.",
       icon: RiInstagramLine,
       colorClass: "text-[#E1306C]",
       bgHover: "hover:bg-[#E1306C]/10 hover:border-[#E1306C]/30"
    },
    {
       title: "Send Emails",
       description: "Draft and send professional emails straight from the chat interface.",
       icon: RiMailSendLine,
       colorClass: "text-[#EA4335]",
       bgHover: "hover:bg-[#EA4335]/10 hover:border-[#EA4335]/30"
    }
  ];

  // Jab user Enter dabaye, send button dabaye ya koi suggestion click kare
  const onSubmit = async (e, text = null) => {
    if (e) e.preventDefault();
    
    // Agar func ko naya text mila hai (matlab user ne suggestion click kiya) toh usa use karo warna input box ka text
    const messageToSend = text || input;
    
    // Abhi ke liye sirf pehli file bhej rahe hain backend ko (Single file attachment support)
    const file = files[0]; 
    
    // Agar type bhi nahi kiya aur file bhi select nahi ki toh send nahi karenge. Ya fir agar pehle se message jaa raha ho (loading) to rokenge
    if ((!messageToSend.trim() && !file) || loading) return;

    try {
      // Input box box ko immediately khali karna zaruri hai taki user dohra type na kare
      setInput('');
      setFiles([]);
      
      // Purane stored messages saaf kar do taaki new page pe pichle chat ki baatein na aayen
      dispatch(setMessages([]));
      
      // Optimistic Routing: Server ki response ka wait karne ke bajaye user ko turant new chat screen pe bhej do
      navigate('/chat/new');
      
      // Asynchronously handle message sending, hum yahan await nahi laga rahe taaki ui fass na jaye
      handleSendMessage(messageToSend, null, file).then(response => {
        // Ek baar server se asli chat _id aa gayi, tab silently URL ko update kardo (replace: true ensures strict history)
        if (response && response.chat) {
          navigate(`/chat/${response.chat._id}`, { replace: true });
        }
      }).catch(err => {
          console.error("Message send failed:", err);
      });
      
    } catch (error) {
      console.error("Message send failed:", error); // Dev logging
    }
  };

  // Keyboard 'Enter' se message send karne ke liye function
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      // Agar user shift ya ctrl daba ke enter mare toh usko new line samajhenge (Message na bhejeyngy)
      if (e.ctrlKey || e.metaKey || e.shiftKey) {
        return;
      }
      e.preventDefault(); // Default line skip rokna
      onSubmit(e); // Message bhejna start
    }
  };

  // Attachment button ke zariye aayi files state me set karna
  const handleFileUpload = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selectedFiles]); // Purani plus nayi file add
  };

  // Selected file array me se particular index wali file udana
  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  // Drag start (jab screen par file laaye)
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true); // Overlay UI dikhaye
  };

  // Jab file screen se hata di bina drop kare
  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // File chhorne par drop handle karna
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false); // Drop ho gaya UI wapas normal kardo
    
    // Drop ki gyi files state me save kar lo
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      setFiles(prev => [...prev, ...droppedFiles]);
    }
  };

  return (
    <main className="flex-1 w-full flex flex-col items-center bg-white dark:bg-[#050505] relative overflow-x-hidden overflow-y-auto custom-scrollbar pb-80 md:pb-32"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Toast message={error} type="error" onClose={() => dispatch(setError(null))} />

      {/* Drag Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none px-6">
          <div className="bg-white/80 dark:bg-[#121212]/80 border-2 border-dashed border-[#60A6AF] rounded-3xl p-12 backdrop-blur-xl flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300 shadow-2xl">
            <RiUploadCloudLine size={64} className="text-[#60A6AF] animate-bounce" />
            <h2 className="text-xl font-bold text-black dark:text-white uppercase tracking-wider">Drop to upload</h2>
          </div>
        </div>
      )}

      <div className="w-full max-w-fluid flex flex-col items-center relative z-10 px-4 md:px-0 pt-12 md:pt-[15vh]">
        <h1 className="text-[3.5rem] md:text-[5.5rem] font-extralight text-zinc-900 dark:text-white tracking-tighter mb-8 md:mb-12 text-center opacity-90 transition-opacity hover:opacity-100 flex items-center gap-2">
         <PerplexityIcon size={50}/> Perplexity
        </h1>

        {/* Assistant Suggestions Pills ab heading ke theek niche hain */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8 px-1 max-w-[800px] mx-auto w-full">
          {suggestionsLoading ? (
            [1, 2, 3, 4].map(i => (
              <div key={i} className="flex-shrink-0 w-24 h-8 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 animate-pulse" />
            ))
          ) : (
              (aiSuggestions?.pills || ['For you', 'Study guide', 'Business', 'Health']).map((pillLabel, i) => {
              const Icon = iconMap[aiSuggestions?.topics?.[i]?.iconType] || RiCompass3Line;
              return (
                <button 
                  key={i} 
                  onClick={(e) => onSubmit(e, pillLabel)}
                  className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full bg-transparent border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-600 dark:text-zinc-500 text-[13px] font-medium transition-all group"
                >
                  <Icon size={14} className="text-zinc-500 mr-2 group-hover:text-zinc-900 dark:group-hover:text-zinc-300" />
                  <span>{pillLabel}</span>
                </button>
              );
            })
          )}
        </div>

        {/* Search Input Box */}
        <div className="w-full md:relative md:block fixed bottom-0 left-0 right-0 z-50 p-4 pb-8 md:p-0 bg-gradient-to-t from-[#f3f4f6] dark:from-[#050505] via-[#f3f4f6]/95 dark:via-[#050505]/95 md:bg-transparent md:dark:bg-transparent to-transparent backdrop-blur-[2px] md:backdrop-blur-0">
          <div className={`w-full max-w-[800px] mx-auto bg-white dark:bg-[#121212] border ${isDragging ? 'border-[#60A6AF]' : 'border-zinc-200 dark:border-[#2d2e2e]'} focus-within:border-zinc-300 dark:focus-within:border-zinc-700 rounded-[28px] px-5 md:px-6 py-4 md:py-5 transition-all duration-300 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)]`}>

            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1 bg-zinc-200 dark:bg-[#1a1a1a] border border-zinc-300 dark:border-white/5 rounded-lg animate-in zoom-in duration-300">
                    {file.isLink ? <RiAttachment2 size={12} className="text-[#60A6AF]" /> : <RiFileTextLine size={12} className="text-[#60A6AF]" />}
                    <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 truncate max-w-[120px]">{file.name}</span>
                    <button onClick={() => removeFile(i)} className="text-zinc-400 dark:text-zinc-600 hover:text-red-400 transition-colors">
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
              className="w-full bg-transparent border-none outline-none text-zinc-900 dark:text-zinc-100 text-[17px] md:text-[18px] placeholder:text-zinc-400 dark:placeholder:text-zinc-500 resize-none min-h-[40px] md:min-h-[60px] leading-snug md:leading-relaxed font-sans font-medium"
            />

            <div className="flex items-center justify-between mt-4">
              <div className="relative">
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 bg-zinc-100 dark:bg-transparent hover:bg-zinc-200 dark:hover:bg-zinc-800/50 transition-all"
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
                  className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${input.trim() || files.length > 0 ? 'bg-black text-white dark:bg-white dark:text-black shadow-lg shadow-black/10' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 opacity-50'}`}
                >
                  <RiArrowUpLine size={18} />
                </button>
              </div>
            </div>
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
                className="w-full text-left px-4 py-2.5 text-[14px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all border-b border-zinc-100 dark:border-zinc-900/50 block font-medium break-words whitespace-normal"
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
                    className="flex flex-col gap-3 p-5 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/5 rounded-2xl hover:border-zinc-300 dark:hover:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/30 transition-all text-left group shadow-sm dark:shadow-none"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center border border-zinc-200 dark:border-zinc-800 transition-colors">
                      <Icon className="text-zinc-500 dark:text-zinc-600 group-hover:text-zinc-900 dark:group-hover:text-zinc-400" size={18} />
                    </div>
                    <RiArrowRightLine size={14} className="text-zinc-300 dark:text-zinc-800 group-hover:text-zinc-600 dark:group-hover:text-zinc-500 mr-1 transition-colors" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[14px] font-bold text-zinc-900 dark:text-zinc-200 group-hover:text-black dark:group-hover:text-white transition-colors leading-[1.4] break-words line-clamp-2">
                      {topic.label}
                    </h3>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-600 mt-1 font-bold uppercase tracking-tight transition-colors">{topic.desc}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
        
        {/* Dynamic AI Capabilities Showcase */}
        {/* Is component block se humne Instagram aur Email jaise specific integrations ko darshaya hai. Ye generic hai. */}
        <div className="w-full max-w-[800px] mt-6 mb-20 px-1">
          <div className="mb-4">
             <h3 className="text-[12px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest pl-1">Capabilities</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {capabilities.map((cap, i) => {
               const Icon = cap.icon;
               return (
                 <div key={i} className={`flex flex-col gap-2 p-4 bg-zinc-50 dark:bg-[#121212]/50 border border-zinc-200 dark:border-white/5 rounded-2xl transition-all cursor-default ${cap.bgHover}`}>
                   <div className="flex items-center gap-3">
                     <div className={`w-8 h-8 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shadow-sm ${cap.colorClass}`}>
                        <Icon size={16} />
                     </div>
                     <span className="text-[14px] font-extrabold text-zinc-800 dark:text-zinc-200">{cap.title}</span>
                   </div>
                   <p className="text-[12px] text-zinc-500 font-medium leading-[1.5] mt-1 pr-4">
                     {cap.description}
                   </p>
                 </div>
               )
            })}
          </div>
        </div>

        {/* Mobile Spacer to prevent overlap with fixed search bar */}
        <div className="h-40 md:hidden" />
      </div>
    </main>
  );
};

export default ChatArea;
