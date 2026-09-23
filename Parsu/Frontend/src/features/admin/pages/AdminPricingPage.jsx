import React, { useState, useEffect } from 'react';
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
  RiTimeLine
} from '@remixicon/react';
import customAxios from '../../../utils/axios';
import { addToast } from '../../../utils/toast.slice';
import { useDispatch } from 'react-redux';
import DeleteButton from '../../Components/rare-ui/DeleteButton';

export default function AdminPricingPage() {
  const dispatch = useDispatch();
  const [gatewayMode, setGatewayMode] = useState('test');
  const [pricing, setPricing] = useState(null);
  const [subscribers, setSubscribers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingMode, setIsUpdatingMode] = useState(false);
  const [isEditingPlans, setIsEditingPlans] = useState(false);
  const [editedPricing, setEditedPricing] = useState(null);

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

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleGatewayMode = async (newMode) => {
    setIsUpdatingMode(true);
    try {
      const res = await customAxios.put('/api/subscription/admin/gateway-mode', { mode: newMode });
      if (res.data?.success) {
        setGatewayMode(newMode);
        dispatch(addToast({
          type: 'success',
          title: 'Gateway Mode Updated',
          description: `Razorpay is now in ${newMode.toUpperCase()} mode.`
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
          title: 'Pricing Saved',
          description: 'Updated plan pricing has been synchronized across all server clusters.'
        }));
      }
    } catch (err) {
      dispatch(addToast({
        type: 'error',
        title: 'Failed to save',
        message: err.response?.data?.message || 'Could not update pricing'
      }));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <RiMoneyDollarCircleLine className="text-[#20b8cd]" />
            <span>Subscription & Pricing Command Hub</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Toggle Razorpay payment gateway modes, adjust multi-currency tiers, and audit active subscriptions.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={isLoading}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-zinc-300 border border-white/10 transition-colors cursor-pointer"
        >
          <RiRefreshLine size={14} className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ── 1. Gateway Mode Controller Card ── */}
      <div className="p-6 rounded-3xl bg-[#11131a]/85 border border-white/[0.08] shadow-sm backdrop-blur-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Payment Gateway Status</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                gatewayMode === 'payable' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                {gatewayMode === 'payable' ? '⚡ Live / Payable' : '🧪 Test Mode'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Switching from testing to payable activates live real-world customer card and UPI charges.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/10">
            <button
              type="button"
              disabled={isUpdatingMode}
              onClick={() => handleToggleGatewayMode('test')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                gatewayMode === 'test'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              🧪 Test Mode
            </button>
            <button
              type="button"
              disabled={isUpdatingMode}
              onClick={() => handleToggleGatewayMode('payable')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                gatewayMode === 'payable'
                  ? 'bg-emerald-500 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              ⚡ Payable Mode
            </button>
          </div>
        </div>

        {/* UPI & Gateway Technical FAQ Note */}
        <div className="mt-5 p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/15 flex items-start gap-3 text-xs text-zinc-300">
          <RiShieldCheckLine size={18} className="text-[#20b8cd] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-white">Razorpay UPI & International Card Support:</p>
            <p className="text-zinc-400 leading-relaxed">
              Razorpay natively supports Google Pay, PhonePe, Paytm, BHIM, and QR intent. In test mode, select the <strong>UPI</strong> tab in the checkout popup and use <code>success@razorpay</code> as your VPA to verify transactions with zero fees.
            </p>
          </div>
        </div>
      </div>

      {/* ── 2. Pricing Plans Tier Editor ── */}
      <div className="p-6 rounded-3xl bg-[#11131a]/85 border border-white/[0.08] shadow-sm backdrop-blur-xl">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-6">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Dynamic Plan Pricing Matrix
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Configured amounts in local currencies (automatically served based on user geo-location).
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isEditingPlans ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditingPlans(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePricing}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#20b8cd] text-black font-bold text-xs shadow-md"
                >
                  <RiSaveLine size={14} />
                  <span>Save Changes</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingPlans(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs border border-white/10"
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
          <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <span>🇮🇳 India Pricing (INR ₹)</span>
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">Paise Subunits</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                <span className="text-zinc-300 font-semibold">Pro Plan (Monthly)</span>
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
                    className="w-24 px-2 py-1 rounded bg-black border border-white/20 text-right text-white font-mono"
                  />
                ) : (
                  <span className="font-bold text-[#20b8cd]">₹{pricing?.INR?.pro?.monthly?.display || 1499} / mo</span>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                <span className="text-zinc-300 font-semibold">Enterprise Plan (Monthly)</span>
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
                    className="w-24 px-2 py-1 rounded bg-black border border-white/20 text-right text-white font-mono"
                  />
                ) : (
                  <span className="font-bold text-[#20b8cd]">₹{pricing?.INR?.enterprise?.monthly?.display || 5999} / mo</span>
                )}
              </div>
            </div>
          </div>

          {/* USD (International) */}
          <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <span>🌐 International Pricing (USD $)</span>
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">Cent Subunits</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                <span className="text-zinc-300 font-semibold">Pro Plan (Monthly)</span>
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
                    className="w-24 px-2 py-1 rounded bg-black border border-white/20 text-right text-white font-mono"
                  />
                ) : (
                  <span className="font-bold text-emerald-400">${pricing?.USD?.pro?.monthly?.display || 19} / mo</span>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                <span className="text-zinc-300 font-semibold">Enterprise Plan (Monthly)</span>
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
                    className="w-24 px-2 py-1 rounded bg-black border border-white/20 text-right text-white font-mono"
                  />
                ) : (
                  <span className="font-bold text-emerald-400">${pricing?.USD?.enterprise?.monthly?.display || 79} / mo</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Active Subscribers Table ── */}
      <div className="p-6 rounded-3xl bg-[#11131a]/85 border border-white/[0.08] shadow-sm backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
          <div className="flex items-center gap-2.5">
            <RiUser3Line size={18} className="text-[#20b8cd]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Subscribed Users & Revenue Accounts ({subscribers.length})
            </h2>
          </div>
          <span className="text-xs text-zinc-400">Live verified payments</span>
        </div>

        {subscribers.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-xs">
            No active paid subscriptions found. As users upgrade via Razorpay checkout, their verified credentials appear here in real-time.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-zinc-500 border-b border-white/10">
                <tr>
                  <th className="py-3 px-4 font-semibold">User</th>
                  <th className="py-3 px-4 font-semibold">Plan</th>
                  <th className="py-3 px-4 font-semibold">Billing</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Renew Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                {subscribers.map((sub) => (
                  <tr key={sub._id} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">{sub.username}</div>
                      <div className="text-[11px] text-zinc-500">{sub.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        {sub.subscription?.plan || 'Free'}
                      </span>
                    </td>
                    <td className="py-3 px-4 capitalize">{sub.subscription?.billingCycle || 'monthly'}</td>
                    <td className="py-3 px-4">
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>{sub.subscription?.status || 'active'}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-zinc-500">
                      {sub.subscription?.endDate ? new Date(sub.subscription.endDate).toLocaleDateString() : 'Active'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
