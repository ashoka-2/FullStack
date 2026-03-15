import React from 'react';
import { 
  RiFileCopyLine, 
  RiRefreshLine, 
  RiThumbUpLine, 
  RiThumbDownLine 
} from '@remixicon/react';

const ChatMessage = ({ msg }) => {
    const isUser = msg.role === 'user';

    return (
        <div className={`flex flex-col gap-6 animate-in fade-in duration-500`}>
            {isUser ? (
                <div className="flex justify-end pr-1">
                    <div className="bg-[#1a1a1a] text-zinc-100 px-4 md:px-5 py-2 md:py-2.5 rounded-[20px] md:rounded-[22px] text-[14px] md:text-[15px] font-bold border border-white/5 shadow-sm transition-all hover:bg-[#222]">
                        {msg.content}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-6 pb-100">
                    <div className="prose prose-invert prose-emerald max-w-none text-zinc-200 leading-[1.7] md:leading-[1.8] text-[15px] md:text-[17px] font-medium tracking-tight whitespace-pre-wrap">
                        {msg.content.split('\n\n').map((para, idx) => {
                            if (para.startsWith('###')) {
                                return <h3 key={idx} className="text-xl md:text-2xl font-bold text-white mt-8 mb-4 tracking-tight">{para.replace('### ', '')}</h3>;
                            }
                            if (para.startsWith('*')) {
                                return (
                                    <ul key={idx} className="list-disc pl-5 space-y-3 my-4">
                                        {para.split('\n').map((li, liIdx) => (
                                            <li key={liIdx} className="text-zinc-300 leading-relaxed pl-1">{li.replace('* ', '')}</li>
                                        ))}
                                    </ul>
                                );
                            }
                            return <p key={idx} className="text-zinc-300 leading-relaxed mb-4">{para}</p>;
                        })}
                    </div>
                    <div className="flex items-center gap-5 pt-4 border-t border-zinc-900/50 opacity-40 hover:opacity-100 transition-opacity">
                        <RiFileCopyLine size={18} className="text-zinc-500 hover:text-zinc-100 cursor-pointer" />
                        <RiRefreshLine size={18} className="text-zinc-500 hover:text-zinc-100 cursor-pointer" />
                        <div className="flex-1" />
                        <RiThumbUpLine size={18} className="text-zinc-700 hover:text-[#60A6AF] cursor-pointer" />
                        <RiThumbDownLine size={18} className="text-zinc-700 hover:text-red-500 cursor-pointer" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatMessage;
