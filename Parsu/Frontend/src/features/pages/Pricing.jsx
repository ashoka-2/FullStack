import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import {
  RiCheckLine,
  RiCloseLine,
  RiSparkling2Line,
  RiFlashlightLine,
  RiShieldCheckLine,
  RiArrowDownSLine,
  RiLoader4Line,
  RiGlobalLine,
  RiLockLine,
  RiCpuLine,
  RiArrowRightLine,
  RiQuestionLine,
  RiInformationLine,
  RiShieldKeyholeLine,
  RiExchangeLine,
  RiEqualizerLine
} from '@remixicon/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import InfoPageLayout from './InfoPageLayout';
import { createRazorpayOrder, verifyPaymentSignature } from '../auth/service/subscription.api';
import { setUser } from '../auth/auth.slice';
import { addToast } from '../../utils/toast.slice';
import { PillBadge } from '../Components/PillButton';
import PrimaryButton from '../Components/PrimaryButton';

gsap.registerPlugin(ScrollTrigger);

const DISPLAY = "'Bricolage Grotesque','Outfit',system-ui,sans-serif";
const SERIF = "'Instrument Serif','Times New Roman',serif";
const SHAPE_A = '63% 37% 54% 46% / 55% 48% 52% 45%';
const SHAPE_B = '38% 62% 47% 53% / 44% 56% 44% 56%';

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'
  const [currency, setCurrency] = useState('USD');
  const [isIndia, setIsIndia] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [loadingTier, setLoadingTier] = useState(null);

  // Live pricing toggle state (controllable via localStorage or Admin Dashboard)
  const [isPricingPublished, setIsPricingPublished] = useState(() => {
    return localStorage.getItem('parsu_admin_pricing_published') === 'true';
  });

  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const rootRef = useRef(null);

  // Auto-detect user's location on mount
  useEffect(() => {
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      const languages = navigator.languages ? navigator.languages.join(',') : navigator.language || '';
      const inIndia =
        timeZone.includes('Calcutta') ||
        timeZone.includes('Kolkata') ||
        languages.includes('-IN') ||
        languages.includes('hi');
      if (inIndia) {
        setCurrency('INR');
        setIsIndia(true);
      } else {
        setCurrency('USD');
        setIsIndia(false);
      }
    } catch {
      setCurrency('USD');
    }

    const handleStorageChange = () => {
      setIsPricingPublished(localStorage.getItem('parsu_admin_pricing_published') === 'true');
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('parsu_pricing_visibility_changed', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('parsu_pricing_visibility_changed', handleStorageChange);
    };
  }, []);

  const currencySymbol = currency === 'INR' ? '₹' : '$';

  // Pricing tier definitions
  const TIERS = [
    {
      id: 'free',
      name: 'Starter',
      badge: 'Free Forever',
      tagline: 'Ideal for everyday work, quick research, and getting started.',
      desc: 'Essential multi-model AI reasoning, live web search & custom BYOK integration.',
      monthlyPrice: 0,
      yearlyPrice: 0,
      period: 'Free forever',
      icon: RiFlashlightLine,
      isFree: true,
      isComingSoon: false,
      popular: false,
      features: [
        '50 AI messages per day (built-in models)',
        'Unlimited AI messages when custom API key added',
        '2 RAG file uploads per day (5 with custom API key)',
        '10 social media posts daily (20 with custom API key)',
        'Live internet search with real-time citations',
        'Multimodal vision image analysis & captioning',
        'Standard response speed & community support'
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      badge: 'Most Popular',
      tagline: 'For professionals, analysts, and content teams seeking speed.',
      desc: 'Advanced intelligence with flagship reasoning models and expanded quotas.',
      monthlyPrice: currency === 'INR' ? 499 : 9,
      yearlyPrice: currency === 'INR' ? 399 : 7,
      period: billingCycle === 'yearly' ? 'billed annually' : 'billed monthly',
      icon: RiSparkling2Line,
      popular: true,
      isFree: false,
      isComingSoon: !isPricingPublished,
      features: [
        '50 AI messages per day on built-in flagship models',
        'Unlimited AI messages when custom API key added',
        '10 RAG file uploads per day (15 with custom API key)',
        '50 social media posts daily (with or without custom key)',
        'Full access to Claude 3.7 Sonnet, GPT-4o & Gemini Pro',
        'Cross-chat vector memory & custom instructions',
        'Priority inference GPU queue & fast responses'
      ]
    },
    {
      id: 'ultra',
      name: 'Ultra',
      badge: 'Frontier Power',
      tagline: 'Unrestricted frontier reasoning for mission-critical tasks.',
      desc: 'Frontier reasoning models, massive context, and unlimited everything.',
      monthlyPrice: currency === 'INR' ? 999 : 19,
      yearlyPrice: currency === 'INR' ? 799 : 15,
      period: billingCycle === 'yearly' ? 'billed annually' : 'billed monthly',
      icon: RiCpuLine,
      popular: false,
      isFree: false,
      isComingSoon: !isPricingPublished,
      features: [
        'Everything Unlimited — No daily caps or restrictions',
        'Unlimited AI messages across all frontier models',
        'Unlimited RAG document & PDF uploads',
        'Unlimited social media posts across all platforms',
        'Frontier models: OpenAI o1, o3-mini & DeepSeek R1',
        'Massive 1M+ token context window',
        'Dedicated high-throughput compute pipeline',
        '24/7 Priority support & VIP private channel'
      ]
    }
  ];

  // Feature Comparison Matrix Data
  const MATRIX_CATEGORIES = [
    {
      name: 'Core Intelligence & Models',
      rows: [
        { feature: 'Supported Models', free: 'Gemini Flash, Claude 3.5 Haiku', pro: 'Claude 3.7 Sonnet, GPT-4o, Gemini Pro', ultra: 'o1, o3-mini, DeepSeek R1 & all flagship' },
        { feature: 'Daily AI Messages', free: '50 / day', pro: '50 / day (Flagship)', ultra: 'Unlimited' },
        { feature: 'Bring Your Own Key (BYOK)', free: 'Unlimited messages', pro: 'Unlimited messages', ultra: 'Unlimited messages' },
        { feature: 'Live Web Search & Sources', free: 'Included', pro: 'Deep Web Search', ultra: 'Frontier Multi-Engine Search' },
        { feature: 'Multimodal Vision Analysis', free: 'Included', pro: 'High-Res Vision', ultra: 'Full Ultra Resolution' }
      ]
    },
    {
      name: 'Memory & Document Workspace',
      rows: [
        { feature: 'Daily Document Uploads (RAG)', free: '2 docs / day', pro: '10 docs / day', ultra: 'Unlimited docs' },
        { feature: 'Upload Cap with Custom Key', free: '5 docs / day', pro: '15 docs / day', ultra: 'Unlimited docs' },
        { feature: 'Vector Long-Term Memory', free: 'Standard', pro: 'Cross-Chat Neural Memory', ultra: 'Persistent Project Memory' },
        { feature: 'Context Window Size', free: '32k tokens', pro: '200k tokens', ultra: '1M+ tokens' }
      ]
    },
    {
      name: 'Publishing & Channels',
      rows: [
        { feature: 'Social Publishing Networks', free: 'All 7 Networks', pro: 'All 7 Networks', ultra: 'All 7 Networks' },
        { feature: 'Daily Social Posts', free: '10 / day', pro: '50 / day', ultra: 'Unlimited' },
        { feature: 'Post Scheduling & Automation', free: 'Manual draft', pro: 'Automated queue', ultra: 'Multi-account automated pipeline' }
      ]
    },
    {
      name: 'Speed & Service Level',
      rows: [
        { feature: 'Inference Queue Priority', free: 'Standard', pro: 'High Priority', ultra: 'Dedicated VIP Compute' },
        { feature: 'Response Speed', free: 'Standard', pro: 'Turbocharged', ultra: 'Sub-second Streaming' },
        { feature: 'Support SLA', free: 'Community', pro: 'Email Priority (12h)', ultra: '24/7 Dedicated Channel (1h)' }
      ]
    }
  ];

  const FAQS = [
    {
      q: 'How does India vs International pricing work?',
      a: 'Parsu AI automatically checks your location. Visitors in India are shown local Indian Rupee (₹) pricing with localized UPI and RuPay card support. International visitors receive standard USD ($) pricing with zero foreign transaction fees.'
    },
    {
      q: 'Can I start with the Free plan?',
      a: 'Yes! The Starter Free plan is available immediately with zero credit card required. You get 50 daily queries across top models, multimodal vision, and live web search with citations.'
    },
    {
      q: 'How does Bring Your Own Key (BYOK) work?',
      a: 'If you already have your own API keys from Google Gemini, Anthropic, or OpenAI, you can paste them into your Settings. Once added, your query quota becomes completely unlimited even on the free Starter plan.'
    },
    {
      q: 'When will Pro and Ultra subscriptions become active?',
      a: 'Paid plans are currently in early-access preview mode. When live deployment is activated, you will be able to subscribe seamlessly with monthly and yearly billing.'
    },
    {
      q: 'Can I cancel or change my plan anytime?',
      a: 'Yes, subscriptions have no lock-in. You can upgrade, downgrade, or cancel anytime directly in your Account Settings. If you cancel, your benefits stay active until the end of your billing cycle.'
    },
    {
      q: 'Is my proprietary data used to train AI models?',
      a: 'Never. Parsu AI enforces strict zero-data-retention APIs with enterprise providers. Your prompts, document uploads, and social posts are completely private and never used for model training.'
    }
  ];

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSelectPlan = async (tier) => {
    if (tier.isFree) {
      navigate('/ai');
      return;
    }

    if (!isPricingPublished) {
      dispatch(addToast({ type: 'info', message: `${tier.name} plan is launching shortly in early access.` }));
      return;
    }

    if (!user) {
      dispatch(addToast({ type: 'info', message: 'Please create an account or sign in to complete your subscription.' }));
      navigate('/auth?mode=register&redirect=/pricing');
      return;
    }

    setLoadingTier(tier.id);

    try {
      const orderData = await createRazorpayOrder({
        plan: tier.id,
        billingCycle,
        currency
      });

      if (!orderData?.orderId) {
        throw new Error(orderData?.message || 'Failed to create payment order');
      }

      const isLoaded = await loadRazorpay();
      if (!isLoaded) {
        throw new Error('Unable to connect to payment gateway');
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || currency,
        name: 'Parsu AI',
        description: `${tier.name} Plan (${billingCycle})`,
        order_id: orderData.orderId,
        handler: async (response) => {
          try {
            const verifyRes = await verifyPaymentSignature({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              plan: tier.id,
              billingCycle,
              currency
            });

            if (verifyRes.success) {
              dispatch(setUser(verifyRes.user));
              dispatch(addToast({ type: 'success', message: `🎉 Welcome to Parsu AI ${tier.name}!` }));
              navigate('/settings/subscription');
            } else {
              dispatch(addToast({ type: 'error', message: verifyRes.message || 'Payment verification failed.' }));
            }
          } catch (vErr) {
            dispatch(addToast({ type: 'error', message: vErr.response?.data?.message || 'Payment verification failed.' }));
          }
        },
        prefill: {
          name: user?.username || '',
          email: user?.email || ''
        },
        theme: {
          color: '#20b8cd'
        },
        modal: {
          ondismiss: () => {
            dispatch(addToast({ type: 'info', message: 'Payment modal closed.' }));
            setLoadingTier(null);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        dispatch(addToast({ type: 'error', message: resp.error?.description || 'Payment was unsuccessful.' }));
      });
      rzp.open();
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.response?.data?.message || err.message || 'Failed to initialize payment' }));
    } finally {
      setLoadingTier(null);
    }
  };

  /* ── GSAP Micro-Interactions & Scroll Animations ── */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const mm = gsap.matchMedia();
    mm.add(
      {
        motion: '(prefers-reduced-motion: no-preference)',
        desktop: '(min-width: 1024px)',
        mouse: '(hover: hover) and (pointer: fine)'
      },
      (ctx) => {
        const { motion, mouse } = ctx.conditions;
        if (!motion) return;

        const off = [];
        const on = (el, ev, fn) => {
          if (!el) return;
          el.addEventListener(ev, fn);
          off.push(() => el.removeEventListener(ev, fn));
        };

        // Controls and Cards entrance
        const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
        if (root.querySelector('.pricing-controls')) {
          tl.from('.pricing-controls', { y: 16, opacity: 0, duration: 0.6 });
        }
        const cards = root.querySelectorAll('.tier-card');
        if (cards.length > 0) {
          tl.fromTo(
            cards,
            { y: 35, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out', clearProps: 'opacity,transform' },
            '-=0.3'
          );
        }

        // Interactive Card hover spotlight and tilt
        if (mouse) {
          const cards = root.querySelectorAll('.tier-card');
          cards.forEach((card) => {
            const spot = card.querySelector('.card-spotlight');
            if (spot) {
              gsap.set(spot, { xPercent: -50, yPercent: -50 });
              const sx = gsap.quickTo(spot, 'x', { duration: 0.4, ease: 'power3.out' });
              const sy = gsap.quickTo(spot, 'y', { duration: 0.4, ease: 'power3.out' });

              on(card, 'pointermove', (e) => {
                const rect = card.getBoundingClientRect();
                sx(e.clientX - rect.left);
                sy(e.clientY - rect.top);
              });
            }

            on(card, 'pointerenter', () => {
              gsap.to(card, { y: -8, scale: 1.015, duration: 0.35, ease: 'power2.out' });
            });
            on(card, 'pointerleave', () => {
              gsap.to(card, { y: 0, scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.5)' });
            });
          });

          // Magnetic switcher buttons
          const switchers = root.querySelectorAll('[data-magnetic]');
          switchers.forEach((btn) => {
            on(btn, 'pointermove', (e) => {
              const r = btn.getBoundingClientRect();
              gsap.to(btn, {
                x: (e.clientX - r.left - r.width / 2) * 0.2,
                y: (e.clientY - r.top - r.height / 2) * 0.2,
                duration: 0.25
              });
            });
            on(btn, 'pointerleave', () => {
              gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
            });
          });
        }

        // Morphing ambient blobs
        const blobs = root.querySelectorAll('.pricing-blob');
        blobs.forEach((b, i) => {
          gsap.to(b, {
            borderRadius: SHAPE_B,
            rotate: i % 2 ? 14 : -14,
            duration: 9 + i * 2,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut'
          });
        });

        // Scroll reveals for Matrix and FAQ
        gsap.utils.toArray('.reveal-section', root).forEach((el) => {
          gsap.fromTo(
            el,
            { y: 35, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.8,
              ease: 'power3.out',
              scrollTrigger: { trigger: el, start: 'top 88%', once: true }
            }
          );
        });

        return () => off.forEach((fn) => fn());
      },
      root
    );

    return () => mm.revert();
  }, []);

  // Price morph animation on billingCycle or currency change
  useEffect(() => {
    const prices = rootRef.current?.querySelectorAll('.tier-price-val');
    if (prices) {
      gsap.fromTo(
        prices,
        { scale: 0.85, opacity: 0.4, y: 4 },
        { scale: 1, opacity: 1, y: 0, duration: 0.35, ease: 'back.out(2)', stagger: 0.04 }
      );
    }
  }, [billingCycle, currency]);

  return (
    <InfoPageLayout
      title="Transparent, Predictable Pricing"
      subtitle="Start free with powerful AI models, or upgrade to unleash full research capabilities."
      badge="Plans & Pricing"
    >
      <div ref={rootRef} className="relative z-10 max-w-7xl mx-auto space-y-20 sm:space-y-28 selection:bg-[var(--accent-cyan)]/30">
        
        {/* CSS for dynamic text shine */}
        <style>{`
          .parsu-shine {
            background-image: linear-gradient(105deg, #0e7490 0%, #22b8cf 22%, #7dd3fc 45%, #0891b2 70%, #22d3ee 100%);
            background-size: 260% 100%;
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            -webkit-text-fill-color: transparent;
            animation: parsuShine 7s ease-in-out infinite;
          }
          .dark .parsu-shine {
            background-image: linear-gradient(105deg, #a5f3fc 0%, #22d3ee 22%, #f0fdff 45%, #38bdf8 70%, #67e8f9 100%);
          }
          @keyframes parsuShine {
            0%, 100% { background-position: 0% 50% }
            50% { background-position: 100% 50% }
          }
          @media (prefers-reduced-motion: reduce) {
            .parsu-shine { animation: none }
          }
        `}</style>

        {/* ── AMBIENT MORPHING BLOBS (Contained to background) ── */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -top-20 overflow-hidden z-0 select-none">
          <div
            className="pricing-blob absolute -top-10 left-[8%] w-[55vw] max-w-[650px] h-[400px] bg-gradient-to-br from-[#22d3ee]/20 via-[#38bdf8]/15 to-[#1e3a8a]/20 dark:from-[#0891b2]/25 dark:via-[#0e7490]/20 dark:to-[#1e3a8a]/25 blur-[100px] opacity-70"
            style={{ borderRadius: SHAPE_A }}
          />
          <div
            className="pricing-blob absolute top-[25%] -right-[5%] w-[45vw] max-w-[550px] h-[420px] bg-gradient-to-bl from-[#7dd3fc]/20 via-[#22d3ee]/15 to-[#0ea5e9]/20 dark:from-[#155e75]/25 dark:via-[#1d4ed8]/20 dark:to-[#0f766e]/20 blur-[100px] opacity-60"
            style={{ borderRadius: SHAPE_A }}
          />
        </div>

        {/* ── CONTROLS: Currency & Billing Cycle Switcher ── */}
        <div className="pricing-controls flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 -mt-6 mb-4 relative z-10">
          {/* Location & Currency Switcher */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-white/10 shadow-xs backdrop-blur-md">
            {isIndia ? (
              <span className="text-sm">🇮🇳</span>
            ) : (
              <RiGlobalLine size={15} className="text-[var(--accent-cyan)]" />
            )}
            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              {currency === 'INR' ? 'India Pricing (₹ INR)' : 'International ($ USD)'}
            </span>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <button
              type="button"
              onClick={() => setCurrency(currency === 'INR' ? 'USD' : 'INR')}
              className="text-[11px] font-mono font-bold text-[var(--accent-cyan)] hover:underline cursor-pointer flex items-center gap-1"
              title="Switch currency"
            >
              <RiExchangeLine size={13} />
              <span>Switch to {currency === 'INR' ? 'USD' : 'INR'}</span>
            </button>
          </div>

          {/* Monthly / Annual Toggle with Save 20% Badge */}
          <div className="inline-flex items-center p-1 rounded-full bg-zinc-100/90 dark:bg-white/[0.05] border border-zinc-200/80 dark:border-white/10 backdrop-blur-md shadow-xs">
            <button
              type="button"
              data-magnetic
              onClick={() => setBillingCycle('monthly')}
              className={`relative px-4 sm:px-5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-white dark:bg-white/15 text-zinc-950 dark:text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              data-magnetic
              onClick={() => setBillingCycle('yearly')}
              className={`relative flex items-center gap-1.5 px-4 sm:px-5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                billingCycle === 'yearly'
                  ? 'bg-white dark:bg-white/15 text-zinc-950 dark:text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <span>Yearly</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* ── 3 INTERACTIVE PRICING CARDS ── */}
        <section className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch max-w-6xl mx-auto">
          {TIERS.map((tier) => {
            const Icon = tier.icon;
            const price = billingCycle === 'yearly' ? tier.yearlyPrice : tier.monthlyPrice;

            return (
              <div
                key={tier.id}
                className={`tier-card group relative flex flex-col justify-between rounded-[2rem] p-7 sm:p-9 transition-all duration-300 will-change-transform ${
                  tier.popular
                    ? 'bg-gradient-to-b from-white via-white to-cyan-50/30 dark:from-[#0d1017] dark:via-[#090b10] dark:to-[#07090e] border-2 border-[var(--accent-cyan)] shadow-2xl shadow-cyan-500/15 lg:-translate-y-2'
                    : 'bg-white/80 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/10 shadow-lg shadow-black/[0.02] dark:shadow-none backdrop-blur-xl'
                }`}
              >
                {/* Reactive Card Spotlight on Pointer Hover */}
                <div
                  className="card-spotlight pointer-events-none absolute left-0 top-0 w-80 h-80 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: tier.popular
                      ? 'radial-gradient(circle, rgba(34,211,238,0.22), transparent 70%)'
                      : 'radial-gradient(circle, rgba(255,255,255,0.08), transparent 70%)'
                  }}
                />

                {/* Top Badge */}
                {tier.badge && (
                  <div className="absolute top-5 right-5 z-20">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        tier.popular
                          ? 'bg-[var(--accent-cyan)] text-zinc-950 shadow-sm'
                          : 'bg-zinc-100 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/10'
                      }`}
                    >
                      {tier.popular && <RiSparkling2Line size={12} />}
                      {tier.badge}
                    </span>
                  </div>
                )}

                {/* Card Header */}
                <div className="relative z-10 mb-6">
                  {/* Icon */}
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${
                      tier.popular
                        ? 'bg-[var(--accent-cyan)]/15 border border-[var(--accent-cyan)]/30 text-[var(--accent-cyan)]'
                        : 'bg-zinc-100 dark:bg-white/[0.06] border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <Icon size={24} />
                  </div>

                  <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight" style={{ fontFamily: DISPLAY }}>
                    {tier.name}
                  </h2>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 min-h-[32px] leading-relaxed">
                    {tier.tagline}
                  </p>

                  {/* Price display with numerical morph animation */}
                  <div className="mt-6 flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white">
                      {currencySymbol}
                    </span>
                    <span className="tier-price-val font-display text-5xl sm:text-6xl font-black tracking-tight text-zinc-900 dark:text-white">
                      {price}
                    </span>
                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 ml-1">
                      {tier.isFree ? 'forever' : '/ month'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1 font-medium">
                    {tier.period}
                  </p>
                </div>

                {/* Feature Bullet Points */}
                <div className="relative z-10 flex-1 my-6 border-t border-b border-zinc-100 dark:border-white/[0.06] py-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mb-4">
                    What's Included
                  </p>
                  <ul className="space-y-3.5">
                    {tier.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-xs text-zinc-700 dark:text-zinc-300 leading-snug">
                        <span className="grid h-4 w-4 place-items-center rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[var(--accent-cyan)] shrink-0 mt-0.5">
                          <RiCheckLine size={11} />
                        </span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Action Button */}
                <div className="relative z-10 pt-2">
                  {tier.isComingSoon ? (
                    <button
                      type="button"
                      disabled
                      className="w-full py-4 px-4 rounded-2xl text-xs font-bold bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/10 text-zinc-400 dark:text-zinc-500 cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-wider select-none"
                    >
                      <RiLockLine size={15} />
                      <span>Early Access Preview</span>
                    </button>
                  ) : tier.isFree ? (
                    <PrimaryButton
                      to="/ai"
                      size="md"
                      fullWidth
                      icon={RiArrowRightLine}
                      iconPosition="right"
                    >
                      Get Started Free
                    </PrimaryButton>
                  ) : (
                    <PrimaryButton
                      type="button"
                      onClick={() => handleSelectPlan(tier)}
                      disabled={loadingTier === tier.id}
                      loading={loadingTier === tier.id}
                      size="md"
                      fullWidth
                      icon={RiArrowRightLine}
                      iconPosition="right"
                    >
                      {loadingTier === tier.id ? 'Connecting...' : `Upgrade to ${tier.name}`}
                    </PrimaryButton>
                  )}
                  <p className="text-center text-[10px] text-zinc-400 dark:text-zinc-500 mt-2.5">
                    {tier.isFree ? 'No credit card required' : 'Cancel or change anytime'}
                  </p>
                </div>
              </div>
            );
          })}
        </section>

        {/* ── SUPERPOWERS COMPARISON MATRIX ── */}
        <section className="reveal-section relative z-10 max-w-5xl mx-auto pt-6">
          <div className="text-center mb-10">
            <PillBadge variant="default" className="text-xs mb-3">
              <RiEqualizerLine size={13} className="text-[var(--accent-cyan)]" />
              <span>Full Capability Matrix</span>
            </PillBadge>
            <h2 className="text-2xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight" style={{ fontFamily: DISPLAY }}>
              Compare Superpowers Across Tiers
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-2 max-w-xl mx-auto">
              Everything you get in each plan at a glance. No hidden restrictions or surprise bills.
            </p>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-zinc-200/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.02] backdrop-blur-xl shadow-lg shadow-black/[0.02]">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-zinc-200/80 dark:border-white/10 bg-zinc-50/80 dark:bg-white/[0.04]">
                  <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 w-2/5">
                    Feature
                  </th>
                  <th className="py-4 px-4 text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200 w-1/5 text-center">
                    Starter
                  </th>
                  <th className="py-4 px-4 text-xs font-black uppercase tracking-wider text-[var(--accent-cyan)] w-1/5 text-center bg-[var(--accent-cyan)]/[0.04]">
                    Pro ⭐
                  </th>
                  <th className="py-4 px-4 text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200 w-1/5 text-center">
                    Ultra
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-white/[0.05]">
                {MATRIX_CATEGORIES.map((cat, catIdx) => (
                  <React.Fragment key={catIdx}>
                    <tr className="bg-zinc-100/50 dark:bg-white/[0.02]">
                      <td colSpan={4} className="py-3 px-6 text-[11px] font-black uppercase tracking-[0.2em] text-[var(--accent-cyan)]">
                        {cat.name}
                      </td>
                    </tr>
                    {cat.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-zinc-50/80 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-6 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                          {row.feature}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-zinc-600 dark:text-zinc-400 text-center font-medium">
                          {row.free}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-semibold text-zinc-900 dark:text-white text-center bg-[var(--accent-cyan)]/[0.02]">
                          {row.pro}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-zinc-600 dark:text-zinc-300 text-center font-medium">
                          {row.ultra}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── FREQUENTLY ASKED QUESTIONS ACCORDION ── */}
        <section className="reveal-section relative z-10 max-w-4xl mx-auto pt-4">
          <div className="text-center mb-10">
            <PillBadge variant="default" className="text-xs mb-3">
              <RiQuestionLine size={13} className="text-[var(--accent-cyan)]" />
              <span>Got Questions?</span>
            </PillBadge>
            <h2 className="text-2xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight" style={{ fontFamily: DISPLAY }}>
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-2">
              Everything you need to know about billing, quotas, currency and API usage.
            </p>
          </div>

          <div className="space-y-3.5">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                    isOpen
                      ? 'border-[var(--accent-cyan)]/50 bg-white dark:bg-white/[0.05] shadow-md'
                      : 'border-zinc-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.02]'
                  }`}
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaq(isOpen ? -1 : index)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {faq.q}
                    </span>
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-zinc-100 dark:bg-white/10 shrink-0">
                      <RiArrowDownSLine
                        size={16}
                        className={`transition-transform duration-300 ${
                          isOpen ? 'rotate-180 text-[var(--accent-cyan)]' : 'text-zinc-400'
                        }`}
                      />
                    </span>
                  </button>

                  <div
                    className="overflow-hidden transition-all duration-300"
                    style={{
                      maxHeight: isOpen ? 300 : 0,
                      opacity: isOpen ? 1 : 0
                    }}
                  >
                    <p className="border-t border-zinc-100 dark:border-white/5 px-4 sm:px-5 pb-5 pt-3 text-xs sm:text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                      {faq.a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── ENTERPRISE & CUSTOM ASSISTANCE CARD ── */}
        <section className="reveal-section relative z-10 max-w-4xl mx-auto pb-8">
          <div className="relative overflow-hidden rounded-3xl border border-zinc-200/80 dark:border-white/10 bg-gradient-to-br from-white via-zinc-50 to-cyan-50/20 dark:from-[#0d1017] dark:via-[#090b10] dark:to-[#07090e] p-8 sm:p-12 text-center backdrop-blur-xl">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-[var(--accent-cyan)] grid place-items-center mx-auto mb-4">
              <RiShieldKeyholeLine size={24} />
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight" style={{ fontFamily: DISPLAY }}>
              Need dedicated volume, private VPC, or custom model fine-tuning?
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
              We work with agencies, research labs, and enterprises requiring dedicated GPUs, on-premise deployments, or custom SLA guarantees.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              <PrimaryButton to="/contact" size="md" icon={RiArrowRightLine} iconPosition="right">
                Contact Enterprise Sales
              </PrimaryButton>
              <Link
                to="/about"
                className="px-5 py-2.5 rounded-full text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
              >
                Learn More About Us
              </Link>
            </div>
          </div>
        </section>

      </div>
    </InfoPageLayout>
  );
}
