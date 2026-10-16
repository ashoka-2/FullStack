import React from 'react';
import { Link } from 'react-router';
import {
  RiShieldCheckLine,
  RiDatabaseLine,
  RiLockLine,
  RiInformationLine,
  RiSettings4Line,
  RiGlobalLine
} from '@remixicon/react';
import InfoPageLayout from './InfoPageLayout';

const Section = ({ icon: Icon, title, children }) => (
  <div className="mb-8">
    <div className="flex items-center gap-2.5 mb-3">
      <div className="p-2 rounded-full bg-[var(--accent-muted)] border border-[var(--accent)]/20">
        <Icon className="w-4 h-4 text-[var(--accent)]" />
      </div>
      <h2 className="text-lg font-bold text-zinc-900 dark:text-[var(--fg)]">{title}</h2>
    </div>
    <div className="text-[13px] sm:text-sm text-zinc-600 dark:text-[var(--fg-muted)] leading-relaxed space-y-3 pl-0.5">
      {children}
    </div>
  </div>
);

export default function CookiePolicy() {
  return (
    <InfoPageLayout 
      title="Cookie & Storage Policy" 
      subtitle="Last updated: January 2025" 
      badge="ePrivacy & GDPR Compliant"
    >
      <div className="bg-white dark:bg-[var(--surface)] rounded-[28px] border border-zinc-200/80 dark:border-[var(--border)] p-6 sm:p-10 shadow-xs">
        <p className="text-[13px] sm:text-sm text-zinc-500 dark:text-[var(--fg-muted)] mb-8 leading-relaxed">
          This Cookie Policy explains how Parsu AI uses cookies, local browser storage, and related web technologies to provide a secure, fast, and continuous AI research assistant experience. We believe in privacy by design — we do not use third-party advertising cookies or cross-site behavioral tracking beacons.
        </p>

        <Section icon={RiInformationLine} title="What Are Cookies and Local Storage?">
          <p>
            Cookies are small text files placed on your device by websites you visit. In modern Single Page and Progressive Web Applications (PWAs), web storage (such as <code>localStorage</code>, <code>sessionStorage</code>, and <code>IndexedDB</code>) is also utilized to store client-side state, user preferences, and offline cache securely on your device.
          </p>
        </Section>

        <Section icon={RiShieldCheckLine} title="Strictly Essential Storage">
          <p>
            These items are necessary for the platform to function and cannot be switched off in our systems. They are set in response to actions made by you, such as logging in, maintaining security, or routing WebSocket real-time streams.
          </p>
          <div className="overflow-x-auto my-3">
            <table className="w-full text-left text-xs border border-zinc-200/80 dark:border-white/[0.08] rounded-xl overflow-hidden">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 border-b border-zinc-200/80 dark:border-white/[0.08]">
                <tr>
                  <th className="p-3 font-semibold">Key / Cookie</th>
                  <th className="p-3 font-semibold">Type</th>
                  <th className="p-3 font-semibold">Purpose & Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60 dark:divide-white/[0.06]">
                <tr>
                  <td className="p-3 font-mono text-[var(--accent)]">parsu_auth_token</td>
                  <td className="p-3">localStorage / JWT</td>
                  <td className="p-3">Secures your authenticated user session. Persistent until logout.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-[var(--accent)]">parsu_cached_user</td>
                  <td className="p-3">localStorage</td>
                  <td className="p-3">Optimistically preserves profile state to prevent login flicker on page reloads.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-[var(--accent)]">parsu_session_initialized</td>
                  <td className="p-3">sessionStorage</td>
                  <td className="p-3">Manages app shell preloading sequence per browser tab session.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        <Section icon={RiSettings4Line} title="Functional & Preference Storage">
          <p>
            These items enable enhanced functionality and personalization, such as remembering your selected theme (dark or light mode) and AI mascot configurations.
          </p>
          <div className="overflow-x-auto my-3">
            <table className="w-full text-left text-xs border border-zinc-200/80 dark:border-white/[0.08] rounded-xl overflow-hidden">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 border-b border-zinc-200/80 dark:border-white/[0.08]">
                <tr>
                  <th className="p-3 font-semibold">Key / Cookie</th>
                  <th className="p-3 font-semibold">Type</th>
                  <th className="p-3 font-semibold">Purpose & Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60 dark:divide-white/[0.06]">
                <tr>
                  <td className="p-3 font-mono text-[var(--accent)]">theme</td>
                  <td className="p-3">localStorage</td>
                  <td className="p-3">Remembers your interface appearance mode ('dark' or 'light'). Persistent.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-[var(--accent)]">parsu_cookie_consent</td>
                  <td className="p-3">localStorage</td>
                  <td className="p-3">Records your cookie banner acknowledgment. Persistent.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-[var(--accent)]">parsu_device_name</td>
                  <td className="p-3">localStorage</td>
                  <td className="p-3">Stores optional human-friendly device label for cross-device command relay.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        <Section icon={RiLockLine} title="Third-Party Cookies & Tracking">
          <p>
            <strong>We do not sell your personal data.</strong> We do not load third-party ad retargeting pixels, social media tracking beacons, or cross-site analytics that track you across other websites.
          </p>
          <p>
            Third-party OAuth logins (such as Google Sign-In) execute inside isolated auth popups or redirects governed strictly by the provider's privacy policies.
          </p>
        </Section>

        <Section icon={RiGlobalLine} title="How to Manage or Clear Cookies">
          <p>
            You can modify your browser settings to accept or decline cookies, or clear client storage at any time via your browser's Developer Tools or Privacy Settings. Note that clearing strictly essential storage (such as <code>parsu_auth_token</code>) will sign you out of the platform.
          </p>
        </Section>

        <div className="mt-10 pt-6 border-t border-zinc-200/80 dark:border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>Questions about our cookie practices? Contact <a href="mailto:privacy@parsu.ai" className="text-[var(--accent)] hover:underline">privacy@parsu.ai</a></p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="text-[var(--accent)] hover:underline">Privacy Policy</Link>
            <span>•</span>
            <Link to="/terms" className="text-[var(--accent)] hover:underline">Terms of Service</Link>
          </div>
        </div>
      </div>
    </InfoPageLayout>
  );
}
