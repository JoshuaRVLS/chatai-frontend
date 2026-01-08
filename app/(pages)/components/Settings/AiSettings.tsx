"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FiCpu, FiGlobe, FiKey, FiSave, FiCheck, FiChevronDown, FiZap } from "react-icons/fi";
import { toast } from '@/app/lib/toast';

const AiSettings = ({ data }: { data: any }) => {
  const [activeEngine, setActiveEngine] = useState<"default" | "external">("default");
  const [selectedModel, setSelectedModel] = useState("Deepseek");
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [apiUrl, setApiUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const models = [
    { name: "deepseek/deepseek-v3.2", id: "deepseek-v3.2", desc: "Default Model" },
    { name: "xiaomi/mimo-v2-flash:free", id: "mimo-v2-flash", desc: "Fast & Free" },
    { name: "google/gemini-2.5-flash-lite", id: "gemini-2.5-flash", desc: "Balanced Speed" },
    { name: "google/gemini-2.0-flash-001", id: "gemini-2.0-flash", desc: "High Logic" },
    { name: "openai/gpt-4o-mini", id: "gpt-4o-mini", desc: "Balanced performance" },
  ];

  // Load preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("jchat_ai_prefs");
    if (saved) {
      const parsed = JSON.parse(saved);
      setActiveEngine(parsed.engine || "default");
      setSelectedModel(parsed.model || "deepseek/deepseek-v3.2");
      setApiUrl(parsed.apiUrl || "");
      setApiKey(parsed.apiKey || "");
    }
  }, []);

  const handleSaveSettings = () => {
    setIsSaving(true);
    const settings = {
      engine: activeEngine,
      model: selectedModel,
      apiUrl,
      apiKey
    };

    setTimeout(() => {
      localStorage.setItem("jchat_ai_prefs", JSON.stringify(settings));
      toast.success("AI Configuration synchronized");
      setIsSaving(false);
    }, 800);
  };

  return (
    <div className="space-y-8 p-4">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-2xl border border-primary/20">
          <FiCpu />
        </div>
        <div>
          <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase">AI Configuration</h3>
          <p className="text-white/40 text-[10px] mt-1 uppercase tracking-[0.2em] font-black">Configure your conversation intelligence.</p>
        </div>
      </div>

      <section className="space-y-6">
        {/* Engine Switcher */}
        <div className="grid grid-cols-2 gap-4 p-1.5 bg-white/5 rounded-2xl border border-white/5">
          <button
            onClick={() => setActiveEngine("default")}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold text-sm ${activeEngine === "default"
              ? "bg-primary text-black shadow-[0_0_20px_rgba(34,211,238,0.3)]"
              : "hover:bg-white/5 text-white/50"
              }`}
          >
            <FiZap /> <span>Default Model</span>
          </button>
          <button
            onClick={() => setActiveEngine("external")}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold text-sm ${activeEngine === "external"
              ? "bg-primary text-black shadow-[0_0_20px_rgba(34,211,238,0.3)]"
              : "hover:bg-white/5 text-white/50"
              }`}
          >
            <FiGlobe /> <span>External API</span>
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeEngine === "default" ? (
            <motion.div
              key="default"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              <label className="text-xs font-black uppercase tracking-widest text-white/30 ml-1">
                Optimized Models
              </label>
              <div className="grid gap-3">
                {models.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedModel(m.name)}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${selectedModel === m.name
                      ? "bg-white/10 border-primary/40 text-white"
                      : "bg-white/5 border-white/5 text-white/40 hover:border-white/20"
                      }`}
                  >
                    <div className="text-left">
                      <p className="font-bold">{m.name}</p>
                      <p className="text-[10px] opacity-60">{m.desc}</p>
                    </div>
                    {selectedModel === m.name && <FiCheck className="text-primary" />}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="external"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-white/30 ml-1">
                  Base Proxy URL
                </label>
                <div className="relative group">
                  <FiGlobe className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" />
                  <input
                    type="url"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    className="input-modern has-icon"
                    placeholder="https://api.openai.com/v1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-white/30 ml-1">
                  Private API Key
                </label>
                <div className="relative group">
                  <FiKey className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" />
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="input-modern has-icon"
                    placeholder="sk-••••••••••••••••"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={handleSaveSettings}
          disabled={isSaving}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn-primary w-full py-4 flex items-center justify-center gap-2 group mt-4"
        >
          {isSaving ? <FiSave className="animate-spin" /> : <><FiSave /> <span>Synchronize Preferences</span></>}
        </motion.button>
      </section>
    </div>
  );
};

export default AiSettings;
