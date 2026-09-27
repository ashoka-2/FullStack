import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import {
  RiMoneyDollarCircleLine,
  RiRefreshLine,
  RiCheckboxCircleLine,
  RiAlertLine,
  RiShieldCheckLine,
  RiExchangeDollarLine,
  RiEditBoxLine,
  RiSaveLine,
  RiUser3Line,
  RiTimeLine,
  RiEyeLine,
  RiEyeOffLine,
  RiGlobalLine
} from '@remixicon/react';
import customAxios from '../../../utils/axios';
import { addToast } from '../../../utils/toast.slice';
import { useDispatch } from 'react-redux';

export default function AdminPricingPage() {
  const dispatch = useDispatch();
  const [gatewayMode, setGatewayMode] = useState('test');
  const [pricing, setPricing] = useState(null);
  const [subscribers, setSubscribers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingMode, setIsUpdatingMode] = useState(false);
  const [isEditingPlans, setIsEditingPlans] = useState(false);
  const [editedPricing, setEditedPricing] = useState(null);

  const [isPricingPublished, setIsPricingPublished] = useState(() => {
    return localStorage.getItem('parsu_admin_pricing_published') === 'true';
  });

  const handleTogglePricing = (publishState) => {
    const nextVal = typeof publishState === 'boolean' ? publishState : !isPricingPublished;
    setIsPricingPublished(nextVal);
    localStorage.setItem('parsu_admin_pricing_published', nextVal ? 'true' : 'false');
    window.dispatchEvent(new Event('parsu_pricing_visibility_changed'));
    dispatch(addToast({
      type: 'success',
      title: nextVal ? 'Public Pricing Live' : 'Public Pricing Hidden',
      message: nextVal ? 'Pricing tiers are now publicly accessible on /pricing' : 'Pricing page is hidden; visitors will see a Coming Soon banner'
    }));
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [plansRes, subsRes] = await Promise.all([
        customAxios.get('/api/subscription/plans'),
        customAxios.get('/api/subscription/admin/subscribers').catch(() => ({ data: { subscribers: [] } }))
      ]);

      if (plansRes.data?.success) {
        setGatewayMode(plansRes.data.gatewayMode || 'test');
        setPricing(plansRes.data.pricing);
        setEditedPricing(JSON.parse(JSON.stringify(plansRes.data.pricing)));
      }

      if (subsRes.data?.success) {
        setSubscribers(subsRes.data.subscribers || []);
      }
    } catch (err) {
      console.error("Failed to load subscription admin data:", err);
      dispatch(addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch subscription configuration'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const containerRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!isLoading && containerRef.current) {
      const ctx = gsap.context(() => {
        gsap.from('.pricing-admin-card', {
          y: 16,
          opacity: 0,
          duration: 0.45,
          stagger: 0.08,
          ease: 'power3.out'
        });
      }, containerRef);
      return () => ctx.revert();
    }
  }, [isLoading]);

  const handleToggleGatewayMode = async (newMode) => {
    setIsUpdatingMode(true);
    try {
      const res = await customAxios.put('/api/subscription/admin/gateway-mode', { mode: newMode });
      if (res.data?.success) {
        setGatewayMode(newMode);
        dispatch(addToast({
          type: 'success',
          title: 'Gateway Mode Updated',
          message: `Razorpay is now in ${newMode.toUpperCase()} mode.`
        }));
      }
    } catch (err) {
      dispatch(addToast({
        type: 'error',
        title: 'Update Failed',
        message: err.response?.data?.message || 'Could not update gateway mode'
      }));
    } finally {
      setIsUpdatingMode(false);
    }
  };

  const handleSavePricing = async () => {
    try {
      const res = await customAxios.put('/api/subscription/admin/plans', { pricing: editedPricing });
      if (res.data?.success) {
        setPricing(editedPricing);
        setIsEditingPlans(false);
        dispatch(addToast({
          type: 'success',
          title: 'Pricing Updated',
          message: 'Plan pricing tiers updated successfully across all regions.'
        }));
      }
    } catch (err) {
      dispatch(addToast({
        type: 'error',
        title: 'Save Failed',
        message: err.response?.data?.message || 'Failed to update pricing tiers'
      }));
    }
  };

  return (
    <div ref={containerRef} className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-white/[0.06] border border-zinc-200 dark:border-white/[0.08] flex items-center justify-center text-zinc-800 dark:text-zinc-200">
              <RiMoneyDollarCircleLine size={18} />
            </div>
            <span>Subscription & Pricing Hub</span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Toggle public pricing visibility, manage live gateway payment modes, and adjust multi-currency tiers.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={isLoading}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-surface-hover)] text-xs font-semibold text-[var(--text-primary)] border border-[var(--border-primary)] transition-all active:scale-[0.98] cursor-pointer"
        >
          <RiRefreshLine size={14} className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ── Top Dual Control Hub: Public Pricing Visibility & Gateway Mode ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* 1. Public Pricing Visibility Control */}
        <div className="pricing-admin-card p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-primary)] shadow-sm backdrop-blur-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-primary)]">
              <div className="flex items-center gap-2">
                <RiGlobalLine size={16} className="text-zinc-700 dark:text-zinc-300" />
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Public Pricing Visibility</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isPricingPublished
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                  : 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20'
              }`}>
                {isPricingPublished ? '● Live / Published' : '○ Stealth Mode'}
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-3 leading-relaxed">
              Toggle whether visitors can view pricing tiers on <code className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-white/[0.06] text-zinc-800 dark:text-zinc-200 font-mono text-[11px]">/pricing</code>. In stealth mode, a clean "Plans Coming Soon" banner is displayed to prevent premature signups.
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-[var(--border-primary)] flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-primary)]">Switch Visibility:</span>
            <div className="flex items-center gap-1 bg-[var(--bg-secondary)] p-1 rounded-2xl border border-[var(--border-primary)]">
              <button
                type="button"
                onClick={() => handleTogglePricing(false)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  !isPricingPublished
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <RiEyeOffLine size={13} />
                <span>Hide</span>
              </button>
              <button
                type="button"
                onClick={() => handleTogglePricing(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isPricingPublished
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <RiEyeLine size={13} />
                <span>Publish Live</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. Gateway Mode Controller Card */}
        <div className="pricing-admin-card p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-primary)] shadow-sm backdrop-blur-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-primary)]">
              <div className="flex items-center gap-2">
                <RiShieldCheckLine size={16} className="text-zinc-700 dark:text-zinc-300" />
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Razorpay Payment Gateway</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                gatewayMode === 'payable' 
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                  : 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20'
              }`}>
                {gatewayMode === 'payable' ? '⚡ Live Mode' : '🧪 Sandbox Test'}
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-3 leading-relaxed">
              Switching from testing to payable activates live real-world customer card and UPI charges. Sandbox allows risk-free checkout tests using mock credentials.
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-[var(--border-primary)] flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-primary)]">Gateway Environment:</span>
            <div className="flex items-center gap-1 bg-[var(--bg-secondary)] p-1 rounded-2xl border border-[var(--border-primary)]">
              <button
                type="button"
                disabled={isUpdatingMode}
                onClick={() => handleToggleGatewayMode('test')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  gatewayMode === 'test'
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                🧪 Test Mode
              </button>
              <button
                type="button"
                disabled={isUpdatingMode}
                onClick={() => handleToggleGatewayMode('payable')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  gatewayMode === 'payable'
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                ⚡ Payable
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ── 2. Pricing Plans Tier Editor ── */}
      <div className="pricing-admin-card p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-primary)] shadow-sm backdrop-blur-xl">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-primary)] mb-6">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Dynamic Plan Pricing Matrix
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Configured amounts in local currencies (automatically served based on user geo-location).
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isEditingPlans ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditingPlans(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePricing}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-semibold text-xs shadow-sm cursor-pointer hover:bg-zinc-800 dark:hover:bg-zinc-100 active:scale-[0.98] transition-all"
                >
                  <RiSaveLine size={14} />
                  <span>Save Changes</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingPlans(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)] font-semibold text-xs border border-[var(--border-primary)] cursor-pointer transition-all active:scale-[0.98]"
              >
                <RiEditBoxLine size={14} />
                <span>Edit Pricing</span>
              </button>
            )}
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* INR (India) */}
          <div className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-2">
                <span>🇮🇳 India Pricing (INR ₹)</span>
              </span>
              <span className="text-[10px] text-[var(--text-secondary)] font-mono">Paise Subunits</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-primary)] text-xs">
                <span className="text-[var(--text-primary)] font-semibold">Pro Plan (Monthly)</span>
                {isEditingPlans ? (
                  <input
                    type="number"
                    value={editedPricing?.INR?.pro?.monthly?.display || ''}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEditedPricing(prev => ({
                        ...prev,
                        INR: {
                          ...prev.INR,
                          pro: {
                            ...prev.INR.pro,
                            monthly: { ...prev.INR.pro.monthly, display: val, amount: val * 100 }
                          }
                        }
                      }));
                    }}
                    className="w-24 px-2 py-1 rounded bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-right text-[var(--text-primary)] font-mono focus:outline-none focus:border-zinc-500 dark:focus:border-white/30 focus:ring-1 focus:ring-zinc-500/20"
                  />
                ) : (
                  <span className="font-bold font-mono text-[var(--text-primary)]">₹{pricing?.INR?.pro?.monthly?.display || 1499} / mo</span>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-primary)] text-xs">
                <span className="text-[var(--text-primary)] font-semibold">Enterprise Plan (Monthly)</span>
                {isEditingPlans ? (
                  <input
                    type="number"
                    value={editedPricing?.INR?.enterprise?.monthly?.display || ''}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEditedPricing(prev => ({
                        ...prev,
                        INR: {
                          ...prev.INR,
                          enterprise: {
                            ...prev.INR.enterprise,
                            monthly: { ...prev.INR.enterprise.monthly, display: val, amount: val * 100 }
                          }
                        }
                      }));
                    }}
                    className="w-24 px-2 py-1 rounded bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-right text-[var(--text-primary)] font-mono focus:outline-none focus:border-zinc-500 dark:focus:border-white/30 focus:ring-1 focus:ring-zinc-500/20"
                  />
                ) : (
                  <span className="font-bold font-mono text-[var(--text-primary)]">₹{pricing?.INR?.enterprise?.monthly?.display || 5999} / mo</span>
                )}
              </div>
            </div>
          </div>

          {/* USD (International) */}
          <div className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-2">
                <span>🌐 International Pricing (USD $)</span>
              </span>
              <span className="text-[10px] text-[var(--text-secondary)] font-mono">Cent Subunits</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-primary)] text-xs">
                <span className="text-[var(--text-primary)] font-semibold">Pro Plan (Monthly)</span>
                {isEditingPlans ? (
                  <input
                    type="number"
                    value={editedPricing?.USD?.pro?.monthly?.display || ''}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEditedPricing(prev => ({
                        ...prev,
                        USD: {
                          ...prev.USD,
                          pro: {
                            ...prev.USD.pro,
                            monthly: { ...prev.USD.pro.monthly, display: val, amount: val * 100 }
                          }
                        }
                      }));
                    }}
                    className="w-24 px-2 py-1 rounded bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-right text-[var(--text-primary)] font-mono focus:outline-none focus:border-zinc-500 dark:focus:border-white/30 focus:ring-1 focus:ring-zinc-500/20"
                  />
                ) : (
                  <span className="font-bold font-mono text-[var(--text-primary)]">${pricing?.USD?.pro?.monthly?.display || 19} / mo</span>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-primary)] text-xs">
                <span className="text-[var(--text-primary)] font-semibold">Enterprise Plan (Monthly)</span>
                {isEditingPlans ? (
                  <input
                    type="number"
                    value={editedPricing?.USD?.enterprise?.monthly?.display || ''}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEditedPricing(prev => ({
                        ...prev,
                        USD: {
                          ...prev.USD,
                          enterprise: {
                            ...prev.USD.enterprise,
                            monthly: { ...prev.USD.enterprise.monthly, display: val, amount: val * 100 }
                          }
                        }
                      }));
                    }}
                    className="w-24 px-2 py-1 rounded bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-right text-[var(--text-primary)] font-mono focus:outline-none focus:border-zinc-500 dark:focus:border-white/30 focus:ring-1 focus:ring-zinc-500/20"
                  />
                ) : (
                  <span className="font-bold font-mono text-[var(--text-primary)]">${pricing?.USD?.enterprise?.monthly?.display || 79} / mo</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Active Subscribers Table ── */}
      <div className="pricing-admin-card p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-primary)] shadow-sm backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-primary)] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-white/[0.06] border border-zinc-200 dark:border-white/[0.08] flex items-center justify-center text-zinc-700 dark:text-zinc-300">
              <RiUser3Line size={15} />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Subscribed Users & Revenue Accounts ({subscribers.length})
            </h2>
          </div>
          <span className="text-xs text-[var(--text-secondary)]">Live verified accounts</span>
        </div>

        {subscribers.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-secondary)] text-xs">
            No active paid subscriptions found. As users upgrade via Razorpay checkout, their verified credentials appear here in real-time.
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[11px] uppercase tracking-wider text-[var(--text-secondary)] border-b border-[var(--border-primary)]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">User</th>
                    <th className="py-3 px-4 font-semibold">Plan</th>
                    <th className="py-3 px-4 font-semibold">Billing</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Renew Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-primary)] text-[var(--text-primary)]">
                  {subscribers.map((sub) => (
                    <tr key={sub._id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-[var(--text-primary)]">{sub.username}</div>
                        <div className="text-[11px] text-[var(--text-secondary)]">{sub.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-zinc-100 dark:bg-white/[0.08] text-zinc-900 dark:text-zinc-200 border border-zinc-200 dark:border-white/[0.08]">
                          {sub.subscription?.plan || 'Free'}
                        </span>
                      </td>
                      <td className="py-3 px-4 capitalize text-[var(--text-secondary)]">{sub.subscription?.billingCycle || 'monthly'}</td>
                      <td className="py-3 px-4">
                        <span className="text-emerald-500 font-semibold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>{sub.subscription?.status || 'active'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[var(--text-secondary)] font-mono">
                        {sub.subscription?.endDate ? new Date(sub.subscription.endDate).toLocaleDateString() : 'Active'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Cards */}
            <div className="md:hidden space-y-3">
              {subscribers.map((sub) => (
                <div
                  key={sub._id}
                  className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-xs text-[var(--text-primary)]">{sub.username}</p>
                      <p className="text-[11px] text-[var(--text-secondary)]">{sub.email}</p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-zinc-100 dark:bg-white/[0.08] text-zinc-900 dark:text-zinc-200 border border-zinc-200 dark:border-white/[0.08]">
                      {sub.subscription?.plan || 'Free'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-[var(--border-primary)]">
                    <span className="capitalize text-[var(--text-secondary)]">{sub.subscription?.billingCycle || 'monthly'} cycle</span>
                    <span className="text-emerald-500 font-semibold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>{sub.subscription?.status || 'active'}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

    </div>
  );
}
