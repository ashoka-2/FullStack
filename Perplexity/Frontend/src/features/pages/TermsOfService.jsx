import React from 'react';
import { Link } from 'react-router';
import {
  RiFileTextLine,
  RiUserLine,
  RiShieldCheckLine,
  RiShareLine,
  RiAlertLine,
  RiCopyrightLine,
  RiArrowLeftLine,
  RiScalesLine,
  RiProhibitedLine,
  RiMailLine
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

const TermsOfService = () => {
  return (
    <InfoPageLayout 
      title="Terms of Service" 
      subtitle="Last updated: January 2025" 
      badge="Official Terms"
    >
      <div className="bg-white dark:bg-[#0e0f10] rounded-3xl border border-zinc-200/60 dark:border-white/5 p-6 sm:p-10 shadow-sm">
        <p className="text-[13px] sm:text-sm text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
          By using our platform, you agree to these Terms of Service. Please read them carefully before using the AI research assistant and social publishing features.
        </p>

          <Section icon={RiUserLine} title="1. Account Responsibilities">
            <p>You are responsible for maintaining the confidentiality of your account credentials.</p>
            <p>You must provide accurate information during registration and keep your profile updated.</p>
            <p>You are responsible for all activities that occur under your account.</p>
            <p>You must be at least 13 years of age (or the minimum age in your jurisdiction) to use our services.</p>
          </Section>

          <Section icon={RiScalesLine} title="2. AI Usage & Limitations">
            <p>AI-generated responses are provided for informational purposes only and should not be treated as professional advice (medical, legal, financial, etc.).</p>
            <p>We route your queries to third-party AI providers (Google, OpenAI, Anthropic, DeepSeek, Groq, etc.) subject to their respective terms of service.</p>
            <p>You retain ownership of your prompts and uploaded content. AI-generated outputs are licensed to you for personal and commercial use.</p>
            <p>We do not guarantee the accuracy, completeness, or reliability of AI responses.</p>
          </Section>

          <Section icon={RiShareLine} title="3. Social Media Publishing">
            <p>When using our social publishing features, you are solely responsible for the content you post to connected platforms.</p>
            <p>You must comply with each social platform's terms of service, community guidelines, and content policies.</p>
            <p>AI-generated captions and hashtags are suggestions — you are responsible for reviewing them before publishing.</p>
            <p>We are not liable for any consequences arising from content you publish through our platform.</p>
          </Section>

          <Section icon={RiProhibitedLine} title="4. Acceptable Use Policy">
            <p>You agree NOT to use our platform to:</p>
            <p>• Generate, store, or distribute illegal, harmful, or hateful content</p>
            <p>• Attempt to bypass rate limits, security controls, or access restrictions</p>
            <p>• Reverse-engineer, decompile, or extract our proprietary algorithms</p>
            <p>• Use automated scripts or bots to abuse our API endpoints</p>
            <p>• Impersonate others or misrepresent AI-generated content as human-authored</p>
            <p>• Violate intellectual property rights of any third party</p>
          </Section>

          <Section icon={RiCopyrightLine} title="5. Intellectual Property">
            <p>The Perplexity platform, including its design, code, and brand assets, is protected by intellectual property laws.</p>
            <p>You retain full ownership of your uploaded documents, images, videos, and chat content.</p>
            <p>Vector embeddings generated from your documents are considered derived data and are treated with the same privacy as the source material.</p>
          </Section>

          <Section icon={RiShieldCheckLine} title="6. API Keys & Custom Models">
            <p>You may configure custom API keys for third-party AI providers in your Settings.</p>
            <p>You are solely responsible for the security and usage charges associated with your own API keys.</p>
            <p>We never store your API keys in plain text — they are encrypted at rest.</p>
          </Section>

          <Section icon={RiAlertLine} title="7. Limitation of Liability">
            <p>Our service is provided "as is" without warranties of any kind.</p>
            <p>We are not liable for any indirect, incidental, or consequential damages arising from use of our services.</p>
            <p>Our total liability shall not exceed the amount you paid for the service in the 12 months prior to the claim.</p>
          </Section>

          <Section icon={RiFileTextLine} title="8. Changes to Terms">
            <p>We may update these terms at any time. Continued use of the platform after changes constitutes acceptance of the revised terms.</p>
            <p>We will notify users of significant changes via email or in-app notification.</p>
          </Section>

          <Section icon={RiMailLine} title="9. Contact">
            <p>For questions about these terms, please contact us at:</p>
            <p className="font-semibold text-zinc-800 dark:text-zinc-200">Email: legal@perplexity-clone.app</p>
            <p>Or visit our <Link to="/contact" className="text-cyan-600 dark:text-cyan-400 hover:underline">Contact Page</Link>.</p>
          </Section>
        </div>
    </InfoPageLayout>
  );
};

export default TermsOfService;
