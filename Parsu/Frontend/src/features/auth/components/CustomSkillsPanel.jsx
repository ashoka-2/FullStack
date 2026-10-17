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
  RiCloseLine,
  RiPencilLine,
  RiFolderLine,
  RiFolderOpenLine,
  RiFileLine,
  RiCodeSSlashLine,
  RiLayoutRightLine
} from '@remixicon/react';
import JSZip from 'jszip';
import { createUserSkill, updateUserSkill, deleteUserSkill, getUserSkills } from '../service/settings.api';
import SkillFileEditorDrawer from './SkillFileEditorDrawer';

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
  const [editingSkillId, setEditingSkillId] = useState(null);
  const [selectedFileIndex, setSelectedFileIndex] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const zipInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const appendFilesRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    getUserSkills()
      .then(data => setSkills(data.skills || []))
      .catch(() => setError('Could not load skills. Please retry.'))
      .finally(() => setLoading(false));
  }, []);

  const startEditSkill = (skill, fileIndex = null) => {
    setEditingSkillId(skill._id);
    let initialFiles = skill.files && skill.files.length > 0 ? [...skill.files] : [];
    // If the skill has instructions but no files list, provide SKILL.md so it can be edited as a file too
    if (initialFiles.length === 0 && skill.instructions) {
      initialFiles = [{
        name: 'SKILL.md',
        path: 'SKILL.md',
        content: skill.instructions,
        size: skill.instructions.length
      }];
    }
    setForm({
      name: skill.name || '',
      description: skill.description || '',
      triggers: Array.isArray(skill.triggers) ? skill.triggers.join(', ') : '',
      instructions: skill.instructions || '',
      files: initialFiles
    });
    const targetIdx = fileIndex !== null ? fileIndex : (initialFiles.length > 0 ? 0 : null);
    setSelectedFileIndex(targetIdx);
    if (fileIndex !== null || initialFiles.length > 0) {
      setIsDrawerOpen(true);
    }
    setError('');
    setSuccessMsg(`Editing skill "${skill.name}". File opened in the right-side panel for editing.`);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const cancelEdit = () => {
    setEditingSkillId(null);
    setForm(initialForm);
    setSelectedFileIndex(null);
    setIsDrawerOpen(false);
    setError('');
    setSuccessMsg('');
  };

  const openFileInDrawer = (idx) => {
    setSelectedFileIndex(idx);
    setIsDrawerOpen(true);
  };

  const updateActiveFileObject = (updatedFile) => {
    if (selectedFileIndex === null) return;
    setForm(prev => {
      const files = [...(prev.files || [])];
      files[selectedFileIndex] = updatedFile;
      let nextInstructions = prev.instructions;
      if (/skill\.md$/i.test(updatedFile.name || updatedFile.path)) {
        nextInstructions = updatedFile.content;
      }
      return { ...prev, files, instructions: nextInstructions };
    });
  };

  const updateActiveFile = (field, value) => {
    if (selectedFileIndex === null || !form.files[selectedFileIndex]) return;
    setForm(prev => {
      const files = [...(prev.files || [])];
      const cur = { ...files[selectedFileIndex], [field]: value };
      if (field === 'content') {
        cur.size = value.length;
        if (/skill\.md$/i.test(cur.name || cur.path)) {
          return { ...prev, files: files.map((f, i) => i === selectedFileIndex ? cur : f), instructions: value };
        }
      } else if (field === 'path') {
        const parts = value.split('/');
        cur.name = parts[parts.length - 1] || value;
      }
      files[selectedFileIndex] = cur;
      return { ...prev, files };
    });
  };

  const addNewFile = () => {
    const defaultName = `rule_${(form.files || []).length + 1}.md`;
    const newFile = {
      name: defaultName,
      path: defaultName,
      content: `# ${defaultName}\n\nAdd your instructions, conventions or code here.\n`,
      size: 55
    };
    const nextFiles = [...(form.files || []), newFile];
    setForm(prev => ({ ...prev, files: nextFiles }));
    setSelectedFileIndex(nextFiles.length - 1);
    setIsDrawerOpen(true);
  };

  const deleteFile = (index) => {
    const nextFiles = (form.files || []).filter((_, i) => i !== index);
    setForm(prev => ({ ...prev, files: nextFiles }));
    if (selectedFileIndex === index) {
      setSelectedFileIndex(nextFiles.length > 0 ? Math.max(0, index - 1) : null);
      if (nextFiles.length === 0) setIsDrawerOpen(false);
    } else if (selectedFileIndex > index) {
      setSelectedFileIndex(selectedFileIndex - 1);
    }
  };

  const handleAppendFiles = async (event) => {
    const uploadedFiles = Array.from(event.target.files || []);
    if (!uploadedFiles.length) return;

    const newFiles = [];
    for (const file of uploadedFiles) {
      const text = await file.text();
      newFiles.push({
        name: file.name,
        path: file.webkitRelativePath || file.name,
        content: text,
        size: text.length
      });
    }

    const currentLen = (form.files || []).length;
    setForm(prev => ({
      ...prev,
      files: [...(prev.files || []), ...newFiles]
    }));

    if (newFiles.length > 0) {
      setSelectedFileIndex(currentLen);
      setIsDrawerOpen(true);
    }

    setSuccessMsg(`Appended ${newFiles.length} file(s). Opened in right side editor.`);
    if (event.target) event.target.value = '';
  };

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
      const payload = {
        name: form.name,
        description: form.description,
        triggers: form.triggers.split(',').map(value => value.trim()).filter(Boolean),
        instructions: form.instructions,
        files: form.files || []
      };

      let result;
      if (editingSkillId) {
        result = await updateUserSkill(editingSkillId, payload);
        setSuccessMsg(`Skill "${form.name}" successfully updated!`);
        setEditingSkillId(null);
      } else {
        result = await createUserSkill(payload);
        setSuccessMsg('Skill successfully saved to your cloud database!');
      }

      setSkills(result.skills || []);
      setForm(initialForm);
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
        <form ref={formRef} onSubmit={submit} className={`rounded-[24px] sm:rounded-[28px] border bg-white p-5 sm:p-7 shadow-sm dark:bg-zinc-900/40 transition ${editingSkillId ? 'border-cyan-500/50 ring-1 ring-cyan-500/20' : 'border-zinc-200/80 dark:border-white/[0.08]'}`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)]">
                {editingSkillId ? <RiPencilLine size={14} /> : <RiAddLine size={14} />}
              </span>
              {editingSkillId ? `Edit Skill: ${form.name || 'Unnamed'}` : 'Save Custom Skill'}
            </h2>
            <div className="flex items-center gap-2">
              {editingSkillId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-white/[0.06] transition cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
              {form.files?.length > 0 && (
                <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border border-cyan-500/20">
                  {form.files.length} bundled files
                </span>
              )}
            </div>
          </div>

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

          {/* Skill Files & Folders Explorer + Editor */}
          <div className="mb-5 rounded-[20px] border border-zinc-200/90 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-white/[0.02] p-3.5 sm:p-4">
            <input
              type="file"
              ref={appendFilesRef}
              multiple
              className="hidden"
              onChange={handleAppendFiles}
            />

            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
                  <RiFolderOpenLine size={13} />
                </span>
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Skill Files & Folders
                </span>
                <span className="rounded-full bg-zinc-200/70 dark:bg-white/[0.08] px-2 py-0.2 text-[10px] font-semibold text-zinc-600 dark:text-zinc-300">
                  {form.files?.length || 0}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={addNewFile}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium text-cyan-700 dark:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 transition cursor-pointer"
                >
                  <RiAddLine size={13} /> Add File
                </button>
                <button
                  type="button"
                  onClick={() => appendFilesRef.current?.click()}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-white/[0.06] hover:bg-zinc-200 dark:hover:bg-white/[0.1] border border-zinc-200/80 dark:border-white/10 transition cursor-pointer"
                >
                  <RiUploadCloud2Line size={13} /> Import From Device
                </button>
                {form.files?.length > 0 && (
                  <button
                    type="button"
                    onClick={() => { setForm({ ...form, files: [] }); setSelectedFileIndex(null); }}
                    className="px-2 py-1 text-[10px] text-zinc-400 hover:text-rose-500 transition cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {/* File List / Navigation Pills */}
            {(!form.files || form.files.length === 0) ? (
              <div className="py-4 text-center border border-dashed border-zinc-200 dark:border-white/[0.08] rounded-[16px] bg-white/40 dark:bg-zinc-900/30">
                <RiFolderLine size={20} className="mx-auto mb-1 text-zinc-400" />
                <p className="text-xs text-zinc-500 dark:text-zinc-400">No individual files attached yet.</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">Click <strong>Add File</strong> or <strong>Import From Device</strong> to attach source code, rules, or references.</p>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Click any file to open the right-side editor & preview panel:</span>
                  <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-medium flex items-center gap-1">
                    <RiLayoutRightLine size={12} /> Side Panel Ready
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
                  {form.files.map((file, idx) => {
                    const isSelected = selectedFileIndex === idx && isDrawerOpen;
                    const isFolderChild = file.path && file.path.includes('/');
                    const ext = (file.name || file.path || '').split('.').pop()?.toUpperCase() || 'FILE';
                    return (
                      <div
                        key={idx}
                        onClick={() => openFileInDrawer(idx)}
                        className={`group flex items-center justify-between gap-2 p-2.5 rounded-[16px] transition cursor-pointer border ${
                          isSelected
                            ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-900 dark:text-cyan-100 shadow-sm'
                            : 'bg-white dark:bg-zinc-900/80 border-zinc-200/80 dark:border-white/10 text-zinc-800 dark:text-zinc-200 hover:border-cyan-500/40 hover:bg-zinc-50 dark:hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                            {isFolderChild ? <RiFolderLine size={14} /> : <RiFileCodeLine size={14} />}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium font-mono" title={file.path || file.name}>
                              {file.path || file.name}
                            </p>
                            <p className="text-[10px] text-zinc-400">
                              {ext} · {Math.round((file.size || (file.content?.length || 0)) / 1024)} KB
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <span className="hidden group-hover:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-medium">
                            <RiLayoutRightLine size={11} /> Edit
                          </span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); deleteFile(idx); }}
                            className="p-1 text-zinc-400 hover:text-rose-500 transition cursor-pointer"
                            title="Delete file"
                          >
                            <RiCloseLine size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {error && <p role="alert" className="mb-3 text-xs text-rose-500">{error}</p>}
          {successMsg && <p role="status" className="mb-3 text-xs text-emerald-500 font-medium">{successMsg}</p>}

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={saving || importing}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[var(--accent-cyan)] px-5 py-2.5 text-xs sm:text-sm font-semibold text-zinc-950 transition hover:brightness-105 disabled:opacity-60 shadow-sm cursor-pointer"
            >
              {saving ? <RiLoader4Line size={16} className="animate-spin" /> : editingSkillId ? <RiCheckLine size={16} /> : <RiAddLine size={16} />}
              {editingSkillId ? 'Update Skill' : 'Save Skill to Cloud'}
            </button>
            {editingSkillId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2.5 rounded-full border border-zinc-200 dark:border-white/10 text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.05] transition cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
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
              <article
                key={skill._id}
                className={`rounded-[20px] sm:rounded-[24px] border bg-white p-4 sm:p-5 shadow-sm dark:bg-zinc-900/40 transition hover:border-zinc-300 dark:hover:border-white/15 ${
                  editingSkillId === skill._id
                    ? 'border-cyan-500/60 ring-1 ring-cyan-500/20 dark:border-cyan-400/50'
                    : 'border-zinc-200/80 dark:border-white/[0.08]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-semibold text-zinc-900 dark:text-white">{skill.name}</h3>
                      {skill.files?.length > 0 && (
                        <button
                          type="button"
                          onClick={() => startEditSkill(skill, 0)}
                          title="Open files in right-side editor"
                          className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 transition cursor-pointer flex items-center gap-1"
                        >
                          <RiLayoutRightLine size={11} /> {skill.files.length} files
                        </button>
                      )}
                    </div>
                    {skill.description && (
                      <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 line-clamp-2">
                        {skill.description}
                      </p>
                    )}
                    {skill.files?.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {skill.files.slice(0, 4).map((f, fIdx) => (
                          <button
                            key={fIdx}
                            type="button"
                            onClick={() => startEditSkill(skill, fIdx)}
                            title={`Open ${f.path || f.name} in right-side editor`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-100 hover:bg-cyan-500/10 text-zinc-600 dark:bg-white/[0.04] dark:text-zinc-400 hover:text-cyan-600 dark:hover:text-cyan-300 border border-zinc-200/60 dark:border-white/10 transition cursor-pointer"
                          >
                            <RiFileCodeLine size={10} className="text-cyan-500" />
                            <span className="truncate max-w-[100px]">{f.path || f.name}</span>
                          </button>
                        ))}
                        {skill.files.length > 4 && (
                          <button
                            type="button"
                            onClick={() => startEditSkill(skill, 0)}
                            className="text-[10px] text-cyan-600 dark:text-cyan-400 self-center px-1 hover:underline cursor-pointer"
                          >
                            +{skill.files.length - 4} more
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEditSkill(skill)}
                      aria-label={`Edit ${skill.name}`}
                      title="Edit skill and open files"
                      className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition hover:bg-cyan-500/10 hover:text-cyan-500 cursor-pointer"
                    >
                      <RiPencilLine size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(skill._id)}
                      aria-label={`Delete ${skill.name}`}
                      title="Delete skill"
                      className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition hover:bg-rose-500/10 hover:text-rose-500 cursor-pointer"
                    >
                      <RiDeleteBinLine size={15} />
                    </button>
                  </div>
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

      {/* Right-Side Slide-Over File Editor & Preview Drawer */}
      <SkillFileEditorDrawer
        isOpen={isDrawerOpen && selectedFileIndex !== null && Boolean(form.files?.[selectedFileIndex])}
        file={form.files?.[selectedFileIndex]}
        onClose={() => setIsDrawerOpen(false)}
        onChange={updateActiveFileObject}
        onDelete={() => deleteFile(selectedFileIndex)}
      />
    </section>
  );
}
