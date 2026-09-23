import React, { useState, useEffect } from "react";
import {
  RiKey2Line,
  RiAddLine,
  RiDeleteBin6Line,
  RiCheckLine,
  RiLoader4Line,
  RiEyeLine,
  RiEyeOffLine,
  RiCpuLine,
  RiInformationLine,
  RiArrowRightLine,
  RiFlashlightLine,
  RiBrainLine,
  RiShieldCheckLine,
  RiExternalLinkLine,
  RiSparkling2Line
} from "@remixicon/react";
import {
  getModels,
  testApiKey,
  saveCustomApiKey,
  deleteCustomApiKey,
  setSelectedModel
} from "../../chat/service/model.api";

const PRESET_PROVIDERS = [
  { id: "gemini", name: "Google Gemini", placeholder: "AIzaSy...", docs: "https://aistudio.google.com/app/apikey" },
  { id: "openai", name: "OpenAI", placeholder: "sk-proj-...", docs: "https://platform.openai.com/api-keys" },
  { id: "anthropic", name: "Anthropic Claude", placeholder: "sk-ant-...", docs: "https://console.anthropic.com/settings/keys" },
  { id: "deepseek", name: "DeepSeek", placeholder: "sk-...", docs: "https://platform.deepseek.com/api_keys" },
  { id: "mistral", name: "Mistral AI", placeholder: "...", docs: "https://console.mistral.ai/api-keys/" },
  { id: "groq", name: "Groq (Ultra-Fast Llama)", placeholder: "gsk_...", docs: "https://console.groq.com/keys" },
  { id: "nvidia", name: "NVIDIA NIM", placeholder: "nvapi-...", docs: "https://build.nvidia.com/" },
  { id: "openrouter", name: "OpenRouter", placeholder: "sk-or-v1-...", docs: "https://openrouter.ai/keys" },
  { id: "custom", name: "Custom (OmniRoute / Zen Extra / OpenCode Go / Agent Router)", placeholder: "custom-key...", docs: "" }
];

export default function CustomKeyManager({ onNotify }) {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [customKeys, setCustomKeys] = useState([]);
  const [defaultModels, setDefaultModels] = useState([]);
  const [activeModel, setActiveModel] = useState(null);

  // Modal / Form state
  const [isAdding, setIsAdding] = useState(false);
  const [provider, setProvider] = useState("gemini");
  const [customName, setCustomName] = useState("");
  const [customBaseUrl, setCustomBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Accordion for viewing unlocked models
  const [expandedKeyId, setExpandedKeyId] = useState(null);

  // Fetch current models and saved keys
  const loadKeysAndModels = async () => {
    try {
      setLoading(true);
      const data = await getModels();
      if (data.success) {
        setCustomKeys(data.customKeys || []);
        setDefaultModels(data.defaultModels || []);
        setActiveModel(data.selectedModel || null);
      }
    } catch (err) {
      console.error("Failed to load keys/models:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKeysAndModels();
  }, []);

  // Quick Preset Provider change handler
  const handleProviderSelect = (provId) => {
    setProvider(provId);
    setTestResult(null);
    if (provId === "custom" && !customBaseUrl) {
      setCustomBaseUrl("https://api.omniroute.ai/v1");
      setCustomName("OmniRoute");
    }
  };

  // Test Key
  const handleTestKey = async () => {
    if (!apiKey.trim()) {
      onNotify?.("Please enter an API key first", "error");
      return;
    }
    try {
      setTesting(true);
      setTestResult(null);
      const res = await testApiKey({
        provider,
        apiKey: apiKey.trim(),
        baseUrl: provider === "custom" ? customBaseUrl.trim() : ""
      });
      if (res.success) {
        setTestResult({
          success: true,
          count: res.modelsCount || res.models?.length || 0,
          models: res.models || []
        });
        onNotify?.(`Connected successfully! Found ${res.modelsCount} models.`, "success");
      }
    } catch (err) {
      console.error("Test failed:", err);
      const msg = err.response?.data?.message || err.message || "Failed to verify API key";
      setTestResult({ success: false, error: msg });
      onNotify?.(msg, "error");
    } finally {
      setTesting(false);
    }
  };

  // Save Key
  const handleSaveKey = async (e) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      onNotify?.("Please provide an API key", "error");
      return;
    }

    try {
      setLoading(true);
      const res = await saveCustomApiKey({
        provider,
        apiKey: apiKey.trim(),
        name: provider === "custom" ? (customName.trim() || "Custom Provider") : PRESET_PROVIDERS.find(p => p.id === provider)?.name,
        baseUrl: provider === "custom" ? customBaseUrl.trim() : ""
      });

      if (res.success) {
        onNotify?.(res.message || "Custom API key saved securely!", "success");
        setIsAdding(false);
        setApiKey("");
        setCustomName("");
        setCustomBaseUrl("");
        setTestResult(null);
        await loadKeysAndModels();
      }
    } catch (err) {
      console.error("Save key error:", err);
      const msg = err.response?.data?.message || err.message || "Failed to save API key";
      onNotify?.(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  // Delete Key
  const handleDeleteKey = async (keyId, providerName) => {
    if (!window.confirm(`Are you sure you want to remove ${providerName}?`)) return;

    try {
      setLoading(true);
      const res = await deleteCustomApiKey(keyId);
      if (res.success) {
        onNotify?.("API key deleted", "info");
        await loadKeysAndModels();
      }
    } catch (err) {
      console.error("Delete key error:", err);
      onNotify?.("Failed to delete key", "error");
    } finally {
      setLoading(false);
    }
  };

  // Change Preferred Default Model
  const handleSetPreferredModel = async (model) => {
    try {
      setActiveModel(model);
      await setSelectedModel({
        provider: model.provider || "gemini",
        modelId: model.id,
        modelName: model.name
      });
      onNotify?.(`Default model set to ${model.name}`, "success");
    } catch (err) {
      console.error("Failed to set preferred model:", err);
    }
  };

  const selectedProviderConfig = PRESET_PROVIDERS.find(p => p.id === provider) || PRESET_PROVIDERS[0];

  return (
    <div className="bg-white dark:bg-[#121214] border border-zinc-200/90 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold">
            <RiCpuLine size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">
              AI Models & Custom API Keys
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Bring your own API keys for OpenAI, Claude, DeepSeek, Groq, NVIDIA NIM, OmniRoute, Zen Extra & more. Keys are encrypted secretly in DB.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsAdding(!isAdding);
            setTestResult(null);
          }}
          className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer w-fit"
        >
          <RiAddLine size={16} />
          <span>{isAdding ? "Close Form" : "Add Custom Key"}</span>
        </button>
      </div>

      {/* Add / Update API Key Form */}
      {isAdding && (
        <form
          onSubmit={handleSaveKey}
          className="p-5 rounded-2xl bg-white dark:bg-zinc-900/80 border border-cyan-500/30 shadow-lg space-y-4 animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <RiKey2Line size={16} className="text-cyan-400" />
              <span>Connect AI Provider Key</span>
            </h3>
            {selectedProviderConfig.docs && (
              <a
                href={selectedProviderConfig.docs}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>Get API Key</span>
                <RiExternalLinkLine size={12} />
              </a>
            )}
          </div>

          {/* Provider Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
              Select Provider
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESET_PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleProviderSelect(p.id)}
                  className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer flex items-center gap-2 ${
                    provider === p.id
                      ? "bg-cyan-500/15 border-cyan-500/50 text-cyan-300 shadow-sm"
                      : "bg-zinc-100/50 dark:bg-zinc-800/40 border-zinc-200 dark:border-white/5 text-zinc-600 dark:text-zinc-400 hover:text-white"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span className="truncate">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* If Custom Provider: Base URL & Name */}
          {provider === "custom" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  Custom Provider Name
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="OmniRoute, Zen Extra, OpenCode Go, Agent Router..."
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  Base URL (OpenAI-Compatible)
                </label>
                <input
                  type="url"
                  value={customBaseUrl}
                  onChange={(e) => setCustomBaseUrl(e.target.value)}
                  placeholder="https://api.omniroute.ai/v1"
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>
          )}

          {/* API Key Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
              API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={selectedProviderConfig.placeholder}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-xl pl-3 pr-10 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-cyan-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                {showKey ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
              </button>
            </div>
            <p className="text-[11px] text-zinc-500">
              Encrypted with AES-256 before being stored in DB. Never displayed in plain text again.
            </p>
          </div>

          {/* Live Test Status Banner */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                testResult.success
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-red-500/10 border-red-500/30 text-red-300"
              }`}
            >
              {testResult.success ? (
                <RiCheckLine size={16} className="shrink-0 mt-0.5" />
              ) : (
                <RiInformationLine size={16} className="shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">
                  {testResult.success
                    ? `Verified! Found ${testResult.count} accessible models.`
                    : "Verification Failed"}
                </p>
                {testResult.success && testResult.models?.length > 0 && (
                  <p className="text-[11px] text-emerald-400/80 mt-0.5 line-clamp-2">
                    Sample models: {testResult.models.slice(0, 6).map(m => m.id).join(", ")}
                    {testResult.models.length > 6 ? "..." : ""}
                  </p>
                )}
                {!testResult.success && (
                  <p className="text-[11px] text-red-400/90 mt-0.5">
                    {testResult.error}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleTestKey}
              disabled={testing || !apiKey.trim()}
              className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              {testing ? (
                <>
                  <RiLoader4Line size={14} className="animate-spin" />
                  <span>Testing & Fetching Models...</span>
                </>
              ) : (
                <>
                  <RiShieldCheckLine size={14} />
                  <span>Test & Fetch Models</span>
                </>
              )}
            </button>

            <button
              type="submit"
              disabled={loading || !apiKey.trim()}
              className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <RiLoader4Line size={14} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <RiCheckLine size={14} />
                  <span>Save & Unlock Models</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* List of Connected Custom API Keys */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Connected API Keys ({customKeys.length})
        </h3>

        {customKeys.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white/5 border border-dashed border-zinc-200 dark:border-white/10 text-center space-y-2">
            <RiKey2Line className="w-8 h-8 mx-auto text-zinc-500" />
            <p className="text-xs text-zinc-400">
              No custom API keys added yet. You are currently using our built-in default models (Gemini 2.5 Flash, Mistral, Groq Llama, DeepSeek).
            </p>
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="mt-2 px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 text-xs font-semibold border border-cyan-500/30 hover:bg-cyan-500/30 cursor-pointer inline-flex items-center gap-1"
            >
              <RiAddLine size={14} />
              <span>Add Your First Key</span>
            </button>
          </div>
        ) : (
          customKeys.map((key) => {
            const isExpanded = expandedKeyId === key._id;
            const modelsCount = key.models?.length || 0;

            return (
              <div
                key={key._id}
                className="rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/10 p-4 transition-all"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      <RiKey2Line size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          {key.name || key.provider}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
                          {key.provider}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-mono mt-0.5">
                        <span>{key.maskedKey}</span>
                        {key.baseUrl && (
                          <span className="text-zinc-500 truncate max-w-[200px]">
                            {key.baseUrl}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setExpandedKeyId(isExpanded ? null : key._id)}
                      className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-[11px] font-medium transition-colors cursor-pointer"
                    >
                      {isExpanded ? "Hide Models" : `View ${modelsCount} Models`}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteKey(key._id, key.name || key.provider)}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Delete API key"
                    >
                      <RiDeleteBin6Line size={16} />
                    </button>
                  </div>
                </div>

                {/* Expanded Models List */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-white/5">
                    <div className="text-[11px] font-semibold text-zinc-400 mb-2">
                      Unlocked Models from this Key:
                    </div>
                    <div data-lenis-prevent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                      {key.models?.map((m) => {
                        const isPref = activeModel?.modelId === m.id;
                        return (
                          <div
                            key={m.id}
                            onClick={() =>
                              handleSetPreferredModel({
                                id: m.id,
                                name: m.name || m.id,
                                provider: key.provider
                              })
                            }
                            className={`p-2 rounded-xl text-left border cursor-pointer transition-all ${
                              isPref
                                ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-200"
                                : "bg-white/5 border-white/5 text-zinc-300 hover:bg-white/10"
                            }`}
                          >
                            <div className="text-xs font-semibold truncate">
                              {m.name || m.id}
                            </div>
                            <div className="text-[10px] text-zinc-400 truncate">
                              {m.id}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Built-in Default Models Summary */}
      <div className="pt-2 border-t border-zinc-200 dark:border-white/5">
        <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
          Site Built-in Free Models ({defaultModels.length})
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          {defaultModels.map((m) => {
            const isPref = activeModel?.modelId === m.id;
            return (
              <div
                key={m.id}
                onClick={() => handleSetPreferredModel(m)}
                className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                  isPref
                    ? "bg-cyan-500/15 border-cyan-500/50 ring-1 ring-cyan-500/30"
                    : "bg-white dark:bg-zinc-900/40 border-zinc-200 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/15"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {m.name}
                  </span>
                  {m.badge && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-medium bg-zinc-200 dark:bg-white/10 text-zinc-600 dark:text-zinc-300">
                      {m.badge}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-2">
                  {m.description}
                </p>
                {isPref && (
                  <div className="mt-2 text-[10px] text-cyan-400 font-semibold flex items-center gap-1">
                    <RiCheckLine size={12} />
                    <span>Default Active Model</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
