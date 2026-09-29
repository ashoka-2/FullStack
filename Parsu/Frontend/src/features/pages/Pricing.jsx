import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'motion/react';
import {
    RiCheckLine,
    RiSparkling2Line,
    RiFlashlightLine,
    RiShieldCheckLine,
    RiQuestionLine,
    RiArrowDownSLine,
    RiLoader4Line,
    RiGlobalLine,
    RiLockLine,
    RiCpuLine,
    RiCompass3Line,
    RiDatabase2Line,
    RiArrowRightLine
} from '@remixicon/react';
import InfoPageLayout from './InfoPageLayout';
import { createRazorpayOrder, verifyPaymentSignature } from '../auth/service/subscription.api';
import { setUser } from '../auth/auth.slice';
import { addToast } from '../../utils/toast.slice';

export default function Pricing() {
    const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'
    const [currency, setCurrency] = useState('USD');
    const [isIndia, setIsIndia] = useState(false);
    const [openFaq, setOpenFaq] = useState(null);
    const [loadingTier, setLoadingTier] = useState(null);
    
    // Live pricing toggle state (admin controllable via localStorage or Admin Dashboard)
    const [isPricingPublished, setIsPricingPublished] = useState(() => {
        return localStorage.getItem('parsu_admin_pricing_published') === 'true';
    });

    const { user } = useSelector(state => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Auto-detect user's location on mount
    useEffect(() => {
        try {
            const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
            const languages = navigator.languages ? navigator.languages.join(',') : navigator.language || '';
            const inIndia = timeZone.includes('Calcutta') || timeZone.includes('Kolkata') || languages.includes('-IN') || languages.includes('hi');
            if (inIndia) {
                setCurrency('INR');
                setIsIndia(true);
            } else {
                setCurrency('USD');
                setIsIndia(false);
            }
        } catch (e) {
            setCurrency('USD');
        }

        // Listen for storage events (if admin toggles pricing visibility in another tab)
        const handleStorageChange = () => {
            setIsPricingPublished(localStorage.getItem('parsu_admin_pricing_published') === 'true');
        };
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('parsu_pricing_visibility_changed', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('parsu_pricing_visibility_changed', handleStorageChange);
        };
    }, []);

    const currencySymbol = currency === 'INR' ? '₹' : '$';

    // Pricing definitions matching user's exact specification
    const TIERS = [
        {
            id: 'free',
            name: 'Starter',
            badge: 'Free Forever',
            desc: 'Essential multi-model AI reasoning, live web search & custom model BYOK integration.',
            monthlyPrice: 0,
            yearlyPrice: 0,
            period: 'Free forever',
            icon: RiFlashlightLine,
            isFree: true,
            isComingSoon: false,
            features: [
                '50 AI messages per day (built-in models)',
                'Unlimited AI messages when custom API key added',
                '2 RAG file uploads per day (5 with custom API key)',
                '10 social media posts daily (20 with custom API key)',
                'Live internet search with real-time citations',
                'Multimodal vision image analysis & captioning',
                'Standard response speed & community support'
            ]
        },
        {
            id: 'pro',
            name: 'Pro',
            badge: 'Most Popular',
            desc: 'Advanced intelligence with flagship reasoning models and expanded quotas.',
            monthlyPrice: currency === 'INR' ? 499 : 9,
            yearlyPrice: currency === 'INR' ? 399 : 7,
            period: billingCycle === 'yearly' ? 'billed annually' : 'billed monthly',
            icon: RiSparkling2Line,
            popular: true,
            isFree: false,
            isComingSoon: true,
            features: [
                '50 AI messages per day on built-in flagship models',
                'Unlimited AI messages when custom API key added',
                '10 RAG file uploads per day (15 with custom API key)',
                '50 social media posts daily (with or without custom key)',
                'Full access to Claude 3.7 Sonnet, GPT-4o & Gemini Pro',
                'Cross-chat vector memory & custom instructions',
                'Priority inference GPU queue & fast responses'
            ]
        },
        {
            id: 'ultra',
            name: 'Ultra',
            badge: 'Maximum Power',
            desc: 'Unrestricted frontier reasoning, massive context, and unlimited everything.',
            monthlyPrice: currency === 'INR' ? 999 : 19,
            yearlyPrice: currency === 'INR' ? 799 : 15,
            period: billingCycle === 'yearly' ? 'billed annually' : 'billed monthly',
            icon: RiCpuLine,
            isFree: false,
            isComingSoon: true,
            features: [
                'Everything Unlimited — No daily caps or restrictions',
                'Unlimited AI messages across all frontier models',
                'Unlimited RAG document & PDF uploads',
                'Unlimited social media posts across all platforms',
                'Frontier models: OpenAI o1, o3-mini & DeepSeek R1',
                'Massive 1M+ token context window',
                'Dedicated high-throughput compute pipeline',
                '24/7 Priority support & VIP private channel'
            ]
        }
    ];

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

    const handleSelectPlan = async (tier) => {
        if (tier.isFree) {
            navigate('/ai');
            return;
        }

        if (!isPricingPublished) {
            return; // Paid tiers are locked in coming soon state
        }

        if (!user) {
            dispatch(addToast({ type: 'info', message: 'Please create an account or sign in to complete your subscription.' }));
            navigate(`/auth?mode=register&redirect=/pricing`);
            return;
        }

        setLoadingTier(tier.id);

        try {
            const orderData = await createRazorpayOrder({ 
                plan: tier.id, 
                billingCycle, 
                currency 
            });

            if (!orderData?.orderId) {
                throw new Error(orderData?.message || 'Failed to create payment order');
            }

            const isLoaded = await loadRazorpay();
            if (!isLoaded) {
                throw new Error('Unable to connect to payment gateway');
            }

            const options = {
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency || currency,
                name: 'Parsu AI',
                description: `${tier.name} Plan (${billingCycle})`,
                order_id: orderData.orderId,
                handler: async (response) => {
                    try {
                        const verifyRes = await verifyPaymentSignature({
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                            plan: tier.id,
                            billingCycle,
                            currency
                        });

                        if (verifyRes.success) {
                            dispatch(setUser(verifyRes.user));
                            dispatch(addToast({ type: 'success', message: `🎉 Welcome to Parsu AI ${tier.name}!` }));
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
                        dispatch(addToast({ type: 'info', message: 'Payment modal closed.' }));
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

    const FAQS = [
        {
            q: 'How does India vs International pricing work?',
            a: 'Parsu AI automatically checks your location. Visitors in India are shown local Indian Rupee (₹) pricing with localized UPI support. International visitors receive standard USD ($) pricing.'
        },
        {
            q: 'Can I start with the Free plan?',
            a: 'Yes! The Starter Free plan is available immediately with zero credit card required. You get unlimited multi-model queries and live web search.'
        },
        {
            q: 'When will Pro and Ultra plans become active?',
            a: 'Paid plans are currently in early-access preview mode. When live deployment is activated, you will be able to subscribe seamlessly with monthly and yearly billing.'
        },
        {
            q: 'Can I bring my own API keys (BYOK)?',
            a: 'Yes, you can configure your own Gemini, OpenAI, or Anthropic keys in Settings > API Keys at any time.'
        }
    ];

    return (
        <InfoPageLayout
            title="Transparent, Predictable Pricing"
            subtitle="Start free with powerful AI models, or upgrade to unleash full research capabilities."
            badge="Plans & Pricing"
        >
            <div className="space-y-12 max-w-6xl mx-auto">
                
                {/* ── Currency & Location Indicator + Monthly/Yearly Toggle ── */}
                <div className="flex flex-col items-center gap-6">
                    {/* Location detection pill */}
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-600 dark:text-zinc-300">
                        {isIndia ? (
                            <>
                                <span className="text-sm">🇮🇳</span>
                                <span className="font-semibold text-zinc-900 dark:text-white">India Localized Pricing (₹ INR)</span>
                            </>
                        ) : (
                            <>
                                <RiGlobalLine size={14} className="text-[var(--accent-cyan)]" />
                                <span className="font-semibold text-zinc-900 dark:text-white">International Pricing ($ USD)</span>
                            </>
                        )}
                        <span className="text-zinc-400 dark:text-zinc-500">•</span>
                        {/* Currency switcher button */}
                        <button
                            type="button"
                            onClick={() => setCurrency(currency === 'INR' ? 'USD' : 'INR')}
                            className="text-[var(--accent-cyan)] hover:underline font-mono text-[11px] cursor-pointer"
                        >
                            Switch to {currency === 'INR' ? 'USD ($)' : 'INR (₹)'}
                        </button>
                    </div>

                    {/* Monthly / Yearly Switcher */}
                    <div className="inline-flex items-center p-1 rounded-full bg-zinc-200/70 dark:bg-white/[0.04] border border-zinc-300 dark:border-white/[0.08] shadow-inner">
                        <button
                            type="button"
                            onClick={() => setBillingCycle('monthly')}
                            className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                billingCycle === 'monthly'
                                    ? 'bg-[var(--accent-cyan)] text-zinc-950 shadow-md'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
                            }`}
                        >
                            Monthly Billing
                        </button>
                        <button
                            type="button"
                            onClick={() => setBillingCycle('yearly')}
                            className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                billingCycle === 'yearly'
                                    ? 'bg-[var(--accent-cyan)] text-zinc-950 shadow-md'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
                            }`}
                        >
                            <span>Yearly Billing</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                billingCycle === 'yearly'
                                    ? 'bg-black/25 text-zinc-950'
                                    : 'bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30'
                            }`}>
                                Save 20%
                            </span>
                        </button>
                    </div>
                </div>

                {/* ── 3 Pricing Cards Grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
                    {TIERS.map((tier) => {
                        const Icon = tier.icon;
                        const isBlurred = tier.isBlur;
                        const displayPrice = isBlurred
                            ? 'xxx'
                            : (billingCycle === 'yearly' ? tier.yearlyPrice : tier.monthlyPrice);

                        return (
                            <div
                                key={tier.id}
                                className={`relative flex flex-col rounded-3xl overflow-hidden transition-all duration-300 ${
                                    tier.popular
                                        ? 'bg-white dark:bg-[#101217] border-2 border-[var(--accent-cyan)] shadow-2xl shadow-cyan-500/10'
                                        : 'bg-white dark:bg-[#0d0e12] border border-zinc-200 dark:border-white/[0.08] shadow-lg'
                                }`}
                            >
                                {/* Top Badge */}
                                {tier.badge && (
                                    <div className="absolute top-4 right-4 z-20">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                            tier.popular
                                                ? 'bg-[var(--accent-cyan)] text-zinc-950 shadow-sm'
                                                : 'bg-zinc-100 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/10'
                                        }`}>
                                            {tier.badge}
                                        </span>
                                    </div>
                                )}

                                {/* Card Header */}
                                <div className="p-7 sm:p-8 border-b border-zinc-100 dark:border-white/[0.06] relative">
                                    <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-white/[0.05] border border-zinc-200 dark:border-white/10 flex items-center justify-center text-[var(--accent-cyan)] mb-4">
                                        <Icon size={20} />
                                    </div>
                                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">{tier.name}</h3>
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 min-h-[36px] leading-relaxed">
                                        {tier.desc}
                                    </p>

                                    {/* Price section */}
                                    <div className="mt-6 flex items-baseline gap-1.5">
                                        {isBlurred ? (
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-3xl sm:text-4xl font-black text-zinc-400 dark:text-zinc-500 tracking-tight font-mono select-none">
                                                    {currencySymbol}xxx
                                                </span>
                                                <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">/month</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight">
                                                    {currencySymbol}{displayPrice}
                                                </span>
                                                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                                                    {tier.isFree ? '' : '/month'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
                                        {isBlurred ? 'Pricing under unveiling' : tier.period}
                                    </p>
                                </div>

                                {/* Features List & Action Container */}
                                <div className="p-7 sm:p-8 flex-1 flex flex-col justify-between relative">
                                    {/* Features */}
                                    <ul className="space-y-3.5 mb-8">
                                        {tier.features.map((feat, fIdx) => (
                                            <li key={fIdx} className="flex items-start gap-3 text-xs text-zinc-700 dark:text-zinc-300">
                                                <div className="w-4 h-4 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[var(--accent-cyan)] flex items-center justify-center shrink-0 mt-0.5">
                                                    <RiCheckLine size={11} />
                                                </div>
                                                <span>{feat}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {/* CTA Button */}
                                    <div className="relative z-10">
                                        {tier.isComingSoon ? (
                                            <button
                                                type="button"
                                                disabled={true}
                                                className="w-full py-3.5 px-4 rounded-2xl text-xs font-bold bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-400 dark:text-zinc-500 cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-wider select-none shadow-none"
                                            >
                                                <RiLockLine size={14} />
                                                <span>Coming Soon</span>
                                            </button>
                                        ) : tier.isFree ? (
                                            <Link
                                                to="/ai"
                                                className="w-full py-3.5 px-4 rounded-2xl text-xs font-bold bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.98]"
                                            >
                                                <span>Get Started Free</span>
                                                <RiArrowRightLine size={15} />
                                            </Link>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => handleSelectPlan(tier)}
                                                disabled={loadingTier === tier.id}
                                                className={`w-full py-3.5 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] ${
                                                    tier.popular
                                                        ? 'bg-[var(--accent-cyan)] text-zinc-950 hover:bg-[var(--accent-cyan-hover)] shadow-lg shadow-cyan-500/20'
                                                        : 'bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white/10 dark:hover:bg-white/20 dark:text-white border border-transparent dark:border-white/10'
                                                }`}
                                            >
                                                {loadingTier === tier.id ? (
                                                    <>
                                                        <RiLoader4Line size={15} className="animate-spin" />
                                                        <span>Connecting Gateway...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>Subscribe to {tier.name}</span>
                                                        <RiArrowRightLine size={15} />
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ── FAQ Section ── */}
                <div className="pt-12 border-t border-zinc-200 dark:border-white/[0.08]">
                    <div className="text-center mb-10">
                        <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Frequently Asked Questions</h2>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">Everything you need to know about billing, models, and quotas.</p>
                    </div>

                    <div className="max-w-3xl mx-auto space-y-3">
                        {FAQS.map((faq, index) => {
                            const isOpen = openFaq === index;
                            return (
                                <div
                                    key={index}
                                    className="rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.06] overflow-hidden transition-colors"
                                >
                                    <button
                                        type="button"
                                        onClick={() => setOpenFaq(isOpen ? null : index)}
                                        className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                                    >
                                        <span className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200">{faq.q}</span>
                                        <RiArrowDownSLine
                                            size={18}
                                            className={`text-zinc-500 dark:text-zinc-400 transition-transform duration-200 shrink-0 ${
                                                isOpen ? 'rotate-180 text-[var(--accent-cyan)]' : ''
                                            }`}
                                        />
                                    </button>
                                    {isOpen && (
                                        <div className="px-4 sm:px-5 pb-5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-200/60 dark:border-white/[0.04] pt-3">
                                            {faq.a}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </InfoPageLayout>
    );
}
