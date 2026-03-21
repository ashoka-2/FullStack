import React, { useState } from 'react';
import { 
    RiInstagramLine, 
    RiShieldLine, 
    RiExternalLinkLine, 
    RiInformationLine, 
    RiCheckLine, 
    RiLoader4Line,
    RiKey2Line,
    RiUser6Line,
    RiQuestionLine,
    RiArrowRightLine,
    RiSettings4Line,
    RiFacebookCircleLine
} from '@remixicon/react';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { setUser } from '../auth.slice';

const ConnectInstagram = () => {
    const user = useSelector(state => state.auth.user);
    const dispatch = useDispatch();
    const [formData, setFormData] = useState({ accessToken: '', userId: '' });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null); // 'success' | 'error'
    const [message, setMessage] = useState('');

    const handleConnect = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus(null);
        try {
            const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/auth/connect-instagram`, formData, { withCredentials: true });
            
            setStatus('success');
            setMessage(res.data.message);
            if (user) {
                dispatch(setUser({
                    ...user,
                    instagram: { ...user.instagram, isConnected: true, userId: formData.userId }
                }));
            }
        } catch (err) {
            setStatus('error');
            setMessage(err.response?.data?.message || 'Failed to connect account.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-[#020202] pt-24 pb-20 px-6 md:px-12 selection:bg-[#20b8cd]/30">
            <div className="max-w-4xl mx-auto">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-[24px] bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] flex items-center justify-center text-white shadow-[0_8px_30px_rgb(238,42,123,0.3)] animate-in zoom-in duration-700">
                            <RiInstagramLine size={36} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight">
                                Instagram <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">Automation</span>
                            </h1>
                            <p className="text-zinc-500 dark:text-zinc-400 font-medium text-lg">Connect your profile to enable AI-powered posting</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    
                    {/* Left Column: Form & Info */}
                    <div className="lg:col-span-7 space-y-8">
                        
                        {/* Status Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-zinc-900/40 backdrop-blur-xl p-5 rounded-3xl border border-zinc-200 dark:border-white/5 shadow-sm hover:shadow-md transition-all group">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <RiShieldLine size={22} />
                                </div>
                                <h3 className="font-bold text-zinc-800 dark:text-zinc-200 mb-1">Encrypted Storage</h3>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">Your access tokens are encrypted and handled with bank-grade security protocols.</p>
                            </div>
                            <div className="bg-white dark:bg-zinc-900/40 backdrop-blur-xl p-5 rounded-3xl border border-zinc-200 dark:border-white/5 shadow-sm hover:shadow-md transition-all group">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <RiInformationLine size={22} />
                                </div>
                                <h3 className="font-bold text-zinc-800 dark:text-zinc-200 mb-1">Permanent History</h3>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">Images stay in your chat history for future AI analysis and community viewing.</p>
                            </div>
                        </div>

                        {/* Connection Form */}
                        <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-2xl p-8 rounded-[40px] border border-zinc-200 dark:border-white/10 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#20b8cd]/10 to-transparent rounded-full -mr-16 -mt-16 blur-3xl"></div>
                            
                            <form onSubmit={handleConnect} className="space-y-7 relative z-10">
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-bold text-zinc-700 dark:text-zinc-300 ml-1">
                                        <RiKey2Line size={16} className="text-[#20b8cd]" />
                                        Instagram Access Token
                                    </label>
                                    <div className="relative group">
                                        <input
                                            type="password"
                                            required
                                            value={formData.accessToken}
                                            onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
                                            placeholder="Paste your token here (IGAAP...)"
                                            className="w-full bg-zinc-100/50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#20b8cd] transition-all placeholder:text-zinc-400"
                                        />
                                    </div>
                                    <p className="text-[10px] text-zinc-500 ml-1">Must have <span className="text-zinc-700 dark:text-zinc-300 font-mono italic">instagram_business_content_publish</span> permission.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-bold text-zinc-700 dark:text-zinc-300 ml-1">
                                        <RiUser6Line size={16} className="text-[#20b8cd]" />
                                        Instagram Business ID
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.userId}
                                        onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                                        placeholder="Enter the 17-digit Instagram ID"
                                        className="w-full bg-zinc-100/50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#20b8cd] transition-all placeholder:text-zinc-400"
                                    />
                                    <p className="text-[10px] text-zinc-500 ml-1">Standard format: <span className="text-zinc-700 dark:text-zinc-300 font-mono italic">1784xxxxxxxxxxxxx</span></p>
                                </div>

                                {status && (
                                    <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-3 animate-in fade-in zoom-in duration-300 ${status === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${status === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white shadow-lg'}`}>
                                            {status === 'success' ? <RiCheckLine size={20} /> : <RiQuestionLine size={20} />}
                                        </div>
                                        {message}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="group w-full bg-zinc-900 dark:bg-gradient-to-r dark:from-[#20b8cd] dark:to-[#1a9eb0] text-zinc-100 dark:text-zinc-950 font-black py-5 rounded-[20px] hover:shadow-[0_8px_30px_rgb(32,184,205,0.4)] disabled:opacity-50 transition-all active:scale-[0.97] flex items-center justify-center gap-3 relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                    {loading ? <RiLoader4Line className="animate-spin" size={24} /> : <RiArrowRightLine className="group-hover:translate-x-1 transition-transform" size={24} />}
                                    <span className="relative z-10 text-lg">
                                        {user?.instagram?.isConnected ? 'Save New Credentials' : 'Connect My Profile'}
                                    </span>
                                </button>
                            </form>
                        </div>

                        {/* Video Placeholder Section moved here */}
                        <div className="relative group overflow-hidden rounded-[32px] border border-[#20b8cd]/20 bg-white dark:bg-zinc-900/60 backdrop-blur-2xl p-7 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800/40 shadow-xl">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <RiInstagramLine size={90} className="rotate-12 translate-x-4 -translate-y-4" />
                            </div>
                            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
                                <div className="w-16 h-16 rounded-full bg-[#20b8cd]/10 flex items-center justify-center text-[#20b8cd] shrink-0 shadow-inner">
                                    <div className="w-11 h-11 rounded-full bg-[#20b8cd] flex items-center justify-center text-black shadow-lg animate-pulse">
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 ml-1">
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="space-y-1 text-center sm:text-left">
                                    <h4 className="text-lg font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-tighter">New Tutorial Video Incoming</h4>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed max-w-sm">We are recording a step-by-step video guide to help you build your Instagram API app and generate tokens in under 5 minutes.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Steps Guide */}
                    <div className="lg:col-span-5">
                        <div className="bg-white dark:bg-zinc-900/40 backdrop-blur-xl p-8 rounded-[40px] border border-zinc-200 dark:border-white/10 shadow-lg sticky top-28">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                                    <RiSettings4Line size={20} className="text-zinc-500" />
                                </div>
                                <h2 className="text-xl font-black text-zinc-800 dark:text-zinc-200">How to get these?</h2>
                            </div>

                            <div className="space-y-6">
                                <StepItem 
                                    num="1" 
                                    title="Create Meta App" 
                                    desc="Go to Meta Developers and create an App. Choose 'Other' then 'Business'. "
                                    icon={<RiFacebookCircleLine size={14}/>}
                                    link="https://developers.facebook.com/"
                                />
                                <StepItem 
                                    num="2" 
                                    title="Set up Instagram Login" 
                                    desc="In your App Dashboard, add the 'Instagram' product and choose 'API setup with Instagram login'."
                                />
                                <StepItem 
                                    num="3" 
                                    title="Add Account" 
                                    desc={<>Under the 'Generate access tokens' section, click <span className="font-bold underline">Add an Instagram account</span> and log in.</>}
                                />
                                <div className="relative pl-12 pb-2">
                                    <div className="absolute left-6 top-8 bottom-0 w-[2px] bg-zinc-100 dark:bg-zinc-800"></div>
                                    <div className="flex items-center gap-4 mb-3">
                                        <span className="absolute left-3 w-7 h-7 rounded-full bg-gradient-to-r from-[#20b8cd] to-cyan-600 text-white text-xs flex items-center justify-center font-black shadow-lg shadow-cyan-500/30">4</span>
                                        <h4 className="font-bold text-zinc-800 dark:text-zinc-200">The Power Step</h4>
                                    </div>
                                    <div className="bg-zinc-50 dark:bg-zinc-950/50 p-4 rounded-2xl border border-zinc-200 dark:border-white/5 space-y-3">
                                        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                                            Click the <span className="font-bold text-emerald-500">Generate token</span> button next to your account.
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {['Copy Token', 'Copy User ID'].map(p => (
                                                <span key={p} className="text-[9px] font-mono bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700">{p}</span>
                                            ))}
                                        </div>
                                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2">
                                            Paste the generated Access Token into the form. The <span className="text-[#ee2a7b]">17-digit Instagram ID</span> is displayed right below your username on that same page!
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-start gap-3">
                                <RiInformationLine className="text-amber-500 shrink-0" size={18} />
                                <p className="text-[11px] text-amber-600 dark:text-amber-500 leading-relaxed font-medium italic">
                                    Tips: If you get a 403 error, ensure your Instagram account is set to "Business" or "Creator" mode in its mobile app settings.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StepItem = ({ num, title, desc, link, icon }) => (
    <div className="relative pl-12">
        <div className="absolute left-6 top-8 bottom-0 w-[2px] bg-zinc-100 dark:bg-zinc-800 group-last:hidden"></div>
        <div className="flex items-center gap-4 mb-1">
            <span className="absolute left-3 w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs flex items-center justify-center font-bold border border-zinc-200 dark:border-zinc-700">{num}</span>
            <h4 className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                {title}
                {link && <a href={link} target="_blank" className="text-[#20b8cd] hover:scale-110 transition-transform"><RiExternalLinkLine size={14}/></a>}
            </h4>
        </div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {desc}
        </div>
    </div>
);

export default ConnectInstagram;
