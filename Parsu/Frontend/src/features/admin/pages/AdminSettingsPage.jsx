import React, { useState, useEffect } from 'react';
import {
  RiSettings3Line,
  RiSaveLine,
  RiRefreshLine,
  RiShieldCheckLine,
  RiCpuLine,
  RiHardDriveLine,
  RiToggleLine,
  RiToggleFill,
  RiCheckLine,
  RiInformationLine,
  RiMoneyDollarCircleLine
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
    <div className="space-y-6">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-primary)] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500">
            <RiSettings3Line size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Platform Global Settings</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Configure system parameters, upload limits, AI default engines, and registration policies
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs transition-all cursor-pointer shadow-md disabled:opacity-50"
        >
          {saving ? <RiRefreshLine size={16} className="animate-spin" /> : <RiSaveLine size={16} />}
          Save Changes
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-primary)]">
          <RiRefreshLine size={32} className="animate-spin mx-auto text-cyan-500 mb-3" />
          <p className="text-sm font-semibold text-[var(--text-secondary)]">Loading configuration parameters...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Section 1: General & Identity */}
          <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-primary)] space-y-4 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-[var(--border-primary)]">
              <RiInformationLine size={18} className="text-cyan-500" />
              <h2 className="text-xs font-black uppercase tracking-wider text-[var(--text-primary)]">Identity & Announcements</h2>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                Platform Name
              </label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                Support & Contact Email
              </label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                Global Announcement Banner
              </label>
              <textarea
                value={settings.announcement}
                onChange={(e) => setSettings({ ...settings, announcement: e.target.value })}
                rows={2}
                className="w-full p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>
          </div>

          {/* Section 2: Access & Registration Policies */}
          <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-primary)] space-y-5 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-[var(--border-primary)]">
              <RiShieldCheckLine size={18} className="text-emerald-500" />
              <h2 className="text-xs font-black uppercase tracking-wider text-[var(--text-primary)]">Access & Registration</h2>
            </div>

            {/* Toggle 1: Registrations */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)]">Open User Registration</p>
                <p className="text-[11px] text-[var(--text-secondary)]">Allow new visitors to sign up and create accounts</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('allowRegistrations')}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              >
                {settings.allowRegistrations ? (
                  <RiToggleFill size={26} className="text-cyan-500" />
                ) : (
                  <RiToggleLine size={26} className="text-[var(--text-muted)]" />
                )}
              </button>
            </div>

            {/* Toggle 2: Maintenance Mode */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)]">Maintenance Lockdown</p>
                <p className="text-[11px] text-[var(--text-secondary)]">Temporarily pause non-admin user queries and logins</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('maintenanceMode')}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              >
                {settings.maintenanceMode ? (
                  <RiToggleFill size={26} className="text-amber-500" />
                ) : (
                  <RiToggleLine size={26} className="text-[var(--text-muted)]" />
                )}
              </button>
            </div>

            {/* Toggle 3: Public Pricing Published */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)]">Public Pricing Page</p>
                <p className="text-[11px] text-[var(--text-secondary)]">Display active subscription plans publicly on /pricing</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('publicPricingPublished')}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              >
                {settings.publicPricingPublished ? (
                  <RiToggleFill size={26} className="text-emerald-500" />
                ) : (
                  <RiToggleLine size={26} className="text-[var(--text-muted)]" />
                )}
              </button>
            </div>
          </div>

          {/* Section 3: Media & Storage Policies */}
          <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-primary)] space-y-4 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-[var(--border-primary)]">
              <RiHardDriveLine size={18} className="text-amber-500" />
              <h2 className="text-xs font-black uppercase tracking-wider text-[var(--text-primary)]">Uploads & Storage Limits</h2>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                Max User Upload Size (MB)
              </label>
              <input
                type="number"
                min="1"
                max="500"
                value={settings.maxUploadSizeMb}
                onChange={(e) => setSettings({ ...settings, maxUploadSizeMb: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                Whitelisted Extensions
              </label>
              <input
                type="text"
                value={settings.allowedExtensions}
                onChange={(e) => setSettings({ ...settings, allowedExtensions: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-cyan-500 font-mono"
              />
              <p className="text-[10px] text-[var(--text-muted)] mt-1">Comma-separated list of safe file types</p>
            </div>
          </div>

          {/* Section 4: AI Global Defaults */}
          <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-primary)] space-y-4 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-[var(--border-primary)]">
              <RiCpuLine size={18} className="text-blue-500" />
              <h2 className="text-xs font-black uppercase tracking-wider text-[var(--text-primary)]">AI Engine Defaults</h2>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                Default Conversation Engine
              </label>
              <select
                value={settings.defaultAiModel}
                onChange={(e) => setSettings({ ...settings, defaultAiModel: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-xs text-[var(--text-primary)] font-semibold focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Ultra-fast multimodal)</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro (Deep reasoning)</option>
                <option value="gpt-4o">GPT-4o (OpenAI)</option>
                <option value="claude-3-7-sonnet">Claude 3.7 Sonnet (Anthropic)</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[var(--text-primary)]">
                  Default Temperature ({settings.aiTemperature})
                </label>
                <span className="text-[10px] text-[var(--text-muted)]">0.0 (Strict) to 1.0 (Creative)</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.aiTemperature}
                onChange={(e) => setSettings({ ...settings, aiTemperature: parseFloat(e.target.value) })}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                Content Safety Threshold
              </label>
              <select
                value={settings.safetyFilterLevel}
                onChange={(e) => setSettings({ ...settings, safetyFilterLevel: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-xs text-[var(--text-primary)] font-semibold focus:outline-none focus:border-cyan-500 cursor-pointer"
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
