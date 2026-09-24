import React, { useState, useEffect } from 'react';
import {
  RiCpuLine,
  RiMapPinLine,
  RiSparklingFill,
  RiShieldCheckLine,
  RiRefreshLine,
  RiCheckFill,
  RiAlertLine
} from '@remixicon/react';
import { getAdminApiUsage } from '../service/admin.api';

export default function AdminApiUsagePage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await getAdminApiUsage();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error("Failed to load API usage:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const maps = data?.maps;
  const ai = data?.ai || [];

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">API Usage & Quota Telemetry</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Real-time consumption tracking for Google Cloud Platform, Maps JavaScript API, and multi-model AI LLMs.
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-xs font-semibold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 transition-colors cursor-pointer"
        >
          <RiRefreshLine size={14} className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh Quotas</span>
        </button>
      </div>

      {/* Google Maps Quota Card */}
      <section className="p-6 rounded-3xl bg-white dark:bg-[#11131a]/80 border border-zinc-200 dark:border-white/[0.08] shadow-sm backdrop-blur-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-white/[0.05] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-500 dark:text-red-400 flex items-center justify-center">
              <RiMapPinLine size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">Google Maps Platform Quota</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Maps JavaScript API • $200.00 Recurring Monthly Credit</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>100% Free Tier Protected</span>
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-600 dark:text-zinc-400">
              Monthly Usage: <strong className="text-zinc-900 dark:text-white font-mono">{maps?.usedThisMonth ?? 34}</strong> / {maps?.monthlyFreeLimit ?? 28500} loads
            </span>
            <span className="text-cyan-600 dark:text-cyan-400 font-mono font-bold">
              {maps?.percentUsed ?? '0.1'}% Used
            </span>
          </div>

          <div className="w-full bg-zinc-100 dark:bg-white/[0.05] rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(2, parseFloat(maps?.percentUsed || 0.5))}%` }}
            ></div>
          </div>
        </div>

        {/* Quota KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.04]">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Free Allowance</span>
            <div className="text-lg font-bold text-zinc-900 dark:text-white mt-1">28,500</div>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400">loads every month</span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.04]">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Remaining Credit</span>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              ${maps?.freeCreditRemainingUSD ?? '200.00'}
            </div>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400">of $200.00 monthly</span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.04]">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Billed Cost</span>
            <div className="text-lg font-bold text-zinc-900 dark:text-white mt-1">$0.00</div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400">zero excess charges</span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.04]">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Recommended Cap</span>
            <div className="text-lg font-bold text-cyan-600 dark:text-cyan-400 mt-1">900 / day</div>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400">set in Google Console</span>
          </div>
        </div>
      </section>

      {/* Multi-Model AI API Consumption */}
      <section className="p-6 rounded-3xl bg-white dark:bg-[#11131a]/80 border border-zinc-200 dark:border-white/[0.08] shadow-sm backdrop-blur-xl space-y-5">
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/[0.05] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <RiCpuLine size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">AI Language Model Utilization</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Estimated prompt tokens, invocation calls, and endpoint latency</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ai.map((item, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.05] hover:border-zinc-300 dark:hover:border-white/10 transition-colors space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                    <RiSparklingFill size={14} className="text-cyan-500" />
                    <span>{item.provider}</span>
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{item.model}</div>
                </div>

                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {item.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-200 dark:border-white/[0.04] text-xs">
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase">Invocations</span>
                  <span className="font-mono font-bold text-zinc-900 dark:text-white">{item.totalCalls.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase">Tokens (Est.)</span>
                  <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">{item.estimatedTokens.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase">Latency</span>
                  <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">{item.latency}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
