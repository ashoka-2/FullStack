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
    RiInfinityLine
} from '@remixicon/react';
import SettingsPageLayout from './SettingsPageLayout';
import { fetchSubscriptionStatus, createRazorpayOrder, verifyPaymentSignature } from '../../service/subscription.api';
import { setUser } from '../../auth.slice';
import { addToast } from '../../../../utils/toast.slice';

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

    const isPro = subscription?.plan === 'pro';
    const isEnterprise = subscription?.plan === 'enterprise';
    const isFree = !isPro && !isEnterprise;

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

    const getQueryPercentage = () => {
        if (quotas.queriesLimit === -1) return 100;
        return Math.min(100, Math.round((quotas.queriesToday / quotas.queriesLimit) * 100));
    };

    const getDocPercentage = () => {
        if (quotas.documentUploadsLimit === -1) return 100;
        return Math.min(100, Math.round((quotas.documentUploadsToday / quotas.documentUploadsLimit) * 100));
    };

    const getSocialPercentage = () => {
        if (quotas.socialPostsLimit === -1) return 100;
        return Math.min(100, Math.round((quotas.socialPostsThisMonth / quotas.socialPostsLimit) * 100));
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
                    isPro 
                        ? 'bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border-emerald-500/30'
                        : isEnterprise
                        ? 'bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-transparent border-purple-500/30'
                        : 'bg-white dark:bg-[#121212] border-zinc-200/80 dark:border-white/10'
                }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                                    isPro
                                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                        : isEnterprise
                                        ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30'
                                        : 'bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/10'
                                }`}>
                                    {subscription?.plan?.toUpperCase()} PLAN
                                </span>
                                <span className="text-[11px] font-semibold text-emerald-500 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    Active
                                </span>
                            </div>

                            <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">
                                {isPro ? 'Pro Researcher Tier' : isEnterprise ? 'Enterprise Workspace' : 'Free Community Tier'}
                            </h2>

                            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md leading-relaxed">
                                {isPro
                                    ? 'Full flagship intelligence with unlimited queries, Google Workspace sync, and universal social publishing.'
                                    : isEnterprise
                                    ? 'Dedicated inference infrastructure, team collaboration, and bespoke compliance.'
                                    : 'Basic daily research allocation. Upgrade anytime to unlock unlimited intelligence.'}
                            </p>
                        </div>

                        <div className="flex flex-col sm:items-end gap-2 shrink-0">
                            {isFree ? (
                                <button
                                    type="button"
                                    onClick={() => handleQuickUpgrade('pro', 'annual')}
                                    disabled={upgrading}
                                    className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                                >
                                    {upgrading ? <RiLoader4Line size={16} className="animate-spin" /> : <RiSparkling2Line size={16} />}
                                    <span>Upgrade to Pro ({proMonthlyDisplay}/mo)</span>
                                </button>
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
                        <div className="p-5 rounded-2xl bg-white dark:bg-[#121212] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                                    Daily AI Queries
                                </span>
                                <span className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1">
                                    {quotas.queriesLimit === -1 ? (
                                        <span className="flex items-center gap-1 text-emerald-500">
                                            <RiInfinityLine size={16} />
                                            <span>Unlimited</span>
                                        </span>
                                    ) : (
                                        `${quotas.queriesToday} / ${quotas.queriesLimit}`
                                    )}
                                </span>
                            </div>

                            <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-white/10 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                        quotas.queriesLimit === -1
                                            ? 'bg-emerald-500 w-full'
                                            : getQueryPercentage() > 80
                                            ? 'bg-red-500'
                                            : 'bg-cyan-500'
                                    }`}
                                    style={{ width: `${quotas.queriesLimit === -1 ? 100 : getQueryPercentage()}%` }}
                                />
                            </div>

                            <p className="text-[10px] text-zinc-400">
                                {quotas.queriesLimit === -1 ? 'No daily cap on inquiries' : 'Resets midnight every 24 hours'}
                            </p>
                        </div>

                        {/* Document & PDF Uploads */}
                        <div className="p-5 rounded-2xl bg-white dark:bg-[#121212] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                                    Document / RAG Uploads
                                </span>
                                <span className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1">
                                    {quotas.documentUploadsLimit === -1 ? (
                                        <span className="flex items-center gap-1 text-emerald-500">
                                            <RiInfinityLine size={16} />
                                            <span>Unlimited</span>
                                        </span>
                                    ) : (
                                        `${quotas.documentUploadsToday} / ${quotas.documentUploadsLimit}`
                                    )}
                                </span>
                            </div>

                            <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-white/10 overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-blue-500 transition-all duration-500"
                                    style={{ width: `${quotas.documentUploadsLimit === -1 ? 100 : getDocPercentage()}%` }}
                                />
                            </div>

                            <p className="text-[10px] text-zinc-400">
                                {quotas.documentUploadsLimit === -1 ? 'Unlimited document research' : `${quotas.documentUploadsLimit} uploads included in plan`}
                            </p>
                        </div>

                        {/* Social Media Posts */}
                        <div className="p-5 rounded-2xl bg-white dark:bg-[#121212] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                                    Social Publishing / Mo
                                </span>
                                <span className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1">
                                    {quotas.socialPostsLimit === -1 ? (
                                        <span className="flex items-center gap-1 text-emerald-500">
                                            <RiInfinityLine size={16} />
                                            <span>Unlimited</span>
                                        </span>
                                    ) : (
                                        `${quotas.socialPostsThisMonth} / ${quotas.socialPostsLimit}`
                                    )}
                                </span>
                            </div>

                            <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-white/10 overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-purple-500 transition-all duration-500"
                                    style={{ width: `${quotas.socialPostsLimit === -1 ? 100 : getSocialPercentage()}%` }}
                                />
                            </div>

                            <p className="text-[10px] text-zinc-400">
                                Across YouTube, X, Instagram, LinkedIn & more
                            </p>
                        </div>

                    </div>
                </div>

                {/* ── Plan Comparison Table / Quick Switch ── */}
                <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200/80 dark:border-white/10 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-0.5">
                            <h4 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                <RiShieldCheckLine size={18} className="text-cyan-500" />
                                <span>Compare Tiers & Features</span>
                            </h4>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                View full model matrix, storage limits, and enterprise capabilities.
                            </p>
                        </div>
                        <Link
                            to="/pricing"
                            className="shrink-0 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-black font-bold text-xs flex items-center gap-1.5 transition-all self-start sm:self-auto"
                        >
                            <span>View Full Pricing Matrix</span>
                            <RiArrowRightLine size={14} />
                        </Link>
                    </div>
                </div>

            </div>
        </SettingsPageLayout>
    );
}
