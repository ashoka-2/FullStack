import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  RiSparkling2Line,
  RiCpuLine,
  RiFlashlightLine,
  RiBrainLine,
  RiKey2Line,
  RiCheckLine,
  RiArrowDownSLine,
  RiSettings3Line,
  RiSearchLine,
  RiCloseLine
} from "@remixicon/react";
import { useNavigate } from "react-router";
import { getModels, setSelectedModel } from "../service/model.api";

// Monochromatic Apple/AI-design styling for model provider badges (no rainbow colors)
const NEUTRAL_THEME = {
  color: "text-zinc-300 dark:text-zinc-300 bg-zinc-100 dark:bg-white/[0.05] border-zinc-200 dark:border-white/[0.08]",
  selectedColor: "text-[var(--accent-cyan)] bg-cyan-500/10 border-cyan-500/30"
};

const getShortBrandName = (model) => {
  if (!model) return "AI";
  const p = (model.provider || "").toLowerCase();
  const n = (model.name || model.id || "").toLowerCase();
  if (p === 'gemini' || n.includes('gemini')) return 'Gemini';
  if (p === 'mistral' || n.includes('mistral') || n.includes('codestral')) return 'Mistral';
  if (p === 'groq' || n.includes('groq')) return 'Groq';
  if (p === 'deepseek' || n.includes('deepseek')) return 'DeepSeek';
  if (p === 'anthropic' || n.includes('claude')) return 'Claude';
  if (p === 'openai' || n.includes('gpt') || n.includes('o1') || n.includes('o3')) return 'OpenAI';
  if (p === 'nvidia' || n.includes('nvidia')) return 'NVIDIA';
  if (p === 'openrouter') return 'OpenRouter';
  if (model.provider) return model.provider.charAt(0).toUpperCase() + model.provider.slice(1);
  return (model.name || "AI").split(' ')[0];
};

export default function ModelSelectorDropdown({
  selectedModel,
  onModelChange,
  compact = false,
  placement = "top" // "top" = opens upward (for bottom bars), "bottom" = opens downward (for headers)
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState("all"); // 'all' | 'default' | 'custom' | 'reasoning' | 'fast'
  const [defaultModels, setDefaultModels] = useState([]);
  const [customModels, setCustomModels] = useState([]);
  const [loading, setLoading] = useState(false);

  const dropdownRef = useRef(null);
  const popoverRef = useRef(null);
  const navigate = useNavigate();
  const [popoverCoords, setPopoverCoords] = useState({ top: 0, left: 0, width: 384, openUpward: false });

  // Load models from API
  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const data = await getModels();
        if (mounted && data.success) {
          setDefaultModels(data.defaultModels || []);
          setCustomModels(data.customModels || []);
          
          // If no model currently selected, default to backend's preference or first default
          if (!selectedModel) {
            const initial = data.selectedModel || data.defaultModels?.[0];
            if (initial && onModelChange) {
              onModelChange(initial);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load models list:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => { mounted = false; };
  }, []);

  // Update fixed portal coordinates when dropdown opens or viewport changes
  useEffect(() => {
    if (!isOpen || !dropdownRef.current) return;

    function updateCoords() {
      if (!dropdownRef.current) return;
      const rect = dropdownRef.current.getBoundingClientRect();
      const popoverWidth = Math.min(384, window.innerWidth - 20);
      
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      let openUp = placement === "top";
      if (openUp && spaceAbove < 320 && spaceBelow > spaceAbove) {
        openUp = false;
      } else if (!openUp && spaceBelow < 320 && spaceAbove > spaceBelow) {
        openUp = true;
      }

      let left = rect.left;
      if (left + popoverWidth > window.innerWidth - 10) {
        left = window.innerWidth - popoverWidth - 10;
      }
      left = Math.max(10, left);

      let top = openUp ? rect.top - 8 : rect.bottom + 8;

      setPopoverCoords({
        top,
        left,
        width: popoverWidth,
        openUpward: openUp
      });
    }

    function handleWindowScroll(e) {
      // If scroll originated inside the popover itself, do not recompute coords to prevent scroll jitter
      if (popoverRef.current && (popoverRef.current === e.target || popoverRef.current.contains(e.target))) {
        return;
      }
      updateCoords();
    }

    updateCoords();
    window.addEventListener("resize", updateCoords);
    window.addEventListener("scroll", handleWindowScroll, true);
    return () => {
      window.removeEventListener("resize", updateCoords);
      window.removeEventListener("scroll", handleWindowScroll, true);
    };
  }, [isOpen, placement]);

  // Close on outside click (supporting portal element outside the component tree)
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        popoverRef.current &&
        !popoverRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Combine and filter models
  const allModels = [
    ...defaultModels.map(m => ({ ...m, isCustom: false })),
    ...customModels.map(m => ({ ...m, isCustom: true }))
  ];

  const filteredModels = allModels.filter(m => {
    // Search query match
    const q = search.toLowerCase();
    const matchesSearch =
      m.name.toLowerCase().includes(q) ||
      m.id.toLowerCase().includes(q) ||
      (m.provider && m.provider.toLowerCase().includes(q)) ||
      (m.description && m.description.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    // Filter tab
    if (filterTab === "default") return !m.isCustom;
    if (filterTab === "custom") return m.isCustom;
    if (filterTab === "reasoning") return m.category === "reasoning" || m.name.toLowerCase().includes("reason") || m.id.includes("r1") || m.id.includes("pro");
    if (filterTab === "fast") return m.category === "fast" || m.name.toLowerCase().includes("flash") || m.id.includes("mini") || m.provider === "groq";

    return true;
  });

  const currentId = selectedModel?.id || selectedModel?.modelId || defaultModels[0]?.id || "gemini-2.5-flash";
  const currentName = selectedModel?.name || selectedModel?.modelName || defaultModels[0]?.name || "Gemini 2.5 Flash";
  const currentProvider = selectedModel?.provider || defaultModels[0]?.provider || "gemini";

  const activeModel = {
    ...selectedModel,
    id: currentId,
    modelId: currentId,
    name: currentName,
    modelName: currentName,
    provider: currentProvider,
    badge: selectedModel?.badge || defaultModels[0]?.badge || "Fast",
    isCustom: selectedModel?.isCustom || false
  };

  const activeTheme = PROVIDER_THEMES[activeModel.provider] || PROVIDER_THEMES.gemini;

  const handleSelect = async (model) => {
    const normalizedModel = {
      ...model,
      id: model.id,
      modelId: model.id,
      name: model.name,
      modelName: model.name,
      provider: model.provider || "gemini"
    };
    if (onModelChange) {
      onModelChange(normalizedModel);
    }
    setIsOpen(false);

    // Save selection in backend
    try {
      await setSelectedModel({
        provider: model.provider || "gemini",
        modelId: model.id,
        modelName: model.name
      });
    } catch (err) {
      // Ignored if user not logged in
    }
  };

  // Placement-based positioning classes with responsive alignment
  const popoverPositionClasses = placement === "top"
    ? "bottom-full mb-3 left-0 origin-bottom-left"
    : "top-full mt-2 right-0 origin-top-right";

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-xl transition-all border backdrop-blur-md cursor-pointer ${
          compact
            ? "px-2.5 py-1 text-xs bg-white/80 dark:bg-[#191a1a]/80 hover:bg-zinc-100 dark:hover:bg-[#202222] border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-gray-200 shadow-sm"
            : "px-3 py-1.5 text-xs font-medium bg-white/90 dark:bg-[#141515]/90 hover:bg-zinc-100 dark:hover:bg-[#1f2121] border-zinc-200 dark:border-white/15 text-zinc-700 dark:text-gray-200 shadow-sm"
        }`}
        title={`Active AI Model: ${activeModel.name}`}
      >
        <div className={`p-0.5 rounded-md ${activeTheme.color}`}>
          {activeModel.provider === "groq" ? (
            <RiFlashlightLine className="w-3.5 h-3.5" />
          ) : activeModel.id?.includes("reason") || activeModel.id?.includes("r1") ? (
            <RiBrainLine className="w-3.5 h-3.5" />
          ) : activeModel.isCustom ? (
            <RiKey2Line className="w-3.5 h-3.5 text-cyan-400" />
          ) : (
            <RiSparkling2Line className="w-3.5 h-3.5" />
          )}
        </div>

        {/* On mobile: short brand name (Gemini, Mistral, Groq, DeepSeek, Claude, etc.) */}
        <span className="font-medium sm:hidden truncate max-w-[65px] xs:max-w-[85px]">
          {getShortBrandName(activeModel)}
        </span>

        {/* On desktop: full model name */}
        <span className="font-medium hidden sm:inline truncate max-w-[160px]">
          {activeModel.name}
        </span>

        {activeModel.isCustom && (
          <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
            Custom
          </span>
        )}

        <RiArrowDownSLine
          className={`w-3.5 h-3.5 text-zinc-400 dark:text-gray-400 transition-transform duration-200 ${
            isOpen ? (placement === "top" ? "rotate-180 text-cyan-400" : "rotate-180 text-cyan-400") : ""
          }`}
        />
      </button>

      {/* Popover Dropdown rendered into document.body on top layer below blob */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={popoverRef}
          data-lenis-prevent="true"
          onWheel={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            left: `${popoverCoords.left}px`,
            ...(popoverCoords.openUpward
              ? { bottom: `${Math.max(16, window.innerHeight - popoverCoords.top)}px` }
              : { top: `${Math.max(16, popoverCoords.top)}px` }),
            width: `${popoverCoords.width}px`,
            maxHeight: 'min(480px, 75vh)',
            zIndex: 9990,
            animation: 'fadeInScale 0.15s ease-out'
          }}
          className="rounded-2xl bg-[#fafafa]/98 dark:bg-[#121314]/98 backdrop-blur-2xl border border-zinc-200/90 dark:border-white/15 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col overscroll-contain"
        >
          {/* Header & Search */}
          <div className="p-3 border-b border-zinc-200/80 dark:border-white/10 bg-zinc-50/80 dark:bg-[#171819]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-gray-300">
                <RiCpuLine className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
                <span>Select AI Model</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 dark:text-gray-400 hover:text-zinc-900 dark:hover:text-white p-1 rounded-lg hover:bg-zinc-200/60 dark:hover:bg-white/10 cursor-pointer"
              >
                <RiCloseLine className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <RiSearchLine className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 dark:text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search models (Gemini, Claude, DeepSeek...)"
                className="w-full bg-white dark:bg-[#0c0d0d] text-xs text-zinc-900 dark:text-white rounded-lg pl-8 pr-3 py-1.5 border border-zinc-200 dark:border-white/10 focus:outline-none focus:border-cyan-500/50 placeholder-zinc-400 dark:placeholder-gray-500"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-0.5 no-scrollbar text-[11px]">
              {[
                { id: "all", label: "All" },
                { id: "default", label: "Default / Free" },
                { id: "custom", label: `Custom Keys (${customModels.length})` },
                { id: "reasoning", label: "Reasoning" },
                { id: "fast", label: "Fast" }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterTab(tab.id)}
                  className={`px-2 py-0.5 rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                    filterTab === tab.id
                      ? "bg-cyan-500 text-black font-semibold shadow-xs"
                      : "bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-gray-400 hover:bg-zinc-200 dark:hover:bg-white/10"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Model Cards Scroll List */}
          <div
            data-lenis-prevent="true"
            onWheel={(e) => e.stopPropagation()}
            className="overflow-y-auto min-h-0 flex-1 p-2 space-y-1 divide-y divide-zinc-200/50 dark:divide-white/5 custom-scrollbar overscroll-contain"
          >
            {filteredModels.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-400 dark:text-gray-500">
                No models found matching "{search}"
              </div>
            ) : (
              filteredModels.map((m) => {
                const isSelected = activeModel.id === m.id && activeModel.isCustom === m.isCustom;
                const iconColorStyle = isSelected ? NEUTRAL_THEME.selectedColor : NEUTRAL_THEME.color;

                return (
                  <div
                    key={`${m.provider}-${m.id}-${m.isCustom ? 'custom' : 'builtin'}`}
                    onClick={() => handleSelect(m)}
                    className={`pt-1 first:pt-0 group flex items-start gap-3 p-2 rounded-xl transition-all cursor-pointer ${
                      isSelected
                        ? "bg-cyan-500/10 border border-cyan-500/30 text-zinc-900 dark:text-white"
                        : "hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-700 dark:text-gray-300"
                    }`}
                  >
                    <div className={`mt-0.5 p-1 rounded-lg border shrink-0 ${iconColorStyle}`}>
                      {m.provider === "groq" ? (
                        <RiFlashlightLine className="w-3.5 h-3.5" />
                      ) : m.id?.includes("reason") || m.id?.includes("r1") ? (
                        <RiBrainLine className="w-3.5 h-3.5" />
                      ) : m.isCustom ? (
                        <RiKey2Line className="w-3.5 h-3.5" />
                      ) : (
                        <RiSparkling2Line className="w-3.5 h-3.5" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold truncate group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition-colors">
                          {m.name}
                        </span>
                        {m.badge && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-200/80 dark:bg-white/10 text-zinc-600 dark:text-gray-300 font-medium">
                            {m.badge}
                          </span>
                        )}
                        {m.isCustom && (
                          <span className="text-[9px] uppercase px-1 rounded bg-cyan-500/20 text-cyan-400 font-bold">
                            Key Added
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                        {m.description}
                      </p>
                    </div>

                    {isSelected && (
                      <RiCheckLine className="w-4 h-4 text-cyan-500 dark:text-cyan-400 shrink-0 self-center" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Action */}
          <div className="p-2.5 border-t border-zinc-200/80 dark:border-white/10 bg-zinc-50/80 dark:bg-[#171819] flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate("/settings/api-keys");
              }}
              className="flex items-center gap-1.5 text-xs text-cyan-500 dark:text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300 font-medium transition-colors cursor-pointer truncate"
            >
              <RiSettings3Line className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Manage API Keys & Models</span>
            </button>
            <span className="text-[10px] text-zinc-400 dark:text-gray-500 shrink-0">
              {allModels.length} models
            </span>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
