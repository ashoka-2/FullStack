import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import {
  RiSettings3Line,
  RiSaveLine,
  RiRefreshLine,
  RiShieldCheckLine,
  RiCpuLine,
  RiHardDriveLine,
  RiCheckLine,
  RiInformationLine
} from '@remixicon/react';
import { getAdminPlatformSettings, updateAdminPlatformSettings } from '../service/admin.api';
import { showToast } from '../../Components/Toast';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    siteName: 'Parsu AI',
    supportEmail: 'support@parsu.ai',
    announcement: 'Parsu AI v2.5 with live multimodal capabilities is active.',
    allowRegistrations: true,
    maintenanceMode: false,
    publicPricingPublished: false,
    maxUploadSizeMb: 50,
    allowedExtensions: 'pdf,docx,txt,csv,xlsx,png,jpg,jpeg,webp,mp4,mp3',
    defaultAiModel: 'gemini-2.5-flash',
    aiTemperature: 0.7,
    safetyFilterLevel: 'standard'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      try {
        const res = await getAdminPlatformSettings();
        if (res.success && res.data) {
          setSettings(prev => ({
            ...prev,
            ...res.data,
            publicPricingPublished: localStorage.getItem('parsu_admin_pricing_published') === 'true'
          }));
        }
      } catch (err) {
        console.error('Failed to load platform settings', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  useEffect(() => {
    if (!loading && containerRef.current) {
      const ctx = gsap.context(() => {
        gsap.from('.settings-card', {
          y: 16,
          opacity: 0,
          duration: 0.4,
          stagger: 0.08,
          ease: 'power3.out'
        });
      }, containerRef);
      return () => ctx.revert();
    }
  }, [loading]);

  const handleToggle = (key) => {
    setSettings(prev => {
      const next = !prev[key];
      if (key === 'publicPricingPublished') {
        localStorage.setItem('parsu_admin_pricing_published', next ? 'true' : 'false');
        window.dispatchEvent(new Event('parsu_pricing_visibility_changed'));
      }
      return { ...prev, [key]: next };
    });
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    setSaving(true);
    try {
      const res = await updateAdminPlatformSettings(settings);
      if (res.success) {
        showToast('success', res.message || 'Platform settings updated successfully');
      }
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div ref={containerRef} className="space-y-6">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-primary)] shadow-sm backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-white/[0.06] border border-zinc-200 dark:border-white/[0.08] flex items-center justify-center text-zinc-800 dark:text-zinc-200">
            <RiSettings3Line size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Platform Global Settings</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Configure system parameters, upload limits, AI default engines, and registration policies
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-semibold text-xs transition-all active:scale-[0.98] cursor-pointer shadow-sm disabled:opacity-50"
        >
          {saving ? <RiRefreshLine size={15} className="animate-spin" /> : <RiSaveLine size={15} />}
          Save Changes
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-primary)]">
          <RiRefreshLine size={28} className="animate-spin mx-auto text-zinc-500 mb-3" />
          <p className="text-xs font-semibold text-[var(--text-secondary)]">Loading configuration parameters...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Section 1: General & Identity */}
          <div className="settings-card p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-primary)] space-y-4 shadow-sm backdrop-blur-xl">
            <div className="flex items-center gap-2 pb-3 border-b border-[var(--border-primary)]">
              <RiInformationLine size={17} className="text-zinc-700 dark:text-zinc-300" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">Identity & Announcements</h2>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Platform Name
              </label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-zinc-400 dark:focus:border-white/30 focus:ring-1 focus:ring-zinc-400/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Support & Contact Email
              </label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-zinc-400 dark:focus:border-white/30 focus:ring-1 focus:ring-zinc-400/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Global Announcement Banner
              </label>
              <textarea
                value={settings.announcement}
                onChange={(e) => setSettings({ ...settings, announcement: e.target.value })}
                rows={2}
                className="w-full p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-zinc-400 dark:focus:border-white/30 focus:ring-1 focus:ring-zinc-400/20 resize-none"
              />
            </div>
          </div>

          {/* Section 2: Access & Registration Policies */}
          <div className="settings-card p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-primary)] space-y-4 shadow-sm backdrop-blur-xl">
            <div className="flex items-center gap-2 pb-3 border-b border-[var(--border-primary)]">
              <RiShieldCheckLine size={17} className="text-zinc-700 dark:text-zinc-300" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">Access & Registration</h2>
            </div>

            {/* Toggle 1: Registrations */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
              <div>
                <p className="text-xs font-semibold text-[var(--text-primary)]">Open User Registration</p>
                <p className="text-[11px] text-[var(--text-secondary)]">Allow new visitors to sign up and create accounts</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('allowRegistrations')}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                  settings.allowRegistrations ? 'bg-zinc-900 dark:bg-white' : 'bg-zinc-300 dark:bg-zinc-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full transition-transform ${
                    settings.allowRegistrations
                      ? 'translate-x-5 bg-white dark:bg-zinc-950'
                      : 'translate-x-0 bg-white dark:bg-zinc-300'
                  }`}
                />
              </button>
            </div>

            {/* Toggle 2: Maintenance Mode */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
              <div>
                <p className="text-xs font-semibold text-[var(--text-primary)]">Maintenance Lockdown</p>
                <p className="text-[11px] text-[var(--text-secondary)]">Temporarily pause non-admin user queries and logins</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('maintenanceMode')}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                  settings.maintenanceMode ? 'bg-zinc-900 dark:bg-white' : 'bg-zinc-300 dark:bg-zinc-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full transition-transform ${
                    settings.maintenanceMode
                      ? 'translate-x-5 bg-white dark:bg-zinc-950'
                      : 'translate-x-0 bg-white dark:bg-zinc-300'
                  }`}
                />
              </button>
            </div>

            {/* Toggle 3: Public Pricing Published */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
              <div>
                <p className="text-xs font-semibold text-[var(--text-primary)]">Public Pricing Page</p>
                <p className="text-[11px] text-[var(--text-secondary)]">Display active subscription plans publicly on /pricing</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('publicPricingPublished')}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                  settings.publicPricingPublished ? 'bg-zinc-900 dark:bg-white' : 'bg-zinc-300 dark:bg-zinc-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full transition-transform ${
                    settings.publicPricingPublished
                      ? 'translate-x-5 bg-white dark:bg-zinc-950'
                      : 'translate-x-0 bg-white dark:bg-zinc-300'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Section 3: Media & Storage Policies */}
          <div className="settings-card p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-primary)] space-y-4 shadow-sm backdrop-blur-xl">
            <div className="flex items-center gap-2 pb-3 border-b border-[var(--border-primary)]">
              <RiHardDriveLine size={17} className="text-zinc-700 dark:text-zinc-300" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">Uploads & Storage Limits</h2>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Max User Upload Size (MB)
              </label>
              <input
                type="number"
                min="1"
                max="500"
                value={settings.maxUploadSizeMb}
                onChange={(e) => setSettings({ ...settings, maxUploadSizeMb: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-zinc-400 dark:focus:border-white/30 focus:ring-1 focus:ring-zinc-400/20 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Whitelisted Extensions
              </label>
              <input
                type="text"
                value={settings.allowedExtensions}
                onChange={(e) => setSettings({ ...settings, allowedExtensions: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-zinc-400 dark:focus:border-white/30 focus:ring-1 focus:ring-zinc-400/20 font-mono"
              />
              <p className="text-[10px] text-[var(--text-secondary)] mt-1">Comma-separated list of safe file types</p>
            </div>
          </div>

          {/* Section 4: AI Global Defaults */}
          <div className="settings-card p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-primary)] space-y-4 shadow-sm backdrop-blur-xl">
            <div className="flex items-center gap-2 pb-3 border-b border-[var(--border-primary)]">
              <RiCpuLine size={17} className="text-zinc-700 dark:text-zinc-300" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">AI Engine Defaults</h2>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Default Conversation Engine
              </label>
              <select
                value={settings.defaultAiModel}
                onChange={(e) => setSettings({ ...settings, defaultAiModel: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-xs text-[var(--text-primary)] font-semibold focus:outline-none focus:border-zinc-400 dark:focus:border-white/30 cursor-pointer"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Ultra-fast multimodal)</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro (Deep reasoning)</option>
                <option value="gpt-4o">GPT-4o (OpenAI)</option>
                <option value="claude-3-7-sonnet">Claude 3.7 Sonnet (Anthropic)</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[var(--text-primary)]">
                  Default Temperature ({settings.aiTemperature})
                </label>
                <span className="text-[10px] text-[var(--text-secondary)] font-mono">0.0 (Strict) to 1.0 (Creative)</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.aiTemperature}
                onChange={(e) => setSettings({ ...settings, aiTemperature: parseFloat(e.target.value) })}
                className="w-full accent-zinc-900 dark:accent-white cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Content Safety Threshold
              </label>
              <select
                value={settings.safetyFilterLevel}
                onChange={(e) => setSettings({ ...settings, safetyFilterLevel: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-xs text-[var(--text-primary)] font-semibold focus:outline-none focus:border-zinc-400 dark:focus:border-white/30 cursor-pointer"
              >
                <option value="strict">Strict (Block medium & above)</option>
                <option value="standard">Standard (Default recommended)</option>
                <option value="permissive">Permissive (Developer sandbox)</option>
              </select>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
