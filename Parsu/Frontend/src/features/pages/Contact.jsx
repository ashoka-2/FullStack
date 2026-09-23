import React, { useState } from 'react';
import { Link } from 'react-router';
import {
  RiMailLine,
  RiArrowLeftLine,
  RiSendPlane2Line,
  RiUserLine,
  RiMailSendLine,
  RiQuestionLine,
  RiCustomerServiceLine,
  RiGithubLine,
  RiTwitterXLine,
  RiDiscordLine,
  RiCheckboxCircleFill
} from '@remixicon/react';
import InfoPageLayout from './InfoPageLayout';
import { useDispatch } from 'react-redux';
import { addToast } from '../../utils/toast.slice';

const ContactCard = ({ icon: Icon, title, description, action, gradient }) => (
  <div className="group p-5 rounded-2xl bg-white dark:bg-[#0e0f10] border border-zinc-200/60 dark:border-white/5 hover:border-cyan-500/30 dark:hover:border-cyan-500/20 transition-all shadow-sm">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${gradient}`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-1">{title}</h3>
    <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mb-3 leading-relaxed">{description}</p>
    <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400">{action}</span>
  </div>
);

const Contact = () => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      dispatch(addToast({ message: 'Please fill in all required fields.', type: 'error' }));
      return;
    }
    // Simulate form submission
    setSubmitted(true);
    dispatch(addToast({ message: 'Message sent successfully! We\'ll get back to you soon.', type: 'success' }));
  };

  return (
    <InfoPageLayout 
      title="Contact Us" 
      subtitle="We'd love to hear from you" 
      badge="Support & Feedback"
    >
      <div>
        {/* Contact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <ContactCard
            icon={RiMailSendLine}
            title="Email Support"
            description="For general inquiries and support requests."
            action="support@parsu.app"
            gradient="bg-gradient-to-br from-cyan-500 to-blue-600"
          />
          <ContactCard
            icon={RiCustomerServiceLine}
            title="Technical Help"
            description="API integration, custom models, or bug reports."
            action="tech@parsu.app"
            gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          />
          <ContactCard
            icon={RiQuestionLine}
            title="FAQ"
            description="Find quick answers to common questions."
            action={<Link to="/faq" className="text-cyan-600 dark:text-cyan-400 hover:underline">Visit FAQ →</Link>}
            gradient="bg-gradient-to-br from-amber-500 to-orange-600"
          />
        </div>

        {/* Contact Form */}
        <div className="bg-white dark:bg-[#0e0f10] rounded-2xl border border-zinc-200/60 dark:border-white/5 p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Send us a Message</h2>
          <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mb-6">We typically respond within 24 hours.</p>

          {submitted ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <RiCheckboxCircleFill className="w-7 h-7 text-emerald-500" />
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-2">Message Sent!</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5">Thank you for reaching out. We'll get back to you soon.</p>
              <button
                onClick={() => { setSubmitted(false); setFormData({ name: '', email: '', subject: '', message: '' }); }}
                className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Name *</label>
                  <div className="relative">
                    <RiUserLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Your name"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-cyan-500/50 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Email *</label>
                  <div className="relative">
                    <RiMailLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your@email.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-cyan-500/50 transition-colors"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Subject</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="What's this about?"
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Message *</label>
                <textarea
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us more..."
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-cyan-500/50 transition-colors resize-none"
                />
              </div>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold hover:opacity-90 transition-all shadow-lg"
              >
                <RiSendPlane2Line className="w-4 h-4" />
                Send Message
              </button>
            </form>
          )}
        </div>

        {/* Social Channels */}
        <div className="mt-8 text-center">
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-3">You can also find us on:</p>
          <div className="flex items-center justify-center gap-3">
            {[
              { icon: RiGithubLine, href: '#', label: 'GitHub' },
              { icon: RiTwitterXLine, href: '#', label: 'X' },
              { icon: RiDiscordLine, href: '#', label: 'Discord' },
            ].map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 hover:border-cyan-500/30 dark:hover:border-cyan-500/20 text-zinc-500 dark:text-zinc-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all"
                title={s.label}
              >
                <s.icon className="w-4.5 h-4.5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </InfoPageLayout>
  );
};

export default Contact;
