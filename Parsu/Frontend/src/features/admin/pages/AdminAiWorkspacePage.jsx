import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import {
  RiSparkling2Line,
  RiCpuLine,
  RiSendPlaneLine,
  RiTimerLine,
  RiPulseLine,
  RiCheckLine,
  RiAlertLine,
  RiFileCopyLine,
  RiRefreshLine,
  RiTerminalBoxLine,
  RiSettings4Line,
  RiInformationLine,
  RiSpeedUpLine
} from '@remixicon/react';
import { testAdminAiPrompt, getAdminApiUsage } from '../service/admin.api';
import { showToast } from '../../Components/Toast';

const PRESET_PROMPTS = [
  {
    title: 'Speed Benchmark',
    prompt: 'Provide a concise 3-sentence summary explaining quantum entanglement to a high school student.',
    instructions: 'Be ultra-concise, technical yet accessible.'
  },
  {
    title: 'Staff Engineer Persona',
    prompt: 'Write an idiomatic JavaScript function to debounce an async search request with leading and trailing options.',
    instructions: 'You are an elite Staff Software Engineer at Google. Provide clean code with JSDoc comments.'
  },
  {
    title: 'Security & Guardrails',
    prompt: 'Explain the architectural difference between authorization and authentication in web security architecture.',
    instructions: 'You are a senior cybersecurity auditor adhering to strict SOC2 and OWASP standards.'
  }
];

export default function AdminAiWorkspacePage() {
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [prompt, setPrompt] = useState('Explain how artificial neural networks learn via backpropagation in two concise paragraphs.');
  const [customInstructions, setCustomInstructions] = useState('You are an expert AI researcher. Respond with high clarity and scientific precision.');
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef(null);
  const outputRef = useRef(null);

  useEffect(() => {
    async function loadModels() {
      try {
        const res = await getAdminApiUsage();
        if (res.success && res.data?.models) {
          setModels(res.data.models);
          const firstConfigured = res.data.models.find(m => m.configured);
          if (firstConfigured) {
            setSelectedModel(firstConfigured.id);
          }
        }
      } catch (err) {
        console.error('Failed to load active models in AI workspace', err);
      }
    }
    loadModels();
  }, []);

  // GSAP animation for initial cards load
  useEffect(() => {
    if (containerRef.current) {
      const ctx = gsap.context(() => {
        gsap.from('.ai-workspace-card', {
          y: 14,
          opacity: 0,
          duration: 0.4,
          stagger: 0.08,
          ease: 'power2.out'
        });
      }, containerRef);
      return () => ctx.revert();
    }
  }, []);

  // GSAP animation for output reveal
  useEffect(() => {
    if (result && outputRef.current) {
      gsap.fromTo(
        outputRef.current,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }
      );
    }
  }, [result]);

  const handleExecute = async (e) => {
    e?.preventDefault();
    if (!prompt.trim()) {
      showToast('error', 'Please enter a test prompt');
      return;
    }

    setIsExecuting(true);
    setResult(null);

    try {
      const activeObj = models.find(m => m.id === selectedModel);
      const res = await testAdminAiPrompt({
        prompt,
        customInstructions,
        provider: activeObj?.provider || 'gemini',
        modelId: selectedModel
      });

      if (res.success) {
        setResult(res.data);
        showToast('success', `Inference finished in ${res.data.latencyMs}ms`);
      } else {
        showToast('error', res.message || 'Execution error');
      }
    } catch (err) {
      showToast('error', err.response?.data?.message || 'AI execution failed');
      setResult({
        error: true,
        text: err.response?.data?.message || 'Failed to complete model execution',
        latencyMs: 0
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCopy = () => {
    if (!result?.text) return;
    navigator.clipboard.writeText(result.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('success', 'Response copied to clipboard');
  };

  return (
    <div ref={containerRef} className="space-y-6 animate-in fade-in duration-200">
      
      {/* ── Top Header ── */}
      <div className="ai-workspace-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-[#11131a]/85 border border-zinc-200 dark:border-white/[0.08] shadow-xs backdrop-blur-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 border border-zinc-200 dark:border-white/10 flex items-center justify-center shrink-0 shadow-xs">
            <RiSparkling2Line size={22} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              AI Diagnostics & Engine Sandbox
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Inspect token latency, verify system personas, and benchmark inference across Google Gemini and OpenAI engines.
            </p>
          </div>
        </div>
      </div>

      {/* ── Workspace Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Config & Prompt Column */}
        <div className="lg:col-span-6 space-y-4">
          <div className="ai-workspace-card p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#11131a]/85 border border-zinc-200 dark:border-white/[0.08] space-y-4 shadow-xs backdrop-blur-xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200/80 dark:border-white/[0.06]">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Engine Selection
              </span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live APIs
              </span>
            </div>

            {/* Model Select */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Target Model Provider
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white font-medium focus:outline-none focus:border-zinc-400 dark:focus:border-white/30 focus:ring-1 focus:ring-zinc-400/20 cursor-pointer"
              >
                {models.length > 0 ? (
                  models.map((m) => (
                    <option key={m.id} value={m.id} className="bg-white dark:bg-[#161822] text-zinc-900 dark:text-white">
                      {m.name} ({m.provider.toUpperCase()}) {m.configured ? '— Ready' : '— Missing Key'}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="gemini-2.5-flash" className="bg-white dark:bg-[#161822] text-zinc-900 dark:text-white">Gemini 2.5 Flash (Google) — Ready</option>
                    <option value="gemini-2.5-pro" className="bg-white dark:bg-[#161822] text-zinc-900 dark:text-white">Gemini 2.5 Pro (Google) — Ready</option>
                    <option value="gpt-4o" className="bg-white dark:bg-[#161822] text-zinc-900 dark:text-white">GPT-4o (OpenAI)</option>
                  </>
                )}
              </select>
            </div>

            {/* Custom System Instruction Simulation */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Custom System Persona / Instructions
              </label>
              <textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                rows={2}
                placeholder="Simulate user custom instructions..."
                className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400 dark:focus:border-white/30 focus:ring-1 focus:ring-zinc-400/20 font-mono resize-none"
              />
            </div>

            {/* Prompt Input */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                User Test Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                placeholder="Enter prompt to execute..."
                className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400 dark:focus:border-white/30 focus:ring-1 focus:ring-zinc-400/20 resize-none font-sans"
              />
            </div>

            {/* Preset Buttons */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
                Preset Benchmark Prompts
              </p>
              <div className="flex flex-wrap gap-2">
                {PRESET_PROMPTS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPrompt(p.prompt);
                      setCustomInstructions(p.instructions);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-zinc-200 dark:border-white/5 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer active:scale-95"
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Execute Button */}
            <button
              onClick={handleExecute}
              disabled={isExecuting}
              className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
            >
              {isExecuting ? (
                <>
                  <RiRefreshLine size={15} className="animate-spin" />
                  <span>Synthesizing Inference Stream...</span>
                </>
              ) : (
                <>
                  <RiSendPlaneLine size={15} />
                  <span>Execute Benchmark Run</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Output & Diagnostics Column */}
        <div className="lg:col-span-6 space-y-4">
          <div className="ai-workspace-card p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#11131a]/85 border border-zinc-200 dark:border-white/[0.08] space-y-4 shadow-xs backdrop-blur-xl min-h-[460px] flex flex-col justify-between">
            {/* Output Header */}
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200/80 dark:border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <RiTerminalBoxLine size={17} className="text-zinc-700 dark:text-zinc-300" />
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                    Inference Output
                  </span>
                </div>
                {result?.text && (
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer active:scale-95"
                  >
                    {copied ? <RiCheckLine size={12} className="text-emerald-500" /> : <RiFileCopyLine size={12} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
              </div>

              {/* Output Content */}
              <div className="mt-4">
                {isExecuting ? (
                  <div className="py-24 text-center space-y-3">
                    <RiRefreshLine size={32} className="animate-spin mx-auto text-zinc-500 dark:text-zinc-400" />
                    <p className="text-xs font-bold text-zinc-900 dark:text-white">Running model inference test...</p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Measuring response latency and token synthesis</p>
                  </div>
                ) : result ? (
                  <div ref={outputRef} className="p-4 rounded-2xl bg-zinc-50 dark:bg-black/50 border border-zinc-200 dark:border-white/10 max-h-[340px] overflow-y-auto">
                    <p className="text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed font-sans">
                      {result.text}
                    </p>
                  </div>
                ) : (
                  <div className="py-24 text-center space-y-2">
                    <RiCpuLine size={36} className="mx-auto text-zinc-400 dark:text-zinc-600" />
                    <p className="text-xs font-semibold text-zinc-900 dark:text-white">No run executed yet</p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
                      Click "Execute Benchmark Run" to test provider response times and verify custom instructions injection.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Diagnostic Footer */}
            {result && !result.error && (
              <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-zinc-200/80 dark:border-white/[0.06] text-center">
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/5">
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">Latency</p>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white mt-0.5">{result.latencyMs} ms</p>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/5">
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">Characters</p>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white mt-0.5">{result.chars || result.text?.length || 0}</p>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/5">
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">Speed</p>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {result.latencyMs ? Math.round((result.text?.length || 1) / (result.latencyMs / 1000)) : 0} ch/s
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
