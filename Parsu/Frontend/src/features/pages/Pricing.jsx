import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'motion/react';
import {
    RiCheckLine,
    RiSparkling2Line,
    RiFlashlightLine,
    RiArrowRightLine,
    RiShieldCheckLine,
    RiQuestionLine,
    RiArrowDownSLine,
    RiLoader4Line,
    RiGlobalLine,
    RiFileCopyLine,
    RiDiscordLine,
    RiCodeSSlashLine,
    RiSmartphoneLine
} from '@remixicon/react';
import InfoPageLayout from './InfoPageLayout';
import { createRazorpayOrder, verifyPaymentSignature, getPublicPlans } from '../auth/service/subscription.api';
import { setUser } from '../auth/auth.slice';
import { addToast } from '../../utils/toast.slice';

const TIERS_CONFIG = {
    INR: [
        {
            id: 'free',
            name: 'Starter',
            badge: null,
            desc: 'Instant access to multi-model AI search, research, and chat',
            price: 0,
            period: 'Free forever',
            icon: RiFlashlightLine,
            theme: 'cyan',
            glowGradient: 'from-cyan-900/40 via-teal-950/30 to-[#0e1015]',
            iconBg: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
            buttonText: 'Start for free',
            buttonStyle: 'bg-zinc-800/90 hover:bg-zinc-700 text-white border border-white/10',
            features: [
                'Unlimited Gemini 3.6 Flash queries',
                'Claude 3.5 Sonnet & GPT-4o access',
                'Real-time live web search grounding',
                'Standard document upload & RAG',
                'Social command center previews',
                'Community Discord support'
            ]
        },
        {
            id: 'starter',
            name: 'Web Hero',
            badge: null,
            desc: 'Get access to React library components and features',
            price: 1499,
            period: 'Perpetual license',
            icon: RiSmartphoneLine,
            theme: 'purple',
            glowGradient: 'from-sky-900/60 via-cyan-950/40 to-[#0e1015]',
            iconBg: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
            buttonText: 'Get Web Hero',
            buttonStyle: 'bg-zinc-800/90 hover:bg-zinc-700 text-white border border-white/10',
            features: [
                'Pro React components',
                'Premium templates',
                'Pro AI (Skills and MCPs)',
                '500 AI credits included',
                'Premium design systems',
                'Pro design systems',
                'Private Discord channel',
                'Prioritized issues',
                'Priority support'
            ]
        },
        {
            id: 'enterprise',
            name: 'Super Hero',
            badge: 'Save ₹1,000 with bundle',
            desc: 'The full system. React and React Native, together',
            price: 2499,
            period: 'Perpetual license',
            icon: RiSparkling2Line,
            theme: 'amber',
            popular: true,
            glowGradient: 'from-amber-800/70 via-yellow-950/40 to-[#0e1015]',
            iconBg: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
            buttonText: 'Get Super Hero',
            buttonStyle: 'bg-white hover:bg-zinc-100 text-black font-extrabold shadow-lg shadow-amber-500/10',
            features: [
                'All Pro components (React + React Native)',
                'Premium templates',
                'Pro AI (Skills and MCPs)',
                '1000 AI credits included',
                'Premium design systems',
                'Pro design systems',
                'Private Discord channels',
                'Prioritized issues',
                'Priority support'
            ]
        }
    ],
    USD: [
        {
            id: 'free',
            name: 'Starter',
            badge: null,
            desc: 'Instant access to multi-model AI search, research, and chat',
            price: 0,
            period: 'Free forever',
            icon: RiFlashlightLine,
            theme: 'cyan',
            glowGradient: 'from-cyan-900/40 via-teal-950/30 to-[#0e1015]',
            iconBg: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
            buttonText: 'Start for free',
            buttonStyle: 'bg-zinc-800/90 hover:bg-zinc-700 text-white border border-white/10',
            features: [
                'Unlimited Gemini 3.6 Flash queries',
                'Claude 3.5 Sonnet & GPT-4o access',
                'Real-time live web search grounding',
                'Standard document upload & RAG',
                'Social command center previews',
                'Community Discord support'
            ]
        },
        {
            id: 'starter',
            name: 'Web Hero',
            badge: null,
            desc: 'Get access to React library components and features',
            price: 299,
            period: 'Perpetual license',
            icon: RiSmartphoneLine,
            theme: 'purple',
            glowGradient: 'from-sky-900/60 via-cyan-950/40 to-[#0e1015]',
            iconBg: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
            buttonText: 'Get Web Hero',
            buttonStyle: 'bg-zinc-800/90 hover:bg-zinc-700 text-white border border-white/10',
            features: [
                'Pro React components',
                'Premium templates',
                'Pro AI (Skills and MCPs)',
                '500 AI credits included',
                'Premium design systems',
                'Pro design systems',
                'Private Discord channel',
                'Prioritized issues',
                'Priority support'
            ]
        },
        {
            id: 'enterprise',
            name: 'Super Hero',
            badge: 'Save $199 with bundle',
            desc: 'The full system. React and React Native, together',
            price: 399,
            period: 'Perpetual license',
            icon: RiSparkling2Line,
            theme: 'amber',
            popular: true,
            glowGradient: 'from-amber-800/70 via-yellow-950/40 to-[#0e1015]',
            iconBg: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
            buttonText: 'Get Super Hero',
            buttonStyle: 'bg-white hover:bg-zinc-100 text-black font-extrabold shadow-lg shadow-amber-500/10',
            features: [
                'All Pro components (React + React Native)',
                'Premium templates',
                'Pro AI (Skills and MCPs)',
                '1000 AI credits included',
                'Premium design systems',
                'Pro design systems',
                'Private Discord channels',
                'Prioritized issues',
                'Priority support'
            ]
        }
    ]
};

const FAQS = [
    {
        q: 'How does location detection work?',
        a: 'Pricing is automatically localized based on your country. Visitors in India receive special Purchasing Power Parity (PPP) rates in Indian Rupees (₹), while international visitors receive standard rates in US Dollars ($).'
    },
    {
        q: 'How does Razorpay checkout and UPI work?',
        a: 'When you click to get an edition, Razorpay launches an encrypted checkout modal. In India, UPI is prioritized at the top of the payment screen, allowing instant payment via Google Pay, PhonePe, Paytm, or BHIM. Credit/Debit Cards and Net Banking are also supported.'
    },
    {
        q: 'What is a perpetual license?',
        a: 'A perpetual license grants you lifetime access to the components, source code, and templates included with your plan, plus dedicated AI credits and priority feature updates.'
    },
    {
        q: 'Can pricing and features be changed by admin?',
        a: 'Yes, admin administrators can modify edition prices, AI quotas, and toggle between Razorpay testing mode and live payable mode at any time via the admin dashboard.'
    },
    {
        q: 'Can I use my own API keys (OpenAI, Gemini, Anthropic)?',
        a: 'Absolutely! Parsu AI includes a built-in Custom Key Manager in Settings. When you configure your own personal keys, queries route directly with zero rate-limit friction.'
    }
];

export default function Pricing() {
    const [currency, setCurrency] = useState('USD');
    const [countryName, setCountryName] = useState('International');
    const [isIndia, setIsIndia] = useState(false);
    const [openFaq, setOpenFaq] = useState(0);
    const [loadingTier, setLoadingTier] = useState(null);
    const [copiedCode, setCopiedCode] = useState(false);
    const [dynamicPlans, setDynamicPlans] = useState(null);

    const { user } = useSelector(state => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Auto-detect user's location automatically without user switch option
    useEffect(() => {
        let detectedCurrency = 'USD';
        let detectedIsIndia = false;

        try {
            const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
            const languages = navigator.languages ? navigator.languages.join(',') : navigator.language || '';
            detectedIsIndia = timeZone.includes('Calcutta') || timeZone.includes('Kolkata') || languages.includes('-IN') || languages.includes('hi');
            if (detectedIsIndia) {
                detectedCurrency = 'INR';
                setCountryName('India');
                setIsIndia(true);
            } else {
                detectedCurrency = 'USD';
                setCountryName('International');
                setIsIndia(false);
            }
            setCurrency(detectedCurrency);
        } catch (e) {
            setCurrency('USD');
        }

        // Fetch live updated plan pricing from backend
        getPublicPlans()
            .then(res => {
                if (res?.plans) {
                    setDynamicPlans(res.plans);
                }
                if (res?.currency) {
                    setCurrency(res.currency);
                    setIsIndia(res.currency === 'INR');
                }
            })
            .catch(() => {
                // Smooth fallback to local static configuration
            });
    }, []);

    const currencySymbol = currency === 'INR' ? '₹' : '$';
    const tiers = TIERS_CONFIG[currency] || TIERS_CONFIG.USD;

    const loadRazorpay = () => {
        return new Promise((resolve) => {
            if (window.Razorpay) return resolve(true);
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleCopyDiscount = () => {
        navigator.clipboard.writeText('PPP25');
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
        dispatch(addToast({ type: 'success', message: 'Discount code PPP25 copied to clipboard!' }));
    };

    const handleSelectPlan = async (tier) => {
        if (tier.price === 0 || tier.id === 'free') {
            navigate('/ai');
            return;
        }

        if (!user) {
            dispatch(addToast({ type: 'info', message: 'Please create an account or sign in to complete your purchase.' }));
            navigate(`/auth?mode=register&redirect=/pricing`);
            return;
        }

        if (user.subscription?.plan === tier.id && user.subscription?.status === 'active') {
            dispatch(addToast({ type: 'info', message: `You already have active access to the ${tier.name} edition!` }));
            navigate('/settings/subscription');
            return;
        }

        setLoadingTier(tier.id);

        try {
            // 1. Create order on backend (handles Test vs Payable mode seamlessly)
            const orderData = await createRazorpayOrder({ 
                plan: tier.id, 
                billingCycle: 'lifetime', 
                currency 
            });

            if (!orderData?.orderId) {
                throw new Error(orderData?.message || 'Failed to create payment order');
            }

            // 2. Load official Razorpay Checkout SDK
            const isLoaded = await loadRazorpay();
            if (!isLoaded) {
                throw new Error('Unable to connect to Razorpay payment gateway');
            }

            // 3. Configure Checkout with explicit UPI prioritization
            const options = {
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency || currency,
                name: 'Parsu AI',
                description: `${tier.name} (Perpetual Edition)`,
                order_id: orderData.orderId,
                config: {
                    display: {
                        blocks: {
                            upi: {
                                name: "Pay via UPI",
                                instruments: [
                                    { method: "upi" }
                                ]
                            },
                            other: {
                                name: "Cards, Net Banking & Wallets",
                                instruments: [
                                    { method: "card" },
                                    { method: "netbanking" },
                                    { method: "wallet" }
                                ]
                            }
                        },
                        sequence: ["block.upi", "block.other"],
                        preferences: {
                            show_default_blocks: true
                        }
                    }
                },
                handler: async (response) => {
                    try {
                        const verifyRes = await verifyPaymentSignature({
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                            plan: tier.id,
                            billingCycle: 'lifetime',
                            currency
                        });

                        if (verifyRes.success) {
                            dispatch(setUser(verifyRes.user));
                            dispatch(addToast({ type: 'success', message: `🎉 Payment successful! Welcome to Parsu AI ${tier.name}.` }));
                            navigate('/settings/subscription');
                        } else {
                            dispatch(addToast({ type: 'error', message: verifyRes.message || 'Payment verification failed.' }));
                        }
                    } catch (vErr) {
                        dispatch(addToast({ type: 'error', message: vErr.response?.data?.message || 'Payment verification failed.' }));
                    }
                },
                prefill: {
                    name: user?.username || '',
                    email: user?.email || ''
                },
                theme: {
                    color: '#20b8cd'
                },
                modal: {
                    ondismiss: () => {
                        dispatch(addToast({ type: 'info', message: 'Payment window was closed.' }));
                        setLoadingTier(null);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (resp) {
                dispatch(addToast({ type: 'error', message: resp.error?.description || 'Payment was unsuccessful.' }));
            });
            rzp.open();
        } catch (err) {
            dispatch(addToast({ type: 'error', message: err.response?.data?.message || err.message || 'Failed to initialize payment' }));
        } finally {
            setLoadingTier(null);
        }
    };

    return (
        <InfoPageLayout 
            title="Parsu AI Editions" 
            subtitle="Pick your stack. Start building products you're proud to ship."
            badge="HeroUI Pro Theme"
        >
            <div className="space-y-10 sm:space-y-14">
                
                {/* ── Top Location Discount Banner (Matching media_1790057123792.jpg) ── */}
                <div className="w-full flex justify-center">
                    {isIndia ? (
                        <div className="inline-flex items-center gap-2 sm:gap-3 px-4 py-2 rounded-full bg-zinc-900 border border-white/10 text-xs sm:text-sm text-zinc-300 shadow-md">
                            <span className="text-base">🇮🇳</span>
                            <span className="font-medium">Special pricing for India - 25% off with</span>
                            <button
                                type="button"
                                onClick={handleCopyDiscount}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-white font-mono font-bold text-xs transition-colors cursor-pointer"
                                title="Click to copy promo code"
                            >
                                <span>PPP25</span>
                                <RiFileCopyLine size={12} className={copiedCode ? "text-emerald-400" : ""} />
                            </button>
                        </div>
                    ) : (
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-white/10 text-xs sm:text-sm text-zinc-300 shadow-md">
                            <RiGlobalLine size={15} className="text-[#20b8cd]" />
                            <span className="font-medium">Global Pricing Active • Location auto-localized</span>
                        </div>
                    )}
                </div>

                {/* ── Header Pill Bar (Matching media_1790057123792.jpg) ── */}
                <div className="flex flex-col items-center text-center space-y-4 max-w-2xl mx-auto">
                    <div className="inline-flex items-center gap-4 px-4 py-2 rounded-full bg-zinc-900/90 border border-white/10 shadow-lg text-xs sm:text-sm">
                        <div className="flex items-center gap-1.5 font-extrabold text-white">
                            <span>Parsu</span>
                            <span className="px-1.5 py-0.2 rounded bg-[#20b8cd] text-black font-black text-[10px]">PRO</span>
                        </div>
                        <span className="text-zinc-600 dark:text-zinc-600">•</span>
                        <Link to="/about" className="text-zinc-400 hover:text-white transition-colors">Documentation</Link>
                        <span className="text-zinc-600 dark:text-zinc-600">•</span>
                        <Link to={user ? "/settings" : "/auth?mode=login"} className="text-zinc-400 hover:text-white transition-colors">
                            {user ? "Account" : "Login"}
                        </Link>
                        <span className="px-3 py-1 rounded-full bg-white text-black font-bold text-xs">
                            Get Parsu AI Pro
                        </span>
                    </div>

                    <h1 className="text-3xl sm:text-5xl font-black text-zinc-900 dark:text-white tracking-tight pt-2">
                        Pick your stack. <br />
                        <span className="text-[#20b8cd]">Start building products you're proud to ship.</span>
                    </h1>
                </div>

                {/* ── 3 Cosmic Cards Grid (Exact media_1790057123792.jpg layout) ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch max-w-6xl mx-auto">
                    {tiers.map((tier) => {
                        const Icon = tier.icon;
                        const isCurrentPlan = user?.subscription?.plan === tier.id && user?.subscription?.status === 'active';
                        const isLoading = loadingTier === tier.id;

                        return (
                            <motion.div
                                key={tier.id}
                                whileHover={{ y: -6 }}
                                transition={{ duration: 0.3 }}
                                className={`relative flex flex-col rounded-[28px] overflow-hidden bg-[#111216] border ${
                                    tier.popular 
                                        ? 'border-amber-500/40 shadow-2xl shadow-amber-500/10 ring-1 ring-amber-500/30' 
                                        : 'border-white/10 shadow-xl'
                                }`}
                            >
                                {/* Top Badge if available (e.g. Save $199 with bundle) */}
                                {tier.badge && (
                                    <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold backdrop-blur-md">
                                        <span>⭐</span>
                                        <span>{tier.badge}</span>
                                    </div>
                                )}

                                {/* Cosmic Glowing Nebula Header Box */}
                                <div className={`relative p-7 sm:p-8 pt-10 sm:pt-12 bg-gradient-to-b ${tier.glowGradient} border-b border-white/5 overflow-hidden`}>
                                    
                                    {/* Starry dust texture effect */}
                                    <div 
                                        className="absolute inset-0 opacity-30 mix-blend-screen pointer-events-none"
                                        style={{
                                            backgroundImage: 'radial-gradient(circle at 50% 20%, rgba(255,255,255,0.8) 0.5px, transparent 1px), radial-gradient(circle at 20% 70%, rgba(255,255,255,0.6) 0.5px, transparent 1px), radial-gradient(circle at 80% 60%, rgba(255,255,255,0.7) 0.5px, transparent 1px)',
                                            backgroundSize: '40px 40px, 60px 60px, 80px 80px'
                                        }}
                                    />

                                    {/* Edition Icon Badge */}
                                    <div className={`w-9 h-9 rounded-xl ${tier.iconBg} flex items-center justify-center mb-5 relative z-10 shadow-md`}>
                                        <Icon size={18} />
                                    </div>

                                    {/* Title and Subtitle */}
                                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-1.5 relative z-10">
                                        {tier.name}
                                    </h3>
                                    <p className="text-xs sm:text-[13px] text-zinc-300 font-medium leading-relaxed mb-6 min-h-[36px] relative z-10 opacity-90">
                                        {tier.desc}
                                    </p>

                                    {/* Price tag */}
                                    <div className="flex items-baseline gap-1.5 mb-1 relative z-10">
                                        <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                                            {currencySymbol}{tier.price.toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold mb-6 relative z-10">
                                        {tier.period}
                                    </p>

                                    {/* Main Action Button */}
                                    <button
                                        type="button"
                                        onClick={() => handleSelectPlan(tier)}
                                        disabled={isLoading || isCurrentPlan}
                                        className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 relative z-10 active:scale-[0.98] ${
                                            isCurrentPlan
                                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                                                : tier.buttonStyle
                                        }`}
                                    >
                                        {isLoading ? (
                                            <>
                                                <RiLoader4Line size={16} className="animate-spin" />
                                                <span>Connecting Gateway...</span>
                                            </>
                                        ) : isCurrentPlan ? (
                                            <>
                                                <RiCheckLine size={16} />
                                                <span>Active Edition</span>
                                            </>
                                        ) : (
                                            <span>{tier.buttonText}</span>
                                        )}
                                    </button>
                                </div>

                                {/* Features List */}
                                <div className="p-7 sm:p-8 flex-1 flex flex-col justify-between bg-[#0e1015]">
                                    <ul className="space-y-3.5">
                                        {tier.features.map((feat, fIdx) => (
                                            <li key={fIdx} className="flex items-start gap-3 text-xs sm:text-[13px] text-zinc-300 font-medium">
                                                <div className="w-4 h-4 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0 mt-0.5 text-zinc-400">
                                                    <RiCheckLine size={12} />
                                                </div>
                                                <span>{feat}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-500">
                                        <span>Instant deployment</span>
                                        <span>UPI & Cards accepted</span>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* ── Frequently Asked Questions ── */}
                <div className="max-w-3xl mx-auto pt-8 sm:pt-14 space-y-6">
                    <div className="text-center space-y-2 mb-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-zinc-300">
                            <RiQuestionLine size={14} className="text-[#20b8cd]" />
                            <span>Transparent Details</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">
                            Frequently Asked Questions
                        </h2>
                    </div>

                    <div className="space-y-3">
                        {FAQS.map((faq, idx) => (
                            <div 
                                key={idx}
                                className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#111216] overflow-hidden transition-all shadow-xs"
                            >
                                <button
                                    type="button"
                                    onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                                    className="w-full flex items-center justify-between p-4 sm:p-5 text-left text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 hover:text-[#20b8cd] transition-colors cursor-pointer select-none"
                                >
                                    <span>{faq.q}</span>
                                    <RiArrowDownSLine 
                                        size={18} 
                                        className={`transition-transform duration-200 text-zinc-400 ${openFaq === idx ? 'rotate-180 text-[#20b8cd]' : ''}`} 
                                    />
                                </button>
                                {openFaq === idx && (
                                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal border-t border-zinc-100 dark:border-white/5 pt-3 animate-in fade-in duration-200">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </InfoPageLayout>
    );
}
