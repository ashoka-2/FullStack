import React from 'react';
import { Link } from 'react-router';
import {
  RiShieldCheckLine,
  RiDatabaseLine,
  RiShareLine,
  RiLockLine,
  RiUserLine,
  RiMailLine,
  RiArrowLeftLine,
  RiEyeLine,
  RiDeleteBinLine,
  RiGlobalLine
} from '@remixicon/react';
import InfoPageLayout from './InfoPageLayout';

const Section = ({ icon: Icon, title, children }) => (
  <div className="mb-8">
    <div className="flex items-center gap-2.5 mb-3">
      <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
        <Icon className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
      </div>
      <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{title}</h2>
    </div>
    <div className="text-[13px] sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed space-y-3 pl-0.5">
      {children}
    </div>
  </div>
);

const PrivacyPolicy = () => {
  return (
    <InfoPageLayout 
      title="Privacy Policy" 
      subtitle="Last updated: January 2025" 
      badge="GDPR / CCPA Compliant"
    >
      <div className="bg-white dark:bg-[#0e0f10] rounded-3xl border border-zinc-200/60 dark:border-white/5 p-6 sm:p-10 shadow-sm">
        <p className="text-[13px] sm:text-sm text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
          Your privacy is critically important to us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered research platform.
        </p>

          <Section icon={RiEyeLine} title="Information We Collect">
            <p><strong>Account Data:</strong> Email address, display name, and authentication tokens when you create an account.</p>
            <p><strong>Chat Data:</strong> Messages, prompts, and AI responses stored to maintain your conversation history.</p>
            <p><strong>Uploaded Files:</strong> Documents, images, and videos you upload for AI analysis or social publishing. Files are processed and stored via secure CDN (ImageKit).</p>
            <p><strong>Vector Embeddings:</strong> Mathematical representations of your documents generated for semantic search (RAG). These are stored in MongoDB alongside your content.</p>
            <p><strong>Social Media Tokens:</strong> OAuth access tokens for connected platforms (Instagram, Facebook, Twitter, etc.) stored encrypted in our database.</p>
            <p><strong>Usage Data:</strong> Log data, device information, and interaction patterns collected for service improvement.</p>
          </Section>

          <Section icon={RiDatabaseLine} title="How We Use Your Information">
            <p>• Provide, operate, and maintain our AI research assistant services</p>
            <p>• Process your documents and generate vector embeddings for intelligent search</p>
            <p>• Execute social media publishing requests across connected platforms</p>
            <p>• Route your queries to selected AI models (Google Gemini, OpenAI, Anthropic, DeepSeek, etc.)</p>
            <p>• Improve and personalize your user experience</p>
            <p>• Communicate with you regarding service updates and support</p>
          </Section>

          <Section icon={RiShareLine} title="Third-Party AI Services">
            <p>Your prompts and messages may be forwarded to third-party AI providers based on your selected model. Each provider has its own data retention and privacy policies:</p>
            <p>• Google (Gemini) — <a href="https://policies.google.com/privacy" className="text-cyan-600 dark:text-cyan-400 hover:underline" target="_blank" rel="noreferrer">Privacy Policy</a></p>
            <p>• OpenAI (GPT) — <a href="https://openai.com/privacy" className="text-cyan-600 dark:text-cyan-400 hover:underline" target="_blank" rel="noreferrer">Privacy Policy</a></p>
            <p>• Anthropic (Claude) — <a href="https://www.anthropic.com/privacy" className="text-cyan-600 dark:text-cyan-400 hover:underline" target="_blank" rel="noreferrer">Privacy Policy</a></p>
            <p>We do not sell your data to any third party.</p>
          </Section>

          <Section icon={RiLockLine} title="Data Security">
            <p>We implement industry-standard security measures including:</p>
            <p>• HTTPS/TLS encryption for all data in transit</p>
            <p>• Helmet.js security headers and rate limiting on all API endpoints</p>
            <p>• JWT-based authentication with HTTP-only secure cookies</p>
            <p>• Encrypted storage of social media OAuth tokens</p>
            <p>• Regular security audits and dependency vulnerability scanning</p>
          </Section>

          <Section icon={RiUserLine} title="Your Rights (GDPR / CCPA)">
            <p><strong>Access:</strong> You can request a copy of all data we hold about you.</p>
            <p><strong>Rectification:</strong> You can update or correct your personal information via Settings.</p>
            <p><strong>Deletion:</strong> You can delete your account and all associated data, including chat history, embeddings, and uploaded files.</p>
            <p><strong>Portability:</strong> You can export your chat history and documents.</p>
            <p><strong>Opt-Out:</strong> You can disconnect social accounts and revoke AI model access at any time.</p>
          </Section>

          <Section icon={RiDeleteBinLine} title="Data Retention">
            <p>We retain your data for as long as your account is active. Upon account deletion:</p>
            <p>• All chat messages, embeddings, and uploaded files are permanently deleted within 30 days.</p>
            <p>• Social media tokens are immediately revoked and removed.</p>
            <p>• Anonymized analytics data may be retained for service improvement.</p>
          </Section>

          <Section icon={RiGlobalLine} title="Cookies & Tracking">
            <p>We use minimal cookies strictly for authentication (JWT tokens) and theme preferences. We do not use third-party tracking cookies or advertising pixels.</p>
          </Section>

          <Section icon={RiMailLine} title="Contact Us">
            <p>If you have questions or concerns about this privacy policy, please contact us:</p>
            <p className="font-semibold text-zinc-800 dark:text-zinc-200">Email: privacy@perplexity-clone.app</p>
            <p>You may also reach us through our <Link to="/contact" className="text-cyan-600 dark:text-cyan-400 hover:underline">Contact Page</Link>.</p>
          </Section>
        </div>
    </InfoPageLayout>
  );
};

export default PrivacyPolicy;
