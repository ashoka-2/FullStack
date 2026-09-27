import React, { useState, useEffect } from 'react';
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
  RiInformationLine
} from '@remixicon/react';
import { testAdminAiPrompt, getAdminApiUsage } from '../service/admin.api';
import { showToast } from '../../Components/Toast';

const PRESET_PROMPTS = [
  {
    title: 'Benchmark Speed Test',
    prompt: 'Provide a concise 3-sentence summary explaining quantum entanglement to a high school student.',
    instructions: 'Be ultra-concise, technical yet accessible.'
  },
  {
    title: 'Persona Test (Developer)',
    prompt: 'Write an idiomatic JavaScript function to debounce an async search request with leading and trailing options.',
    instructions: 'You are an elite Staff Software Engineer at Google. Provide clean code with JSDoc comments.'
  },
  {
    title: 'Safety & Guardrail Test',
    prompt: 'Explain the difference between authorization and authentication in web security architecture.',
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
  const [activeTab, setActiveTab] = useState('output');
  const [copied, setCopied] = useState(false);

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
    <div className="space-y-6">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-primary)] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500">
            <RiSparkling2Line size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-[var(--text-primary)] tracking-tight">AI Diagnostics & Engine Sandbox</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Inspect latency, test custom instruction personas, and benchmark AI generation directly across all configured providers
            </p>
          </div>
        </div>
      </div>

      {/* ── Workspace Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Config & Prompt Column */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-primary)] space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">Engine Selection</span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-500 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live APIs
              </span>
            </div>

            {/* Model Select */}
            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                Target Model Provider
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-xs text-[var(--text-primary)] font-semibold focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {models.length > 0 ? (
                  models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.provider.toUpperCase()}) {m.configured ? '— Ready' : '— Missing Key'}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (Google) — Ready</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro (Google) — Ready</option>
                    <option value="gpt-4o">GPT-4o (OpenAI)</option>
                  </>
                )}
              </select>
            </div>

            {/* Custom System Instruction Simulation */}
            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                Custom System Persona / Instructions
              </label>
              <textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                rows={2}
                placeholder="Simulate user custom instructions..."
                className="w-full p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-cyan-500 font-mono resize-none"
              />
            </div>

            {/* Prompt Input */}
            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                User Test Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                placeholder="Enter prompt to execute..."
                className="w-full p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-cyan-500 resize-none font-sans"
              />
            </div>

            {/* Preset Buttons */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Preset Benchmark Prompts</p>
              <div className="flex flex-wrap gap-2">
                {PRESET_PROMPTS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPrompt(p.prompt);
                      setCustomInstructions(p.instructions);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-primary)] text-[11px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
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
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-black font-black text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isExecuting ? (
                <>
                  <RiRefreshLine size={16} className="animate-spin" />
                  Generating Inference Stream...
                </>
              ) : (
                <>
                  <RiSendPlaneLine size={16} />
                  Execute Benchmark Run
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Output & Diagnostics Column */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-primary)] space-y-4 shadow-sm min-h-[440px] flex flex-col justify-between">
            {/* Output Header */}
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-primary)]">
                <div className="flex items-center gap-2">
                  <RiTerminalBoxLine size={18} className="text-cyan-500" />
                  <span className="text-xs font-black uppercase tracking-wider text-[var(--text-primary)]">Inference Output</span>
                </div>
                {result?.text && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-surface-hover)] text-[11px] font-bold text-[var(--text-primary)] transition-colors cursor-pointer"
                    >
                      {copied ? <RiCheckLine size={12} className="text-emerald-500" /> : <RiFileCopyLine size={12} />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                )}
              </div>

              {/* Output Content */}
              <div className="mt-4">
                {isExecuting ? (
                  <div className="py-24 text-center space-y-3">
                    <RiRefreshLine size={32} className="animate-spin mx-auto text-cyan-500" />
                    <p className="text-xs font-bold text-[var(--text-primary)]">Running model inference test...</p>
                    <p className="text-[11px] text-[var(--text-secondary)]">Measuring response latency and token synthesis</p>
                  </div>
                ) : result ? (
                  <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] max-h-[340px] overflow-y-auto">
                    <p className="text-xs text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed font-sans">
                      {result.text}
                    </p>
                  </div>
                ) : (
                  <div className="py-24 text-center space-y-2">
                    <RiCpuLine size={36} className="mx-auto text-[var(--text-muted)]" />
                    <p className="text-xs font-bold text-[var(--text-primary)]">No run executed yet</p>
                    <p className="text-[11px] text-[var(--text-secondary)] max-w-xs mx-auto">
                      Click "Execute Benchmark Run" to test provider response times and verify custom instructions injection.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Diagnostic Footer */}
            {result && !result.error && (
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[var(--border-primary)] text-center">
                <div className="p-2 rounded-xl bg-[var(--bg-secondary)]">
                  <p className="text-[10px] text-[var(--text-secondary)] font-bold">Latency</p>
                  <p className="text-xs font-black text-cyan-500 mt-0.5">{result.latencyMs} ms</p>
                </div>
                <div className="p-2 rounded-xl bg-[var(--bg-secondary)]">
                  <p className="text-[10px] text-[var(--text-secondary)] font-bold">Output Chars</p>
                  <p className="text-xs font-black text-[var(--text-primary)] mt-0.5">{result.chars || result.text?.length || 0}</p>
                </div>
                <div className="p-2 rounded-xl bg-[var(--bg-secondary)]">
                  <p className="text-[10px] text-[var(--text-secondary)] font-bold">Est. Speed</p>
                  <p className="text-xs font-black text-emerald-500 mt-0.5">
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
