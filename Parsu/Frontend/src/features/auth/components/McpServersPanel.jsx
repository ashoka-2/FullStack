import React, { useEffect, useState } from 'react';
import {
  RiServerLine,
  RiAddLine,
  RiCheckLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiRefreshLine,
  RiSparklingLine,
  RiFlashlightLine,
  RiTerminalBoxLine,
  RiLinkM,
  RiCpuLine,
  RiLoader4Line
} from '@remixicon/react';
import { getMcpServers, createMcpServer, deleteMcpServer, testMcpServer } from '../service/settings.api';

const PRESETS = [
  {
    name: 'Blender 3D Studio',
    transport: 'sse',
    url: 'http://localhost:9876/sse',
    description: 'Direct Blender Python API bridge for 3D modeling, lighting, and viewport controls.',
    icon: '🎨',
  },
  {
    name: 'Figma Design Engine',
    transport: 'sse',
    url: 'http://localhost:3050/sse',
    description: 'Inspect live Figma canvas, extract layout tokens, and generate responsive UI components.',
    icon: '📐',
  },
  {
    name: 'Local Dev Filesystem',
    transport: 'stdio',
    command: 'npx -y @modelcontextprotocol/server-filesystem ./workspace',
    url: 'http://localhost:8000/sse',
    description: 'Sandboxed local machine directory reader and code patcher.',
    icon: '💻',
  },
  {
    name: 'PostgreSQL Database',
    transport: 'sse',
    url: 'http://localhost:5432/sse',
    description: 'Inspect schema tables, generate queries, and run safe read-only analytics.',
    icon: '🗄️',
  }
];

const initialForm = {
  name: '',
  transport: 'sse',
  url: '',
  command: '',
  description: ''
};

export default function McpServersPanel() {
  const [servers, setServers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    getMcpServers()
      .then(res => setServers(res.servers || []))
      .catch(() => setError('Could not load MCP servers.'))
      .finally(() => setLoading(false));
  }, []);

  const handleApplyPreset = (preset) => {
    setForm({
      name: preset.name,
      transport: preset.transport,
      url: preset.url || '',
      command: preset.command || '',
      description: preset.description
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await createMcpServer(form);
      setServers(res.servers || []);
      setForm(initialForm);
      setSuccessMsg(`Successfully connected ${form.name}`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not connect MCP server.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await deleteMcpServer(id);
      setServers(res.servers || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not remove MCP server.');
    }
  };

  const handleTest = async (id) => {
    setTestingId(id);
    try {
      const res = await testMcpServer(id);
      setSuccessMsg(res.message || 'Connection verified');
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch {
      setError('Server ping failed. Ensure the local endpoint is running.');
    } finally {
      setTestingId(null);
    }
  };

  return (
    <section className="mx-auto max-w-5xl space-y-6 sm:space-y-8 py-3 sm:py-6">
      <header className="max-w-2xl">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3.5 py-1 text-[11px] font-semibold text-cyan-700 dark:text-cyan-300">
          <RiCpuLine size={14} /> Model Context Protocol
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white sm:text-3xl">MCP Servers</h1>
        <p className="mt-2 text-xs sm:text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Connect external applications, local workstations, and developer environments. Parsu AI dynamically queries tools, scenes, and schemas from connected MCP endpoints.
        </p>
      </header>

      {/* 1-Click Quick Presets */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">Popular Local App Presets</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => handleApplyPreset(p)}
              className="text-left p-3.5 rounded-[20px] border border-zinc-200/80 dark:border-white/[0.08] bg-white dark:bg-zinc-900/40 hover:border-cyan-500/50 dark:hover:border-cyan-400/40 transition-all shadow-xs group cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-base">{p.icon}</span>
                <span className="text-xs font-bold text-zinc-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors truncate">
                  {p.name}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                {p.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,.85fr)]">
        {/* Form Container */}
        <form onSubmit={handleCreate} className="rounded-[24px] sm:rounded-[28px] border border-zinc-200/80 bg-white p-5 sm:p-7 shadow-sm dark:border-white/[0.08] dark:bg-zinc-900/40">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)]">
              <RiAddLine size={14} />
            </span>
            Add MCP Server
          </h2>

          <div className="space-y-3.5">
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Server Name
              <input
                required
                maxLength={80}
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Blender 3D Local"
                className="mt-1.5 w-full rounded-[14px] border border-zinc-200/90 bg-zinc-50 px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 outline-none transition focus:border-cyan-500 dark:border-white/10 dark:bg-zinc-950/60 dark:text-white"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Transport
                <select
                  value={form.transport}
                  onChange={e => setForm({ ...form, transport: e.target.value })}
                  className="mt-1.5 w-full rounded-[14px] border border-zinc-200/90 bg-zinc-50 px-3 py-2.5 text-xs sm:text-sm text-zinc-900 outline-none transition focus:border-cyan-500 dark:border-white/10 dark:bg-zinc-950/60 dark:text-white cursor-pointer"
                >
                  <option value="sse">SSE (HTTP Server-Sent Events)</option>
                  <option value="http">HTTP Streaming</option>
                  <option value="stdio">Local Stdio Command</option>
                </select>
              </label>

              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Endpoint URL
                <input
                  value={form.url}
                  onChange={e => setForm({ ...form, url: e.target.value })}
                  placeholder="http://localhost:9876/sse"
                  className="mt-1.5 w-full rounded-[14px] border border-zinc-200/90 bg-zinc-50 px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 outline-none transition focus:border-cyan-500 dark:border-white/10 dark:bg-zinc-950/60 dark:text-white"
                />
              </label>
            </div>

            {form.transport === 'stdio' && (
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Launch Command (Local execution)
                <input
                  value={form.command}
                  onChange={e => setForm({ ...form, command: e.target.value })}
                  placeholder="npx -y @modelcontextprotocol/server-postgres"
                  className="mt-1.5 w-full rounded-[14px] border border-zinc-200/90 bg-zinc-50 px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 outline-none transition focus:border-cyan-500 dark:border-white/10 dark:bg-zinc-950/60 dark:text-white"
                />
              </label>
            )}

            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Description & Tool Scope <span className="font-normal text-zinc-400">(optional)</span>
              <textarea
                rows={2}
                maxLength={300}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Exposes 3D scene creation and mesh inspection functions."
                className="mt-1.5 w-full resize-none rounded-[14px] border border-zinc-200/90 bg-zinc-50 px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed text-zinc-900 outline-none transition focus:border-cyan-500 dark:border-white/10 dark:bg-zinc-950/60 dark:text-white"
              />
            </label>
          </div>

          {error && <p role="alert" className="mt-3 text-xs text-rose-500">{error}</p>}
          {successMsg && <p role="status" className="mt-3 text-xs text-emerald-500 font-medium">{successMsg}</p>}

          <div className="mt-5 flex items-center justify-between">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[var(--accent-cyan)] px-5 py-2 text-xs sm:text-sm font-semibold text-zinc-950 transition hover:brightness-105 disabled:opacity-60 shadow-sm cursor-pointer"
            >
              {saving ? <RiLoader4Line size={16} className="animate-spin" /> : <RiAddLine size={16} />} Connect MCP Server
            </button>
            <span className="text-[11px] text-zinc-400">JSON-RPC 2.0 Spec compliant</span>
          </div>
        </form>

        {/* Connected Servers List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Configured Endpoints</h2>
            <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[10px] font-semibold text-zinc-600 dark:bg-white/[0.08] dark:text-zinc-300">
              {servers.length} / 25
            </span>
          </div>

          {loading ? (
            <div className="h-32 animate-pulse rounded-[24px] bg-zinc-200/70 dark:bg-zinc-800/60" />
          ) : servers.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-zinc-300/80 px-5 py-10 text-center dark:border-white/10 bg-white/40 dark:bg-zinc-900/20">
              <RiServerLine size={24} className="mx-auto mb-2 text-zinc-400" />
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">No MCP servers added</p>
              <p className="mt-1 text-xs text-zinc-500">Pick a preset above or enter a local SSE URL to connect Blender, Figma, or your custom tools.</p>
            </div>
          ) : (
            servers.map(server => (
              <article key={server._id} className="rounded-[20px] sm:rounded-[24px] border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-sm dark:border-white/[0.08] dark:bg-zinc-900/40 transition hover:border-zinc-300 dark:hover:border-white/15">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      <h3 className="truncate text-sm font-semibold text-zinc-900 dark:text-white">{server.name}</h3>
                      <span className="uppercase text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-400">
                        {server.transport}
                      </span>
                    </div>
                    {server.url && (
                      <p className="mt-1 font-mono text-[11px] text-zinc-400 truncate flex items-center gap-1">
                        <RiLinkM size={12} className="shrink-0" /> {server.url}
                      </p>
                    )}
                    {server.description && (
                      <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 line-clamp-2">
                        {server.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleTest(server._id)}
                      disabled={testingId === server._id}
                      title="Ping & Sync Tools"
                      className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition hover:bg-cyan-500/10 hover:text-cyan-500 cursor-pointer disabled:opacity-50"
                    >
                      <RiRefreshLine size={15} className={testingId === server._id ? 'animate-spin' : ''} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(server._id)}
                      title="Remove server"
                      className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition hover:bg-rose-500/10 hover:text-rose-500 cursor-pointer"
                    >
                      <RiDeleteBinLine size={15} />
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
