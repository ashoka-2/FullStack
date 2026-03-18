import React, { useState, useEffect } from 'react';
import { 
  RiFileCopyLine, 
  RiRefreshLine, 
  RiThumbUpLine, 
  RiThumbDownLine,
  RiCheckLine
} from '@remixicon/react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

const CodeBlock = ({ code, language, ...props }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative group my-6 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0d0d0d]">
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">{language}</span>
                <button 
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 p-1.5 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 transition-all"
                >
                    {copied ? (
                        <>
                            <span className="text-[10px] font-bold text-emerald-500">Copied!</span>
                            <RiCheckLine size={14} className="text-emerald-500" />
                        </>
                    ) : (
                        <RiFileCopyLine size={14} />
                    )}
                </button>
            </div>
            <SyntaxHighlighter
                style={vscDarkPlus}
                language={language}
                PreTag="div"
                customStyle={{
                    margin: 0,
                    padding: '1.25rem',
                    background: 'transparent',
                    fontSize: '13px',
                    lineHeight: '1.6'
                }}
                {...props}
            >
                {code}
            </SyntaxHighlighter>
        </div>
    );
};

const ChatMessage = ({ msg, isLatest, isNewMessage }) => {
    const isUser = msg.role === 'user';
    const shouldAnimate = !isUser && isLatest && isNewMessage;
    const [displayedContent, setDisplayedContent] = useState(msg.content);
    const [isTyping, setIsTyping] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        setDisplayedContent(msg.content);
    }, [msg.content]);

    const handleCopy = () => {
        if (msg.content) {
            navigator.clipboard.writeText(msg.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const contentToRender = isTyping ? displayedContent : msg.content;

    return (
        <div className={`flex flex-col gap-6 animate-in fade-in duration-500`}>
            {isUser ? (
                <div className="flex flex-col items-end gap-3 pr-1">
                    {msg.file && msg.file.url && (
                        <div className="max-w-[300px] md:max-w-[400px] rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl animate-in zoom-in duration-300">
                            <img src={msg.file.url} alt="Attached" className="w-full h-auto object-cover" />
                        </div>
                    )}
                    <div className="bg-zinc-100 dark:bg-[#1a1a1a] text-zinc-900 dark:text-zinc-100 px-4 md:px-5 py-2 md:py-2.5 rounded-[20px] md:rounded-[22px] text-[14px] md:text-[15px] font-bold border border-zinc-200 dark:border-white/5 shadow-sm transition-all hover:bg-zinc-200 dark:hover:bg-[#222]">
                        {contentToRender}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-6 ">
                    <div className="prose prose-emerald dark:prose-invert max-w-none text-zinc-950 dark:text-zinc-200 leading-[1.7] md:leading-[1.8] text-[15px] md:text-[17px] font-medium tracking-tight">
                        <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                                code({node, inline, className, children, ...props}) {
                                    const match = /language-(\w+)/.exec(className || '');
                                    const codeString = String(children).replace(/\n$/, '');
                                    
                                    return !inline && match ? (
                                        <CodeBlock 
                                            code={codeString} 
                                            language={match[1]} 
                                            {...props} 
                                        />
                                    ) : (
                                        <code className={`${className} bg-zinc-100 dark:bg-zinc-800/50 px-1.5 py-0.5 rounded text-sm text-zinc-600 dark:text-zinc-300 font-mono`} {...props}>
                                            {children}
                                        </code>
                                    )
                                },
                                p: ({children}) => <p className="text-zinc-800 dark:text-zinc-300 leading-relaxed mb-6 last:mb-0">{children}</p>,
                                ul: ({children}) => <ul className="list-disc pl-5 space-y-3 mb-6 last:mb-0">{children}</ul>,
                                li: ({children}) => <li className="text-zinc-800 dark:text-zinc-300 leading-relaxed pl-1">{children}</li>,
                                h1: ({children}) => <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white mt-10 mb-6 tracking-tight">{children}</h1>,
                                h2: ({children}) => <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white mt-8 mb-4 tracking-tight">{children}</h2>,
                                h3: ({children}) => <h3 className="text-lg md:text-xl font-bold text-zinc-900 dark:text-white mt-6 mb-3 tracking-tight">{children}</h3>,
                            }}
                        >
                            {contentToRender}
                        </ReactMarkdown>
                    </div>
                    {msg.content && (
                        <div className="flex items-center gap-5 pt-4 border-t border-zinc-200 dark:border-zinc-900/50 opacity-40 hover:opacity-100 transition-opacity">
                            <button 
                                onClick={handleCopy}
                                className="flex items-center gap-1.5 group transition-colors"
                            >
                                {copied ? (
                                    <>
                                        <span className="text-[12px] font-bold text-emerald-500">Copied!</span>
                                        <RiCheckLine size={18} className="text-emerald-500" />
                                    </>
                                ) : (
                                    <RiFileCopyLine size={18} className="text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-100" />
                                )}
                            </button>
                            <RiRefreshLine size={18} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer" />
                            <div className="flex-1" />
                            <RiThumbUpLine size={18} className="text-zinc-700 hover:text-[#60A6AF] cursor-pointer" />
                            <RiThumbDownLine size={18} className="text-zinc-700 hover:text-red-500 cursor-pointer" />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ChatMessage;
