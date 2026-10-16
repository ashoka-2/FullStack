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
                <div className={`p-6 sm:p-7 rounded-[28px] border transition-all duration-300 relative overflow-hidden bg-[var(--surface)] border-[var(--line)] ${
                    isUltra
                        ? 'ring-1 ring-[var(--accent)]/30'
                        : isPro 
                        ? 'ring-1 ring-[var(--success)]/30'
                        : ''
                }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                                {loading ? (
                                    <ThemedSkeleton width={80} height={18} borderRadius="9999px" />
                                ) : (
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[var(--surface-2)] text-[var(--accent-text)] border border-[var(--line)]">
                                        {subscription?.plan?.toUpperCase()} PLAN
                                    </span>
                                )}
                                <span className="text-xs font-semibold text-[var(--success)] flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
                                    Active
                                </span>
                            </div>

                            <h2 className="text-xl sm:text-2xl font-semibold text-[var(--text)]">
                                {isUltra ? 'Ultra Tier' : isPro ? 'Pro Researcher Tier' : 'Free Community Tier'}
                            </h2>

                            <p className="text-xs text-[var(--text-muted)] max-w-md leading-relaxed">
                                {isUltra
                                    ? 'Unrestricted frontier reasoning, massive 1M+ token context, and dedicated compute pipelines.'
                                    : isPro
                                    ? 'Full flagship intelligence with unlimited queries, Google Workspace sync, and universal social publishing.'
                                    : 'Community Starter tier active. Paid Pro & Ultra tiers with expanded quotas are currently in early-access preview.'}
                            </p>
                        </div>

                        <div className="flex flex-col sm:items-end gap-2 shrink-0">
                            {isFree ? (
                                <div className="flex flex-col sm:items-end gap-2">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-soft)] border border-[var(--accent)]/30 text-xs font-medium text-[var(--accent-text)]">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
                                        <span>Pro & Ultra Coming Soon</span>
                                    </div>
                                    <Link
                                        to="/pricing"
                                        className="h-10 px-4 rounded-full bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--line)] text-[var(--text)] font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                                    >
                                        <span>Preview Plans</span>
                                        <RiArrowRightLine size={13} />
                                    </Link>
                                </div>
                            ) : (
                                <Link
                                    to="/pricing"
                                    className="h-10 px-4 rounded-full bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--line)] text-[var(--text)] font-medium text-xs flex items-center gap-1.5 transition-colors"
                                >
                                    <span>Manage Plan</span>
                                    <RiArrowRightLine size={14} />
                                </Link>
                            )}

                            {subscription?.endDate && (
                                <span className="text-[10px] text-[var(--text-subtle)]">
                                    Renews on {new Date(subscription.endDate).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Custom API Key Benefit Status Banner ── */}
                {hasCustomKeys ? (
                    <div className="p-5 rounded-[24px] border border-[var(--line)] bg-[var(--surface)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-full bg-[var(--surface-2)] text-[var(--accent-text)] flex items-center justify-center shrink-0">
                                <RiKey2Line size={20} />
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent-text)] flex items-center gap-1">
                                        <RiCheckLine size={12} />
                                        Custom Key Added
                                    </span>
                                    <span className="text-xs text-[var(--text-muted)]">
                                        BYOK Boost Active
                                    </span>
                                </div>
                                <p className="text-xs font-medium text-[var(--text)]">
                                    <strong>Unlimited</strong> AI Messages &bull; <strong>{isPro ? '15' : '5'}</strong> RAG uploads/day &bull; <strong>{isPro ? '50' : '20'}</strong> Social posts/day
                                </p>
                                <p className="text-[11px] text-[var(--text-subtle)]">
                                    Prompts automatically route to your custom model with multi-model failover.
                                </p>
                            </div>
                        </div>
                        <Link
                            to="/settings/api-keys"
                            className="h-9 px-4 rounded-full bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--line)] text-[var(--text)] font-medium text-xs flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                        >
                            <span>Manage Keys</span>
                            <RiArrowRightLine size={13} />
                        </Link>
                    </div>
                ) : (
                    <div className="p-5 rounded-[24px] border border-[var(--line)] bg-[var(--surface)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-full bg-[var(--surface-2)] text-[var(--text-muted)] flex items-center justify-center shrink-0">
                                <RiKey2Line size={20} />
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--text-muted)]">
                                        Standard Quotas (No Custom Key)
                                    </span>
                                </div>
                                <p className="text-xs font-medium text-[var(--text)]">
                                    Daily 50 messages &bull; 2 RAG file uploads/day &bull; 10 Social posts/day
                                </p>
                                <p className="text-[11px] text-[var(--text-subtle)]">
                                    Add your custom API key to unlock <strong>Unlimited AI messages</strong> and higher limits!
                                </p>
                            </div>
                        </div>
                        <Link
                            to="/settings/api-keys"
                            className="h-9 px-4 rounded-full bg-[var(--text)] text-[var(--bg)] font-medium text-xs flex items-center gap-1.5 transition-opacity hover:opacity-90 shrink-0 cursor-pointer"
                        >
                            <span>Add Custom Key</span>
                            <RiArrowRightLine size={13} />
                        </Link>
                    </div>
                )}

                {/* ── Real-Time Resource Quotas Dashboard ── */}
                <div className="space-y-3.5">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2">
                            <RiFlashlightLine size={15} className="text-[var(--accent-text)]" />
                            <span>Resource Usage & Limits</span>
                        </h3>
                        <button
                            type="button"
                            onClick={loadData}
                            className="text-[var(--text-muted)] hover:text-[var(--text)] p-1.5 rounded-full hover:bg-[var(--surface)] transition-colors cursor-pointer"
                            title="Refresh Quota Telemetry"
                        >
                            <RiRefreshLine size={14} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        
                        {/* Daily AI Queries */}
                        <div className="p-4 sm:p-5 rounded-[24px] bg-[var(--surface)] border border-[var(--line)] space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-[var(--text-muted)]">
                                    Daily AI Messages
                                </span>
                                <span className="text-xs font-bold text-[var(--text)] tabular-nums flex items-center gap-1">
                                    {loading ? (
                                        <ThemedSkeleton width={50} height={14} />
                                    ) : isUnlimitedQueries ? (
                                        <span className="flex items-center gap-1 text-[var(--success)]">
                                            <RiInfinityLine size={16} />
                                            <span>Unlimited</span>
                                        </span>
                                    ) : (
                                        `${quotas.queriesToday || 0} / ${effectiveQueriesLimit}`
                                    )}
                                </span>
                            </div>

                            <div className="w-full h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                        isUnlimitedQueries
                                            ? 'bg-[var(--success)] w-full'
                                            : getQueryPercentage() > 80
                                            ? 'bg-[var(--danger)]'
                                            : 'bg-[var(--accent)]'
                                    }`}
                                    style={{ width: `${isUnlimitedQueries ? 100 : getQueryPercentage()}%` }}
                                />
                            </div>

                            <p className="text-[11px] text-[var(--text-subtle)]">
                                {isUnlimitedQueries ? 'Custom key active — Unlimited messages' : '50 messages per day'}
                            </p>
                        </div>

                        {/* Document & PDF Uploads */}
                        <div className="p-4 sm:p-5 rounded-[24px] bg-[var(--surface)] border border-[var(--line)] space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-[var(--text-muted)]">
                                    Document Uploads
                                </span>
                                <span className="text-xs font-bold text-[var(--text)] tabular-nums flex items-center gap-1">
                                    {loading ? (
                                        <ThemedSkeleton width={50} height={14} />
                                    ) : effectiveDocLimit === -1 ? (
                                        <span className="flex items-center gap-1 text-[var(--success)]">
                                            <RiInfinityLine size={16} />
                                            <span>Unlimited</span>
                                        </span>
                                    ) : (
                                        `${quotas.documentUploadsToday || 0} / ${effectiveDocLimit}`
                                    )}
                                </span>
                            </div>

                            <div className="w-full h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
                                    style={{ width: `${effectiveDocLimit === -1 ? 100 : getDocPercentage()}%` }}
                                />
                            </div>

                            <p className="text-[11px] text-[var(--text-subtle)]">
                                {effectiveDocLimit === -1
                                    ? 'Unlimited document research'
                                    : `${effectiveDocLimit} uploads daily`}
                            </p>
                        </div>

                        {/* Social Media Posts */}
                        <div className="p-4 sm:p-5 rounded-[24px] bg-[var(--surface)] border border-[var(--line)] space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-[var(--text-muted)]">
                                    Social Publishing / Day
                                </span>
                                <span className="text-xs font-bold text-[var(--text)] tabular-nums flex items-center gap-1">
                                    {loading ? (
                                        <ThemedSkeleton width={50} height={14} />
                                    ) : effectiveSocialLimit === -1 ? (
                                        <span className="flex items-center gap-1 text-[var(--success)]">
                                            <RiInfinityLine size={16} />
                                            <span>Unlimited</span>
                                        </span>
                                    ) : (
                                        `${quotas.socialPostsThisMonth || 0} / ${effectiveSocialLimit}`
                                    )}
                                </span>
                            </div>

                            <div className="w-full h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
                                    style={{ width: `${effectiveSocialLimit === -1 ? 100 : getSocialPercentage()}%` }}
                                />
                            </div>

                            <p className="text-[11px] text-[var(--text-subtle)]">
                                {effectiveSocialLimit === -1
                                    ? 'Unlimited social publishing'
                                    : `${effectiveSocialLimit} posts daily`}
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
                        <div className={`p-4 rounded-[20px] border ${!hasCustomKeys && isFree ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--line)] bg-[var(--surface-2)]'} space-y-2`}>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-[var(--text)]">Free (Default)</span>
                                {!hasCustomKeys && isFree && <span className="text-[10px] font-bold text-[var(--accent-text)]">Current</span>}
                            </div>
                            <ul className="text-xs space-y-1.5 text-[var(--text-muted)]">
                                <li className="flex items-center gap-1.5"><RiCheckLine size={14} className="text-[var(--success)] shrink-0" /> 50 messages / day</li>
                                <li className="flex items-center gap-1.5"><RiCheckLine size={14} className="text-[var(--success)] shrink-0" /> 2 RAG files / day</li>
                                <li className="flex items-center gap-1.5"><RiCheckLine size={14} className="text-[var(--success)] shrink-0" /> 10 social posts / day</li>
                            </ul>
                        </div>

                        {/* Free - Custom Key */}
                        <div className={`p-4 rounded-[20px] border ${hasCustomKeys && isFree ? 'border-[var(--success)] bg-[var(--success)]/10' : 'border-[var(--line)] bg-[var(--surface-2)]'} space-y-2`}>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-[var(--success)] flex items-center gap-1">
                                    <RiKey2Line size={13} />
                                    Free + Custom Key
                                </span>
                                {hasCustomKeys && isFree && <span className="text-[10px] font-bold text-[var(--success)]">Current</span>}
                            </div>
                            <ul className="text-xs space-y-1.5 text-[var(--text-muted)]">
                                <li className="flex items-center gap-1.5 font-semibold text-[var(--success)]"><RiCheckLine size={14} className="shrink-0" /> Unlimited messages</li>
                                <li className="flex items-center gap-1.5"><RiCheckLine size={14} className="text-[var(--success)] shrink-0" /> 5 RAG files / day</li>
                                <li className="flex items-center gap-1.5"><RiCheckLine size={14} className="text-[var(--success)] shrink-0" /> 20 social posts / day</li>
                            </ul>
                        </div>

                        {/* Pro Plan */}
                        <div className={`p-4 rounded-[20px] border ${isPro ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--line)] bg-[var(--surface-2)]'} space-y-2`}>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-[var(--text)]">Pro Plan</span>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--warning)]/20 text-[var(--warning)]">Coming Soon</span>
                            </div>
                            <ul className="text-xs space-y-1.5 text-[var(--text-muted)]">
                                <li className="flex items-center gap-1.5"><RiCheckLine size={14} className="text-[var(--success)] shrink-0" /> 50 msgs / day (or Unlimited w/ key)</li>
                                <li className="flex items-center gap-1.5"><RiCheckLine size={14} className="text-[var(--success)] shrink-0" /> 10 RAG files (15 w/ key)</li>
                                <li className="flex items-center gap-1.5"><RiCheckLine size={14} className="text-[var(--success)] shrink-0" /> 50 social posts / day</li>
                            </ul>
                        </div>

                        {/* Ultra Plan */}
                        <div className={`p-4 rounded-[20px] border ${isUltra ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--line)] bg-[var(--surface-2)]'} space-y-2`}>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-[var(--accent-text)]">Ultra Plan</span>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--warning)]/20 text-[var(--warning)]">Coming Soon</span>
                            </div>
                            <ul className="text-xs space-y-1.5 text-[var(--text-muted)]">
                                <li className="flex items-center gap-1.5 font-semibold text-[var(--accent-text)]"><RiInfinityLine size={14} className="shrink-0" /> Unlimited messages</li>
                                <li className="flex items-center gap-1.5 font-semibold text-[var(--accent-text)]"><RiInfinityLine size={14} className="shrink-0" /> Unlimited RAG files</li>
                                <li className="flex items-center gap-1.5 font-semibold text-[var(--accent-text)]"><RiInfinityLine size={14} className="shrink-0" /> Unlimited social posts</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* ── Plan Comparison Table / Quick Switch ── */}
                <div className="p-5 sm:p-6 rounded-[28px] bg-[var(--surface)] border border-[var(--line)] space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-0.5">
                            <h4 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
                                <RiShieldCheckLine size={17} className="text-[var(--accent-text)]" />
                                <span>Upcoming Tiers & Quota Expansion</span>
                            </h4>
                            <p className="text-xs text-[var(--text-muted)]">
                                Explore upcoming model access, larger file contexts, and multi-network capabilities.
                            </p>
                        </div>
                        <Link
                            to="/pricing"
                            className="shrink-0 h-10 px-5 rounded-full bg-[var(--text)] text-[var(--bg)] font-medium text-xs flex items-center gap-1.5 transition-opacity hover:opacity-90 self-start sm:self-auto cursor-pointer"
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
