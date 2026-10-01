import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import {
    RiVipCrownLine,
    RiFlashlightLine,
    RiShieldCheckLine,
    RiCheckLine,
    RiArrowRightLine,
    RiRefreshLine,
    RiSparkling2Line,
    RiInformationLine,
    RiLoader4Line,
    RiFileList3Line,
    RiShareForwardLine,
    RiInfinityLine,
    RiKey2Line
} from '@remixicon/react';
import SettingsPageLayout from './SettingsPageLayout';
import { fetchSubscriptionStatus, createRazorpayOrder, verifyPaymentSignature } from '../../service/subscription.api';
import { setUser } from '../../auth.slice';
import { addToast } from '../../../../utils/toast.slice';
import ThemedSkeleton from '../../../Components/SkeletonLoader';

export default function SubscriptionSettingsPage() {
    const { user } = useSelector(state => state.auth);
    const dispatch = useDispatch();

    const [subscription, setSubscription] = useState(user?.subscription || { plan: 'free', status: 'active', billingCycle: 'none' });
    const [quotas, setQuotas] = useState(user?.usageQuotas || { queriesToday: 0, queriesLimit: 50, documentUploadsToday: 0, documentUploadsLimit: 2, socialPostsThisMonth: 0, socialPostsLimit: 10 });
    const [loading, setLoading] = useState(true);
    const [upgrading, setUpgrading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const res = await fetchSubscriptionStatus();
            if (res.success) {
                setSubscription(res.subscription);
                setQuotas(res.quotas);
            }
        } catch (err) {
            console.error('Failed to load subscription data:', err);
        } finally {
            setLoading(false);
        }
    };

    const isUltra = subscription?.plan === 'ultra' || subscription?.plan === 'enterprise';
    const isPro = subscription?.plan === 'pro';
    const isFree = !isPro && !isUltra;

    const [currency, setCurrency] = useState('USD');

    useEffect(() => {
        try {
            const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
            const languages = navigator.languages ? navigator.languages.join(',') : navigator.language || '';
            const isIndia = timeZone.includes('Calcutta') || timeZone.includes('Kolkata') || languages.includes('-IN') || languages.includes('hi');
            if (isIndia) {
                setCurrency('INR');
            } else {
                setCurrency('USD');
            }
        } catch (e) {
            setCurrency('USD');
        }
    }, []);

    const currencySymbol = currency === 'INR' ? '₹' : '$';
    const proMonthlyDisplay = currency === 'INR' ? '₹1,199' : '$15';

    // Load Razorpay checkout script if needed
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

    const handleQuickUpgrade = async (plan = 'pro', billingCycle = 'annual') => {
        setUpgrading(true);
        try {
            const orderData = await createRazorpayOrder({ plan, billingCycle, currency });

            if (!orderData?.orderId) {
                throw new Error(orderData?.message || 'Failed to create payment order');
            }

            const isLoaded = await loadRazorpay();
            if (!isLoaded) {
                dispatch(addToast({ type: 'error', message: 'Failed to load Razorpay payment gateway.' }));
                setUpgrading(false);
                return;
            }

            const options = {
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency || currency,
                name: 'Parsu AI',
                description: `${plan.toUpperCase()} Subscription (${billingCycle})`,
                order_id: orderData.orderId,
                handler: async (response) => {
                    try {
                        const verifyRes = await verifyPaymentSignature({
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                            plan,
                            billingCycle,
                            currency
                        });
                        if (verifyRes.success) {
                            dispatch(setUser(verifyRes.user));
                            setSubscription(verifyRes.subscription);
                            setQuotas(verifyRes.quotas);
                            dispatch(addToast({ type: 'success', message: `Welcome to ${plan.toUpperCase()}!` }));
                        } else {
                            dispatch(addToast({ type: 'error', message: verifyRes.message || 'Payment verification failed' }));
                        }
                    } catch (vErr) {
                        dispatch(addToast({ type: 'error', message: vErr.response?.data?.message || 'Payment verification rejected by server' }));
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
                        dispatch(addToast({ type: 'info', message: 'Payment cancelled.' }));
                        setUpgrading(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (resp) {
                dispatch(addToast({ type: 'error', message: resp.error?.description || 'Payment was unsuccessful.' }));
            });
            rzp.open();
        } catch (err) {
            dispatch(addToast({ type: 'error', message: err.response?.data?.message || err.message || 'Could not initiate checkout' }));
        } finally {
            setUpgrading(false);
        }
    };

    const hasCustomKeys = Boolean(quotas?.hasCustomKey) || Boolean(user?.customApiKeys && user.customApiKeys.some(k => k.isActive !== false && k.apiKey)) || Boolean(user?.geminiApiKey);
    const isUnlimitedQueries = isUltra || hasCustomKeys || quotas.queriesLimit === -1;
    const effectiveQueriesLimit = isUnlimitedQueries ? -1 : (quotas.queriesLimit || 50);
    const effectiveDocLimit = isUltra ? -1 : (isPro ? (hasCustomKeys ? 15 : 10) : (hasCustomKeys ? 5 : 2));
    const effectiveSocialLimit = isUltra ? -1 : (isPro ? 50 : (hasCustomKeys ? 20 : 10));

    const getQueryPercentage = () => {
        if (isUnlimitedQueries) return 100;
        return Math.min(100, Math.round(((quotas.queriesToday || 0) / effectiveQueriesLimit) * 100));
    };

    const getDocPercentage = () => {
        if (effectiveDocLimit === -1) return 100;
        return Math.min(100, Math.round(((quotas.documentUploadsToday || 0) / effectiveDocLimit) * 100));
    };

    const getSocialPercentage = () => {
        if (effectiveSocialLimit === -1) return 100;
        return Math.min(100, Math.round(((quotas.socialPostsThisMonth || 0) / effectiveSocialLimit) * 100));
    };

    return (
        <SettingsPageLayout
            title="Subscription & Quotas"
            icon={RiVipCrownLine}
            description="Manage your tier, monitor daily limits, and unlock unlimited intelligence."
        >
            <div className="space-y-6 sm:space-y-8">
                
                {/* ── Current Active Tier Card ── */}
                <div className={`p-6 sm:p-7 rounded-3xl border transition-all duration-300 relative overflow-hidden shadow-lg ${
                    isUltra
                        ? 'bg-gradient-to-br from-amber-500/10 via-cyan-500/5 to-transparent border-cyan-500/30'
                        : isPro 
                        ? 'bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border-emerald-500/30'
                        : 'bg-white dark:bg-[var(--bg-surface)] border-zinc-200/80 dark:border-white/10'
                }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                                {loading ? (
                                    <ThemedSkeleton width={80} height={18} borderRadius="9999px" />
                                ) : (
                                    <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                                        isUltra
                                            ? 'bg-gradient-to-r from-amber-500/20 to-cyan-500/20 text-cyan-300 border-cyan-500/30'
                                            : isPro
                                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                            : 'bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/10'
                                    }`}>
                                        {subscription?.plan?.toUpperCase()} PLAN
                                    </span>
                                )}
                                <span className="text-[11px] font-semibold text-emerald-500 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    Active
                                </span>
                            </div>

                            <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">
                                {isUltra ? 'Ultra Tier' : isPro ? 'Pro Researcher Tier' : 'Free Community Tier'}
                            </h2>

                            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md leading-relaxed">
                                {isUltra
                                    ? 'Unrestricted frontier reasoning, massive 1M+ token context, and dedicated compute pipelines.'
                                    : isPro
                                    ? 'Full flagship intelligence with unlimited queries, Google Workspace sync, and universal social publishing.'
                                    : 'Community Starter tier active. Paid Pro & Ultra tiers with expanded quotas are currently in early-access preview and coming soon.'}
                            </p>
                        </div>

                        <div className="flex flex-col sm:items-end gap-2 shrink-0">
                            {isFree ? (
                                <div className="flex flex-col sm:items-end gap-2">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-[11px] font-bold text-[var(--accent-cyan)]">
                                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                        <span>Pro & Ultra Tiers Coming Soon</span>
                                    </div>
                                    <Link
                                        to="/pricing"
                                        className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/10 dark:hover:bg-white/15 text-zinc-800 dark:text-zinc-200 font-semibold text-xs flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
                                    >
                                        <span>Preview Plans</span>
                                        <RiArrowRightLine size={13} />
                                    </Link>
                                </div>
                            ) : (
                                <Link
                                    to="/pricing"
                                    className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/10 dark:hover:bg-white/15 text-zinc-800 dark:text-zinc-200 font-semibold text-xs flex items-center gap-1.5 transition-all"
                                >
                                    <span>Manage Plan</span>
                                    <RiArrowRightLine size={14} />
                                </Link>
                            )}

                            {subscription?.endDate && (
                                <span className="text-[10px] text-zinc-400">
                                    Renews on {new Date(subscription.endDate).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Custom API Key Benefit Status Banner ── */}
                {hasCustomKeys ? (
                    <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 shrink-0">
                                <RiKey2Line size={20} />
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                        <RiCheckLine size={12} />
                                        Custom Key Added
                                    </span>
                                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                        BYOK Boost Active
                                    </span>
                                </div>
                                <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                                    <strong>Unlimited</strong> AI Messages &bull; <strong>{isPro ? '15' : '5'}</strong> RAG file uploads/day &bull; <strong>{isPro ? '50' : '20'}</strong> Social media posts/day
                                </p>
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                    When you prompt the AI, requests route to your custom model with automatic multi-model failover on quota limits.
                                </p>
                            </div>
                        </div>
                        <Link
                            to="/settings/api-keys"
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 font-semibold text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                        >
                            <span>Manage Keys</span>
                            <RiArrowRightLine size={13} />
                        </Link>
                    </div>
                ) : (
                    <div className="p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 shrink-0">
                                <RiKey2Line size={20} />
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                                        Standard Quotas (No Custom Key)
                                    </span>
                                </div>
                                <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                                    Daily 50 messages &bull; 2 RAG file uploads/day &bull; 10 Social posts/day
                                </p>
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                    Add your custom API key to unlock <strong>Unlimited AI messages</strong>, <strong>5 RAG uploads/day</strong>, and <strong>20 social posts daily</strong>!
                                </p>
                            </div>
                        </div>
                        <Link
                            to="/settings/api-keys"
                            className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-semibold text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                        >
                            <span>Add Custom Key</span>
                            <RiArrowRightLine size={13} />
                        </Link>
                    </div>
                )}

                {/* ── Real-Time Resource Quotas Dashboard ── */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                            <RiFlashlightLine size={16} className="text-cyan-500" />
                            <span>Resource Usage & Limits</span>
                        </h3>
                        <button
                            type="button"
                            onClick={loadData}
                            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg hover:bg-zinc-200/50 dark:hover:bg-white/5 transition-all cursor-pointer"
                            title="Refresh Quota Telemetry"
                        >
                            <RiRefreshLine size={14} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        
                        {/* Daily AI Queries */}
                        <div className="p-5 rounded-2xl bg-white dark:bg-[var(--bg-surface)] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                                    Daily AI Messages
                                </span>
                                <span className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1">
                                    {loading ? (
                                        <ThemedSkeleton width={50} height={14} />
                                    ) : isUnlimitedQueries ? (
                                        <span className="flex items-center gap-1 text-emerald-500">
                                            <RiInfinityLine size={16} />
                                            <span>Unlimited</span>
                                        </span>
                                    ) : (
                                        `${quotas.queriesToday || 0} / ${effectiveQueriesLimit}`
                                    )}
                                </span>
                            </div>

                            <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-white/10 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                        isUnlimitedQueries
                                            ? 'bg-emerald-500 w-full'
                                            : getQueryPercentage() > 80
                                            ? 'bg-red-500'
                                            : 'bg-cyan-500'
                                    }`}
                                    style={{ width: `${isUnlimitedQueries ? 100 : getQueryPercentage()}%` }}
                                />
                            </div>

                            <p className="text-[10px] text-zinc-400">
                                {isUnlimitedQueries ? 'Custom key active — Unlimited messages & multi-model failover' : '50 messages per day (Add custom key for Unlimited)'}
                            </p>
                        </div>

                        {/* Document & PDF Uploads */}
                        <div className="p-5 rounded-2xl bg-white dark:bg-[var(--bg-surface)] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                                    Document / RAG Uploads
                                </span>
                                <span className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1">
                                    {loading ? (
                                        <ThemedSkeleton width={50} height={14} />
                                    ) : effectiveDocLimit === -1 ? (
                                        <span className="flex items-center gap-1 text-emerald-500">
                                            <RiInfinityLine size={16} />
                                            <span>Unlimited</span>
                                        </span>
                                    ) : (
                                        `${quotas.documentUploadsToday || 0} / ${effectiveDocLimit}`
                                    )}
                                </span>
                            </div>

                            <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-white/10 overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-blue-500 transition-all duration-500"
                                    style={{ width: `${effectiveDocLimit === -1 ? 100 : getDocPercentage()}%` }}
                                />
                            </div>

                            <p className="text-[10px] text-zinc-400">
                                {effectiveDocLimit === -1
                                    ? 'Unlimited document research'
                                    : hasCustomKeys
                                    ? `${effectiveDocLimit} uploads daily with custom key`
                                    : `${effectiveDocLimit} uploads daily standard (Add custom key to get 5/day)`}
                            </p>
                        </div>

                        {/* Social Media Posts */}
                        <div className="p-5 rounded-2xl bg-white dark:bg-[var(--bg-surface)] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                                    Social Publishing / Day
                                </span>
                                <span className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1">
                                    {loading ? (
                                        <ThemedSkeleton width={50} height={14} />
                                    ) : effectiveSocialLimit === -1 ? (
                                        <span className="flex items-center gap-1 text-emerald-500">
                                            <RiInfinityLine size={16} />
                                            <span>Unlimited</span>
                                        </span>
                                    ) : (
                                        `${quotas.socialPostsThisMonth || 0} / ${effectiveSocialLimit}`
                                    )}
                                </span>
                            </div>

                            <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-white/10 overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-purple-500 transition-all duration-500"
                                    style={{ width: `${effectiveSocialLimit === -1 ? 100 : getSocialPercentage()}%` }}
                                />
                            </div>

                            <p className="text-[10px] text-zinc-400">
                                {effectiveSocialLimit === -1
                                    ? 'Unlimited social publishing across platforms'
                                    : hasCustomKeys
                                    ? `${effectiveSocialLimit} posts daily with custom key`
                                    : `${effectiveSocialLimit} posts daily standard (Add custom key for 20/day)`}
                            </p>
                        </div>

                    </div>
                </div>

                {/* ── Quota Matrix Comparison ── */}
                <div className="p-6 rounded-3xl bg-white dark:bg-[var(--bg-surface)] border border-zinc-200/80 dark:border-white/10 space-y-4 shadow-xs">
                    <div>
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                            <RiShieldCheckLine size={18} className="text-cyan-500" />
                            <span>Plan & Custom Key Quota Matrix</span>
                        </h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            Detailed overview of daily allowances based on plan and custom API key status.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                        {/* Free - Default */}
                        <div className={`p-4 rounded-2xl border ${!hasCustomKeys && isFree ? 'border-cyan-500/50 bg-cyan-500/5 ring-1 ring-cyan-500/30' : 'border-zinc-200/80 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.02]'} space-y-2`}>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-zinc-900 dark:text-white">Free (Default)</span>
                                {!hasCustomKeys && isFree && <span className="text-[10px] font-extrabold text-cyan-500">Current</span>}
                            </div>
                            <ul className="text-xs space-y-1.5 text-zinc-600 dark:text-zinc-400">
                                <li className="flex items-center gap-1.5"><RiCheckLine size={14} className="text-emerald-500 shrink-0" /> 50 messages / day</li>
                                <li className="flex items-center gap-1.5"><RiCheckLine size={14} className="text-emerald-500 shrink-0" /> 2 RAG files / day</li>
                                <li className="flex items-center gap-1.5"><RiCheckLine size={14} className="text-emerald-500 shrink-0" /> 10 social posts / day</li>
                            </ul>
                        </div>

                        {/* Free - Custom Key */}
                        <div className={`p-4 rounded-2xl border ${hasCustomKeys && isFree ? 'border-emerald-500/50 bg-emerald-500/5 ring-1 ring-emerald-500/30' : 'border-zinc-200/80 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.02]'} space-y-2`}>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                    <RiKey2Line size={13} />
                                    Free + Custom Key
                                </span>
                                {hasCustomKeys && isFree && <span className="text-[10px] font-extrabold text-emerald-500">Current</span>}
                            </div>
                            <ul className="text-xs space-y-1.5 text-zinc-600 dark:text-zinc-400">
                                <li className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400"><RiCheckLine size={14} className="shrink-0" /> Unlimited messages</li>
                                <li className="flex items-center gap-1.5"><RiCheckLine size={14} className="text-emerald-500 shrink-0" /> 5 RAG files / day</li>
                                <li className="flex items-center gap-1.5"><RiCheckLine size={14} className="text-emerald-500 shrink-0" /> 20 social posts / day</li>
                            </ul>
                        </div>

                        {/* Pro Plan */}
                        <div className={`p-4 rounded-2xl border ${isPro ? 'border-cyan-500/50 bg-cyan-500/5 ring-1 ring-cyan-500/30' : 'border-zinc-200/80 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.02]'} space-y-2`}>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-zinc-900 dark:text-white">Pro Plan</span>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500">Coming Soon</span>
                            </div>
                            <ul className="text-xs space-y-1.5 text-zinc-600 dark:text-zinc-400">
                                <li className="flex items-center gap-1.5"><RiCheckLine size={14} className="text-emerald-500 shrink-0" /> 50 msgs / day (or Unlimited w/ key)</li>
                                <li className="flex items-center gap-1.5"><RiCheckLine size={14} className="text-emerald-500 shrink-0" /> 10 RAG files (15 w/ key)</li>
                                <li className="flex items-center gap-1.5"><RiCheckLine size={14} className="text-emerald-500 shrink-0" /> 50 social posts / day</li>
                            </ul>
                        </div>

                        {/* Ultra Plan */}
                        <div className={`p-4 rounded-2xl border ${isUltra ? 'border-amber-500/50 bg-amber-500/5 ring-1 ring-amber-500/30' : 'border-zinc-200/80 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.02]'} space-y-2`}>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-amber-500">Ultra Plan</span>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500">Coming Soon</span>
                            </div>
                            <ul className="text-xs space-y-1.5 text-zinc-600 dark:text-zinc-400">
                                <li className="flex items-center gap-1.5 font-semibold text-amber-500"><RiInfinityLine size={14} className="shrink-0" /> Unlimited messages</li>
                                <li className="flex items-center gap-1.5 font-semibold text-amber-500"><RiInfinityLine size={14} className="shrink-0" /> Unlimited RAG files</li>
                                <li className="flex items-center gap-1.5 font-semibold text-amber-500"><RiInfinityLine size={14} className="shrink-0" /> Unlimited social posts</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* ── Plan Comparison Table / Quick Switch ── */}
                <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200/80 dark:border-white/10 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-0.5">
                            <h4 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                <RiShieldCheckLine size={18} className="text-cyan-500" />
                                <span>Upcoming Tiers & Quota Expansion</span>
                            </h4>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                Explore upcoming model access, larger file contexts, and multi-network capabilities.
                            </p>
                        </div>
                        <Link
                            to="/pricing"
                            className="shrink-0 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-black font-bold text-xs flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
                        >
                            <span>Preview Upcoming Plans</span>
                            <RiArrowRightLine size={14} />
                        </Link>
                    </div>
                </div>

            </div>
        </SettingsPageLayout>
    );
}
