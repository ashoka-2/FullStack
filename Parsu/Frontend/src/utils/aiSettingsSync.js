import { useState, useEffect } from 'react';

/**
 * Standardized getters & setters for Web Search and Cross-Chat Memory
 * Ensures consistent boolean parsing, local persistence, and cross-component/cross-tab event dispatching.
 */

export const getWebSearchSetting = () => {
  try {
    const saved = localStorage.getItem('parsu_web_search') ?? localStorage.getItem('perplexity_web_search');
    if (saved === null) return true; // Default ON
    return saved === 'true' || saved === '1';
  } catch {
    return true;
  }
};

export const setWebSearchSetting = (val) => {
  try {
    const boolVal = Boolean(val);
    localStorage.setItem('parsu_web_search', String(boolVal));
    window.dispatchEvent(new CustomEvent('parsu_web_search_change', { detail: boolVal }));
  } catch {
    /* silent */
  }
};

export const getMemorySetting = () => {
  try {
    const saved = localStorage.getItem('parsu_memory_enabled') ?? localStorage.getItem('perplexity_memory_enabled');
    if (saved === null) return true; // Default ON
    return saved === 'true' || saved === '1';
  } catch {
    return true;
  }
};

export const setMemorySetting = (val) => {
  try {
    const boolVal = Boolean(val);
    localStorage.setItem('parsu_memory_enabled', String(boolVal));
    window.dispatchEvent(new CustomEvent('parsu_memory_change', { detail: boolVal }));
  } catch {
    /* silent */
  }
};

/**
 * useAiFeatureToggles Hook
 * Provides synchronized `webSearch` and `memoryEnabled` state across ChatArea, ChatPage2, FollowUpInput,
 * AddToChatSheet, and Settings pages.
 */
export const useAiFeatureToggles = () => {
  const [webSearch, setWebSearchState] = useState(getWebSearchSetting);
  const [memoryEnabled, setMemoryEnabledState] = useState(getMemorySetting);

  useEffect(() => {
    const handleWebSearch = (e) => {
      setWebSearchState(Boolean(e.detail));
    };

    const handleMemory = (e) => {
      setMemoryEnabledState(Boolean(e.detail));
    };

    const handleStorage = (e) => {
      if (e.key === 'parsu_web_search') {
        setWebSearchState(e.newValue === 'true' || e.newValue === '1');
      }
      if (e.key === 'parsu_memory_enabled') {
        setMemoryEnabledState(e.newValue === 'true' || e.newValue === '1');
      }
    };

    window.addEventListener('parsu_web_search_change', handleWebSearch);
    window.addEventListener('parsu_memory_change', handleMemory);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('parsu_web_search_change', handleWebSearch);
      window.removeEventListener('parsu_memory_change', handleMemory);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const toggleWebSearch = (val) => {
    const next = typeof val === 'boolean' ? val : !webSearch;
    setWebSearchState(next);
    setWebSearchSetting(next);
  };

  const toggleMemory = (val) => {
    const next = typeof val === 'boolean' ? val : !memoryEnabled;
    setMemoryEnabledState(next);
    setMemorySetting(next);
  };

  return {
    webSearch,
    setWebSearch: toggleWebSearch,
    handleToggleWebSearch: () => toggleWebSearch(!webSearch),
    memoryEnabled,
    setMemoryEnabled: toggleMemory,
    handleToggleMemory: () => toggleMemory(!memoryEnabled),
  };
};
