import React, { useEffect, useState } from 'react';
import { RiAddLine, RiBookOpenLine, RiDeleteBinLine, RiLoader4Line, RiSparklingLine } from '@remixicon/react';
import { createUserSkill, deleteUserSkill, getUserSkills } from '../service/settings.api';

const initialForm = { name: '', description: '', triggers: '', instructions: '' };

export default function CustomSkillsPanel() {
  const [skills, setSkills] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getUserSkills().then(data => setSkills(data.skills || []))
      .catch(() => setError('Could not load skills. Please retry.'))
      .finally(() => setLoading(false));
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const result = await createUserSkill({
        ...form,
        triggers: form.triggers.split(',').map(value => value.trim()).filter(Boolean),
      });
      setSkills(result.skills || []);
      setForm(initialForm);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save this skill.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    try {
      const result = await deleteUserSkill(id);
      setSkills(result.skills || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not remove this skill.');
    }
  };

  return (
    <section className="mx-auto max-w-5xl space-y-7 py-4 sm:py-8">
      <header className="max-w-2xl">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold text-cyan-700 dark:text-cyan-300">
          <RiSparklingLine size={14} /> Personal workflows
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white sm:text-3xl">Your skills</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">Save reusable instructions for the tasks you do often. Add trigger phrases and Parsu will apply a skill when your message matches.</p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,.85fr)]">
        <form onSubmit={submit} className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-zinc-900/50 sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100"><RiAddLine className="text-[var(--accent-cyan)]" /> Create a skill</h2>
          <label className="mb-3 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Name
            <input required maxLength={80} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Weekend trip planner" className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-cyan-500 dark:border-white/10 dark:bg-zinc-950/60 dark:text-white" />
          </label>
          <label className="mb-3 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Short description
            <input maxLength={240} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Builds relaxed, photo-friendly itineraries" className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-cyan-500 dark:border-white/10 dark:bg-zinc-950/60 dark:text-white" />
          </label>
          <label className="mb-3 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Trigger phrases <span className="font-normal text-zinc-400">(comma separated)</span>
            <input value={form.triggers} onChange={e => setForm({ ...form, triggers: e.target.value })} placeholder="plan my weekend, find a getaway" className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-cyan-500 dark:border-white/10 dark:bg-zinc-950/60 dark:text-white" />
          </label>
          <label className="mb-4 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Instructions
            <textarea required minLength={10} maxLength={3000} rows={6} value={form.instructions} onChange={e => setForm({ ...form, instructions: e.target.value })} placeholder="Describe how Parsu should handle this task. You can paste a prompt or code conventions here." className="mt-1.5 w-full resize-y rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm leading-relaxed text-zinc-900 outline-none transition focus:border-cyan-500 dark:border-white/10 dark:bg-zinc-950/60 dark:text-white" />
          </label>
          {error && <p role="alert" className="mb-3 text-xs text-rose-500">{error}</p>}
          <button disabled={saving} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[var(--accent-cyan)] px-4 text-sm font-semibold text-zinc-950 transition hover:brightness-105 disabled:opacity-60">
            {saving ? <RiLoader4Line size={16} className="animate-spin" /> : <RiAddLine size={16} />} Save skill
          </button>
          <p className="mt-3 text-[11px] leading-relaxed text-zinc-400">Skills are applied only when a trigger phrase matches your message. Use the Memory settings page to edit your always-on instructions.</p>
        </form>

        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Saved skills</h2>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-500 dark:bg-white/[0.06]">{skills.length} / 20</span>
          </div>
          {loading ? <div className="h-32 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" /> : skills.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 px-5 py-10 text-center dark:border-white/10">
              <RiBookOpenLine size={24} className="mx-auto mb-2 text-zinc-400" />
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">No skills saved yet</p>
              <p className="mt-1 text-xs text-zinc-500">Create one from a useful prompt or set of project conventions.</p>
            </div>
          ) : skills.map(skill => (
            <article key={skill._id} className="rounded-2xl border border-zinc-200/70 bg-white p-4 dark:border-white/[0.06] dark:bg-zinc-900/50">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-zinc-900 dark:text-white">{skill.name}</h3>
                  {skill.description && <p className="mt-1 text-xs leading-relaxed text-zinc-500">{skill.description}</p>}
                </div>
                <button type="button" onClick={() => remove(skill._id)} aria-label={`Delete ${skill.name}`} className="rounded-lg p-2 text-zinc-400 transition hover:bg-rose-500/10 hover:text-rose-500"><RiDeleteBinLine size={16} /></button>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">{(skill.triggers || []).map(trigger => <span key={trigger} className="rounded-full border border-zinc-200 px-2 py-0.5 text-[10px] text-zinc-500 dark:border-white/10 dark:text-zinc-400">{trigger}</span>)}</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
