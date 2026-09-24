import React, { useState, useEffect, useRef } from 'react';
import {
  RiMailLine,
  RiSendPlane2Line,
  RiUserLine,
  RiQuestionLine,
  RiCustomerServiceLine,
  RiGithubLine,
  RiDiscordLine,
  RiInstagramLine,
  RiFacebookCircleLine,
  RiLinkedinBoxLine,
  RiYoutubeLine,
  RiCheckboxCircleFill,
  RiLoader4Line,
  RiShieldCheckLine,
  RiMapPinLine,
  RiTimeLine
} from '@remixicon/react';
import gsap from 'gsap';
import InfoPageLayout from './InfoPageLayout';
import { useDispatch } from 'react-redux';
import { addToast } from '../../utils/toast.slice';
import customAxios from '../../utils/axios';

export default function Contact() {
  const dispatch = useDispatch();
  const formCardRef = useRef(null);
  const channelsRef = useRef([]);

  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (formCardRef.current) {
      gsap.fromTo(
        formCardRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', delay: 0.15 }
      );
    }
    gsap.fromTo(
      channelsRef.current.filter(Boolean),
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out', delay: 0.25 }
    );
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      dispatch(addToast({ message: 'Please fill in all required fields.', type: 'error' }));
      return;
    }

    setSubmitting(true);
    try {
      await customAxios.post('/api/contact', formData);
      setSubmitted(true);
      dispatch(addToast({ message: "Message dispatched! We'll reply to your inbox shortly.", type: 'success' }));
    } catch (err) {
      dispatch(addToast({ message: err.response?.data?.message || 'Failed to send message. Please try again.', type: 'error' }));
    } finally {
      setSubmitting(false);
    }
  };

  const CHANNELS = [
    {
      icon: RiCustomerServiceLine,
      title: 'Technical Support',
      desc: 'Experiencing an issue with multi-model queries, API keys, or social connectors?',
      action: 'support@parsuai.com',
      badge: '24/7 Monitored'
    },
    {
      icon: RiShieldCheckLine,
      title: 'Enterprise & Security',
      desc: 'Inquiries regarding custom team plans, privacy guarantees, or security audits.',
      action: 'security@parsuai.com',
      badge: 'Priority SLA'
    },
    {
      icon: RiQuestionLine,
      title: 'Community & Feedback',
      desc: 'Feature requests, bug reports, and roadmap discussions with the engineers.',
      action: 'hello@parsuai.com',
      badge: 'Open Community'
    }
  ];

  return (
    <InfoPageLayout
      title="Direct Inquiry & Support"
      subtitle="Have questions about models, integrations, or security? Connect with our core engineering team."
      badge="Get in Touch"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-5xl mx-auto">
        
        {/* Left Column: Direct Inquiries Form */}
        <div ref={formCardRef} className="lg:col-span-7 bg-white dark:bg-[#0c0d12] border border-zinc-200 dark:border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-xl">
          {submitted ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-[var(--accent-cyan)] mx-auto">
                <RiCheckboxCircleFill size={36} />
              </div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Transmission Received</h2>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
                Thank you, <strong className="text-zinc-900 dark:text-white">{formData.name}</strong>. Your message has been logged in our operations dispatch. We typically reply within 2 to 4 hours.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setFormData({ name: '', email: '', subject: '', message: '' });
                }}
                className="mt-4 px-5 py-2.5 rounded-xl bg-zinc-100 dark:bg-white/[0.05] hover:bg-zinc-200 dark:hover:bg-white/[0.1] text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Send a Message</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Fill out the details below and we will contact you via email.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Alex Parker"
                    className="w-full h-11 px-3.5 bg-zinc-50 dark:bg-white/[0.03] hover:bg-zinc-100/80 dark:hover:bg-white/[0.05] focus:bg-white dark:focus:bg-white/[0.05] border border-zinc-200 dark:border-white/[0.08] focus:border-[var(--accent-cyan)] rounded-xl text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="alex@company.com"
                    className="w-full h-11 px-3.5 bg-zinc-50 dark:bg-white/[0.03] hover:bg-zinc-100/80 dark:hover:bg-white/[0.05] focus:bg-white dark:focus:bg-white/[0.05] border border-zinc-200 dark:border-white/[0.08] focus:border-[var(--accent-cyan)] rounded-xl text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Subject / Topic
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={e => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g. Model integration, custom API quota, or partnership"
                  className="w-full h-11 px-3.5 bg-zinc-50 dark:bg-white/[0.03] hover:bg-zinc-100/80 dark:hover:bg-white/[0.05] focus:bg-white dark:focus:bg-white/[0.05] border border-zinc-200 dark:border-white/[0.08] focus:border-[var(--accent-cyan)] rounded-xl text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Describe your inquiry in detail..."
                  className="w-full p-3.5 bg-zinc-50 dark:bg-white/[0.03] hover:bg-zinc-100/80 dark:hover:bg-white/[0.05] focus:bg-white dark:focus:bg-white/[0.05] border border-zinc-200 dark:border-white/[0.08] focus:border-[var(--accent-cyan)] rounded-xl text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 bg-[var(--accent-cyan)] hover:bg-[#1bb0c4] active:scale-[0.98] text-zinc-950 font-bold rounded-xl transition-all text-xs cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <RiLoader4Line size={16} className="animate-spin" />
                    <span>Transmitting...</span>
                  </>
                ) : (
                  <>
                    <RiSendPlane2Line size={16} />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Right Column: Channels & Office Info */}
        <div className="lg:col-span-5 space-y-4">
          {CHANNELS.map((ch, i) => {
            const Icon = ch.icon;
            return (
              <div
                key={i}
                ref={el => channelsRef.current[i] = el}
                className="p-5 rounded-2xl bg-white dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.07] hover:border-zinc-300 dark:hover:border-white/15 transition-all shadow-xs"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-white/[0.05] border border-zinc-200 dark:border-white/10 flex items-center justify-center text-[var(--accent-cyan)]">
                    <Icon size={17} />
                  </div>
                  <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-white/[0.04]">
                    {ch.badge}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-zinc-900 dark:text-white mb-1">{ch.title}</h3>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed mb-2.5">{ch.desc}</p>
                <a
                  href={`mailto:${ch.action}`}
                  className="text-xs font-mono text-[var(--accent-cyan)] hover:underline font-semibold"
                >
                  {ch.action}
                </a>
              </div>
            );
          })}

          <div className="p-4 rounded-2xl bg-zinc-100/80 dark:bg-white/[0.02] border border-zinc-200/80 dark:border-white/[0.05] flex items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400">
            <RiTimeLine size={16} className="text-zinc-400 dark:text-zinc-500 shrink-0" />
            <span>Average support response time: <strong>&lt; 3 hours</strong></span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.07] shadow-xs">
            <h4 className="text-xs font-bold text-zinc-900 dark:text-white mb-2">Connect Directly</h4>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
              Reach out through our verified developer and social channels.
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { href: 'https://www.instagram.com/ashoka_3.0/', label: 'Instagram', icon: RiInstagramLine },
                { href: 'https://www.facebook.com/profile.php?id=61579561182682', label: 'Facebook', icon: RiFacebookCircleLine },
                { href: 'https://github.com/ashoka-2', label: 'GitHub', icon: RiGithubLine },
                { href: 'https://www.linkedin.com/in/ashok-kumar-016450379/', label: 'LinkedIn', icon: RiLinkedinBoxLine },
                { href: 'https://www.youtube.com/@ashoka_3.0', label: 'YouTube', icon: RiYoutubeLine },
                { href: 'https://discord.com/users/1409565502224863332', label: 'Discord', icon: RiDiscordLine },
              ].map((s) => {
                const SIcon = s.icon;
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-zinc-100 dark:bg-white/[0.05] hover:bg-zinc-200 dark:hover:bg-white/[0.1] border border-zinc-200 dark:border-white/[0.08] hover:border-zinc-300 dark:hover:border-white/20 text-zinc-700 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-all flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                    title={s.label}
                  >
                    <SIcon size={15} />
                    <span className="hidden sm:inline text-[11px]">{s.label}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </InfoPageLayout>
  );
}
