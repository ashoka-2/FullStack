import React, { useEffect, useState, useRef } from 'react';
import {
  RiAddLine,
  RiBookOpenLine,
  RiDeleteBinLine,
  RiLoader4Line,
  RiSparklingLine,
  RiUploadCloud2Line,
  RiFolderZipLine,
  RiFileCodeLine,
  RiCheckLine,
  RiCloseLine
} from '@remixicon/react';
import JSZip from 'jszip';
import { createUserSkill, deleteUserSkill, getUserSkills } from '../service/settings.api';

const initialForm = {
  name: '',
  description: '',
  triggers: '',
  instructions: '',
  files: []
};

// Built-in verified skills that can be imported with 1-click
const PRESET_SKILLS = [
  {
    name: 'minimal-ai-ui',
    description: 'Design and build calm, restrained, Apple-like minimal AI interfaces with continuous squircle corners.',
    triggers: 'minimal-ai-ui, minimal ui, apple squircle, clean ai design',
    instructions: `Apply Minimal-AI-UI design guidelines:
- Restraint over decoration. One memorable element per screen.
- Continuous squircles using @supports (corner-shape: squircle) or rounded-[24px]/rounded-[28px].
- Single accent color (--accent-cyan or curated accent). High-contrast dark & light modes.
- Typography: Inter/Geist variable with size-specific tracking (tighter on headings, looser on captions).
- Buttons: rounded-full pills with minimum 44px touch targets on mobile.
- No gratuitous gradients, no generic card lifting, no dark blur clutter.`
  },
  {
    name: 'react-fullstack-pro',
    description: 'Expert conventions for React 19, Redux Toolkit, Tailwind CSS v4, and Node.js REST APIs.',
    triggers: 'react, redux, node api, fullstack conventions',
    instructions: `Follow production-ready full-stack guidelines:
- Keep state immutable and synchronous where needed.
- Gracefully handle slow networks and offline states with optimistic local caching.
- Write modular, testable components with semantic HTML.
- In Node/Express: validate inputs, verify user permissions (IDOR prevention), and handle async errors cleanly.`
  }
];

export default function CustomSkillsPanel() {
  const [skills, setSkills] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const zipInputRef = useRef(null);
  const folderInputRef = useRef(null);

  useEffect(() => {
    getUserSkills()
      .then(data => setSkills(data.skills || []))
      .catch(() => setError('Could not load skills. Please retry.'))
      .finally(() => setLoading(false));
  }, []);

  // Helper: parse YAML frontmatter from markdown
  const parseSkillMarkdown = (content, defaultName = 'Custom Skill') => {
    let name = defaultName;
    let description = '';
    let triggers = '';
    let instructions = content;

    const frontmatterMatch = content.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---\s*[\r\n]+([\s\S]*)$/);
    if (frontmatterMatch) {
      const yaml = frontmatterMatch[1];
      instructions = frontmatterMatch[2].trim();

      const nameMatch = yaml.match(/^name:\s*(.+)$/m);
      if (nameMatch) name = nameMatch[1].trim().replace(/^['"]|['"]$/g, '');

      const descMatch = yaml.match(/^description:\s*(.+)$/m);
      if (descMatch) description = descMatch[1].trim().replace(/^['"]|['"]$/g, '');

      const trigMatch = yaml.match(/^triggers:\s*(.+)$/m);
      if (trigMatch) triggers = trigMatch[1].trim().replace(/^['"]|['"]$/g, '');
    } else {
      // Fallback: Check for first # Heading
      const titleMatch = content.match(/^#+\s*(.+)$/m);
      if (titleMatch) {
        name = titleMatch[1].trim();
      }
    }

    return { name, description, triggers: triggers || name.toLowerCase(), instructions };
  };

  // Handle local ZIP archive upload
  const handleZipUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setError('');
    setSuccessMsg('');

    try {
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(file);

      let mainSkillMd = '';
      let skillName = file.name.replace(/\.zip$/i, '');
      const filesList = [];

      const entries = Object.keys(zipContent.files);
      for (const relativePath of entries) {
        const entry = zipContent.files[relativePath];
        if (entry.dir) continue;

        // Skip binary / hidden files
        if (relativePath.includes('__MACOSX') || relativePath.startsWith('.') || relativePath.includes('/.')) continue;

        const textContent = await entry.async('text');
        const filename = relativePath.split('/').pop();

        if (/skill\.md$/i.test(filename) || (/readme\.md$/i.test(filename) && !mainSkillMd)) {
          mainSkillMd = textContent;
        }

        filesList.push({
          name: filename,
          path: relativePath,
          content: textContent,
          size: textContent.length
        });
      }

      const parsed = mainSkillMd
        ? parseSkillMarkdown(mainSkillMd, skillName)
        : { name: skillName, description: `Imported from ${file.name}`, triggers: skillName.toLowerCase(), instructions: `Files loaded from ${file.name}` };

      setForm({
        name: parsed.name,
        description: parsed.description,
        triggers: parsed.triggers,
        instructions: parsed.instructions,
        files: filesList
      });

      setSuccessMsg(`Extracted ${filesList.length} files from ${file.name}! Review and save below.`);
    } catch (err) {
      setError(`Failed to read ZIP: ${err.message}`);
    } finally {
      setImporting(false);
      if (event.target) event.target.value = '';
    }
  };

  // Handle local Markdown (.md) or Folder upload
  const handleFilesUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setImporting(true);
    setError('');
    setSuccessMsg('');

    try {
      let mainSkillMd = '';
      let skillName = files[0].name.replace(/\.md$/i, '');
      const filesList = [];

      for (const f of files) {
        const text = await f.text();
        const relativePath = f.webkitRelativePath || f.name;

        if (/skill\.md$/i.test(f.name) || (/\.md$/i.test(f.name) && !mainSkillMd)) {
          mainSkillMd = text;
          skillName = f.name.replace(/\.md$/i, '');
        }

        filesList.push({
          name: f.name,
          path: relativePath,
          content: text,
          size: f.size || text.length
        });
      }

      const parsed = mainSkillMd
        ? parseSkillMarkdown(mainSkillMd, skillName)
        : { name: skillName, description: 'Imported from local files', triggers: skillName.toLowerCase(), instructions: filesList[0]?.content || '' };

      setForm({
        name: parsed.name,
        description: parsed.description,
        triggers: parsed.triggers,
        instructions: parsed.instructions,
        files: filesList.length > 1 ? filesList : []
      });

      setSuccessMsg(`Imported ${files.length} file(s)! Review and click Save Skill.`);
    } catch (err) {
      setError(`Error reading files: ${err.message}`);
    } finally {
      setImporting(false);
      if (event.target) event.target.value = '';
    }
  };

  const applyPreset = (preset) => {
    setForm({
      name: preset.name,
      description: preset.description,
      triggers: preset.triggers,
      instructions: preset.instructions,
      files: []
    });
    setSuccessMsg(`Loaded preset "${preset.name}". Click Save Skill to store in your database.`);
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      const result = await createUserSkill({
        name: form.name,
        description: form.description,
        triggers: form.triggers.split(',').map(value => value.trim()).filter(Boolean),
        instructions: form.instructions,
        files: form.files || []
      });
      setSkills(result.skills || []);
      setForm(initialForm);
      setSuccessMsg('Skill successfully saved to your cloud database!');
      setTimeout(() => setSuccessMsg(''), 4000);
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
    <section className="mx-auto max-w-5xl space-y-6 sm:space-y-8 py-3 sm:py-6">
      <header className="max-w-2xl">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3.5 py-1 text-[11px] font-semibold text-cyan-700 dark:text-cyan-300">
          <RiSparklingLine size={14} /> Personal & Coding Workflows
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white sm:text-3xl">Your Skills</h1>
        <p className="mt-2 text-xs sm:text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Save reusable instructions and code conventions. Load custom skills directly from your device (ZIP archive, SKILL.md, or multi-file folders). When requested in chat, Parsu AI reads the skill, understands its rules, and executes accordingly.
        </p>
      </header>

      {/* Device Import & Quick Preset Bar */}
      <div className="rounded-[24px] sm:rounded-[28px] border border-zinc-200/80 bg-white p-4 sm:p-6 shadow-sm dark:border-white/[0.08] dark:bg-zinc-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Load from Local Machine</h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">Upload a ZIP package, a single SKILL.md file, or an entire skill directory.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Hidden native inputs */}
            <input
              type="file"
              ref={zipInputRef}
              accept=".zip"
              className="hidden"
              onChange={handleZipUpload}
            />
            <input
              type="file"
              ref={folderInputRef}
              accept=".md,.txt,.js,.py,.json"
              multiple
              className="hidden"
              onChange={handleFilesUpload}
            />

            <button
              type="button"
              disabled={importing}
              onClick={() => zipInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-zinc-200/90 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.05] hover:bg-zinc-100 dark:hover:bg-white/[0.1] text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition cursor-pointer"
            >
              <RiFolderZipLine size={15} className="text-amber-500" />
              <span>Import .ZIP</span>
            </button>

            <button
              type="button"
              disabled={importing}
              onClick={() => folderInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-zinc-200/90 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.05] hover:bg-zinc-100 dark:hover:bg-white/[0.1] text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition cursor-pointer"
            >
              <RiUploadCloud2Line size={15} className="text-cyan-500" />
              <span>Import .MD / Files</span>
            </button>
          </div>
        </div>

        {/* 1-Click Presets */}
        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-white/[0.06] flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium text-zinc-400 mr-1">Quick Presets:</span>
          {PRESET_SKILLS.map(preset => (
            <button
              key={preset.name}
              type="button"
              onClick={() => applyPreset(preset)}
              className="px-3 py-1 rounded-full border border-cyan-500/25 bg-cyan-500/10 hover:bg-cyan-500/20 text-[11px] font-semibold text-cyan-700 dark:text-cyan-300 transition cursor-pointer"
            >
              + {preset.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,.85fr)]">
        {/* Skill Creator / Editor Form */}
        <form onSubmit={submit} className="rounded-[24px] sm:rounded-[28px] border border-zinc-200/80 bg-white p-5 sm:p-7 shadow-sm dark:border-white/[0.08] dark:bg-zinc-900/40">
          <h2 className="mb-4 flex items-center justify-between text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            <span className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)]">
                <RiAddLine size={14} />
              </span>
              Save Custom Skill
            </span>
            {form.files?.length > 0 && (
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border border-cyan-500/20">
                {form.files.length} bundled files
              </span>
            )}
          </h2>

          <label className="mb-3.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Skill Name
            <input
              required
              maxLength={120}
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. minimal-ai-ui or coding-task-expert"
              className="mt-1.5 w-full rounded-[14px] border border-zinc-200/90 bg-zinc-50 px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 outline-none transition focus:border-cyan-500 dark:border-white/10 dark:bg-zinc-950/60 dark:text-white"
            />
          </label>

          <label className="mb-3.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Short Description
            <input
              maxLength={500}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="What this skill does (e.g. builds calm, squircle minimal AI interfaces)"
              className="mt-1.5 w-full rounded-[14px] border border-zinc-200/90 bg-zinc-50 px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 outline-none transition focus:border-cyan-500 dark:border-white/10 dark:bg-zinc-950/60 dark:text-white"
            />
          </label>

          <label className="mb-3.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Trigger Phrases <span className="font-normal text-zinc-400">(comma separated)</span>
            <input
              value={form.triggers}
              onChange={e => setForm({ ...form, triggers: e.target.value })}
              placeholder="minimal-ai-ui, squircle design, clean ui"
              className="mt-1.5 w-full rounded-[14px] border border-zinc-200/90 bg-zinc-50 px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 outline-none transition focus:border-cyan-500 dark:border-white/10 dark:bg-zinc-950/60 dark:text-white"
            />
          </label>

          <label className="mb-4 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Instructions & Conventions
            <textarea
              required
              minLength={5}
              maxLength={30000}
              rows={6}
              value={form.instructions}
              onChange={e => setForm({ ...form, instructions: e.target.value })}
              placeholder="Describe the conventions, design rules, or code structure. You can paste a SKILL.md body here."
              className="mt-1.5 w-full resize-y rounded-[14px] border border-zinc-200/90 bg-zinc-50 px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed text-zinc-900 outline-none transition focus:border-cyan-500 dark:border-white/10 dark:bg-zinc-950/60 dark:text-white font-mono text-[12px]"
            />
          </label>

          {/* Bundled Files Summary if any */}
          {form.files?.length > 0 && (
            <div className="mb-4 p-3 rounded-[16px] bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/[0.08]">
              <div className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center justify-between">
                <span>Bundled Reference Files ({form.files.length}):</span>
                <button type="button" onClick={() => setForm({ ...form, files: [] })} className="text-zinc-400 hover:text-rose-500 text-[10px]">Clear files</button>
              </div>
              <div className="max-h-24 overflow-y-auto space-y-1 custom-scrollbar">
                {form.files.map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                    <RiFileCodeLine size={12} className="shrink-0 text-cyan-500" />
                    <span className="truncate">{f.path || f.name}</span>
                    <span className="text-[10px] opacity-60 ml-auto">{Math.round(f.size / 1024)} KB</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <p role="alert" className="mb-3 text-xs text-rose-500">{error}</p>}
          {successMsg && <p role="status" className="mb-3 text-xs text-emerald-500 font-medium">{successMsg}</p>}

          <button
            type="submit"
            disabled={saving || importing}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[var(--accent-cyan)] px-5 py-2.5 text-xs sm:text-sm font-semibold text-zinc-950 transition hover:brightness-105 disabled:opacity-60 shadow-sm cursor-pointer"
          >
            {saving ? <RiLoader4Line size={16} className="animate-spin" /> : <RiAddLine size={16} />} Save Skill to Cloud
          </button>
          <p className="mt-3.5 text-[11px] leading-relaxed text-zinc-400">
            Skills are automatically saved to your MongoDB account. In chat, specify the skill name or match its triggers to apply it.
          </p>
        </form>

        {/* Saved Skills Column */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Saved Skills</h2>
            <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[10px] font-semibold text-zinc-600 dark:bg-white/[0.08] dark:text-zinc-300">
              {skills.length} / 50
            </span>
          </div>

          {loading ? (
            <div className="h-32 animate-pulse rounded-[24px] bg-zinc-200/70 dark:bg-zinc-800/60" />
          ) : skills.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-zinc-300/80 px-5 py-10 text-center dark:border-white/10 bg-white/40 dark:bg-zinc-900/20">
              <RiBookOpenLine size={24} className="mx-auto mb-2 text-zinc-400" />
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">No skills saved yet</p>
              <p className="mt-1 text-xs text-zinc-500">Pick a preset or import a ZIP / SKILL.md from your device above.</p>
            </div>
          ) : (
            skills.map(skill => (
              <article key={skill._id} className="rounded-[20px] sm:rounded-[24px] border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-sm dark:border-white/[0.08] dark:bg-zinc-900/40 transition hover:border-zinc-300 dark:hover:border-white/15">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-semibold text-zinc-900 dark:text-white">{skill.name}</h3>
                      {skill.files?.length > 0 && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                          {skill.files.length} files
                        </span>
                      )}
                    </div>
                    {skill.description && (
                      <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 line-clamp-2">
                        {skill.description}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(skill._id)}
                    aria-label={`Delete ${skill.name}`}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition hover:bg-rose-500/10 hover:text-rose-500 cursor-pointer"
                  >
                    <RiDeleteBinLine size={15} />
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(skill.triggers || []).map(trigger => (
                    <span key={trigger} className="rounded-full border border-zinc-200/80 bg-zinc-50 px-2.5 py-0.5 text-[10px] text-zinc-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-400">
                      {trigger}
                    </span>
                  ))}
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
