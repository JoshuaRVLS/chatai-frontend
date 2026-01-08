"use client";

import React, { FormEvent, useContext, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import { toast } from '@/app/lib/toast';
import { AuthContext } from "../providers/AuthProvider";
import CharacterTags from "../components/CharacterTags/CharacterTags";
import CharacterCard from "../components/CharacterCard/CharacterCard";
import {
  FiCamera,
  FiInfo,
  FiType,
  FiCpu,
  FiMap,
  FiMessageSquare,
  FiZap,
  FiPlus,
  FiHash,
  FiBook,
  FiAlertTriangle,
  FiGlobe
} from "react-icons/fi";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { useAuthAction } from "@/app/hooks/useAuthAction";

type TagOption = { label: string; value: string };

const CreateCharacterPage: React.FC = () => {
  const { user } = useContext(AuthContext);
  const { withAuth, isAuthenticated } = useAuthAction();
  const router = useRouter();

  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [characterName, setCharacterName] = useState("");
  const [characterBio, setCharacterBio] = useState("");
  const [characterPersona, setCharacterPersona] = useState("");
  const [scenario, setScenario] = useState("");
  const [initialMessage, setInitialMessage] = useState("");
  const [selectedOptions, setSelectedOptions] = useState<TagOption[]>([]);
  const [selectedLorebooks, setSelectedLorebooks] = useState<string[]>([]);
  const [isNsfw, setIsNsfw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const { data: lorebooks } = useQuery<any[]>({
    queryKey: ["lorebooks"],
    queryFn: () => fetch("/api/lorebooks").then(res => res.json().then(d => d.data)),
    enabled: !!user?.id,
  });

  const getTokenCount = (text: string) => Math.floor(text.length / 4);
  const totalTokens = getTokenCount(characterPersona) + getTokenCount(scenario) + getTokenCount(initialMessage);

  const handleChubImport = withAuth(async () => {
    if (!importUrl) {
      toast.error("Please enter a Chub.ai URL");
      return;
    }

    setIsImporting(true);
    const id = toast.loading("Scraping Chub.ai database...");

    try {
      const response = await fetch("/api/import/chub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      const { data } = result;
      setCharacterName(data.name);
      setCharacterBio(data.bio);
      setCharacterPersona(data.persona);
      setScenario(data.scenario);
      setInitialMessage(data.introMessage);
      setIsNsfw(data.isNsfw);

      if (data.avatarBase64) {
        setImagePreview(data.avatarBase64);
        // Convert base64 to File
        const res = await fetch(data.avatarBase64);
        const blob = await res.blob();
        const file = new File([blob], "chub_import.png", { type: "image/png" });
        setImage(file);
      }

      toast.success("Intelligence data synchronized", { id });
      setImportUrl("");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to import from Chub.ai", { id });
    } finally {
      setIsImporting(false);
    }
  });

  const handleSubmit = withAuth(async (e: FormEvent) => {
    e.preventDefault();
    if (!image) {
      toast.error("Please upload a character image");
      return;
    }

    setLoading(true);
    const formData = new FormData();

    formData.append("image", image);
    formData.append("characterName", characterName);
    formData.append("characterBio", characterBio);
    formData.append("characterPersona", characterPersona);
    formData.append("scenario", scenario);
    formData.append("initialMessage", initialMessage);
    formData.append("userId", user?.id || "");
    formData.append("tags", JSON.stringify(selectedOptions));
    formData.append("lorebooks", JSON.stringify(selectedLorebooks));
    formData.append("isNsfw", isNsfw.toString());

    try {
      const response = await fetch("/api/characters", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to create character");

      const data = await response.json();
      toast.success(data.message);
      router.push("/my_characters");
    } catch (err) {
      console.error(err);
      toast.error("Failed to create character");
    } finally {
      setLoading(false);
    }
  });

  return (
    <div className="min-h-screen bg-zinc-950 pt-28 pb-20 px-6 sm:px-12 relative overflow-hidden">
      {/* Background Blobs - Monochrome */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-white/2 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/1 blur-[100px] rounded-full" />
      </div>

      <div className="w-full relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-10 bg-primary rounded-full shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
              <h1 className="text-4xl sm:text-6xl font-black text-white italic tracking-tighter uppercase leading-none">
                New Character
              </h1>
            </div>
            <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.4em] ml-6">
              Creation Suite • Version 2.0 • Archiving into Central Database
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-white/3 border border-white/5 rounded-2xl px-6 py-3 backdrop-blur-xl">
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Estimated Density</p>
              <div className="flex items-center gap-2">
                <FiZap className="text-white/40" />
                <span className="text-lg font-black text-white italic">{totalTokens} <span className="text-xs text-zinc-600 not-italic">Tokens</span></span>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Editing Column */}
          <div className="lg:col-span-8 space-y-10">
            {/* Quick Import Section */}
            <section className="bg-white/2 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-3xl space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FiGlobe className="text-white/60" />
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">Intelligence Sync</h3>
                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Import from external databases (Chub.ai)</p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-white/5 rounded-full border border-white/5">
                  <p className="text-[8px] font-black text-zinc-500 uppercase">External Sync</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="relative flex-1 group">
                  <input
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    placeholder="https://chub.ai/characters/creator/slug..."
                    className="bg-white/2 border border-white/5 rounded-xl px-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 w-48 transition-colors"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleChubImport}
                  disabled={isImporting}
                  className="px-8 py-4 bg-white text-zinc-950 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isImporting ? (
                    <div className="w-4 h-4 border-2 border-zinc-950/20 border-t-zinc-950 rounded-full animate-spin" />
                  ) : (
                    <>
                      <FiZap /> Sync
                    </>
                  )}
                </button>
              </div>
            </section>

            {/* Image & Identity Section */}
            <section className="bg-white/3 border border-white/10 rounded-[2.5rem] p-8 sm:p-10 backdrop-blur-3xl space-y-8">
              <div className="flex items-center gap-3 mb-2">
                <FiInfo className="text-white/40" />
                <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">Core Identity</h3>
              </div>

              <div className="flex flex-col md:flex-row gap-10">
                <div className="w-full md:w-1/3 space-y-4">
                  <div className="relative aspect-square rounded-4xl overflow-hidden border border-white/5 bg-white/5 group">
                    {imagePreview ? (
                      <Image src={imagePreview} fill className="object-cover" alt="Preview" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FiCamera className="text-white/10 text-4xl" />
                      </div>
                    )}
                    <input
                      type="file"
                      id="image-upload"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setImage(file);
                          setImagePreview(URL.createObjectURL(file));
                        }
                      }}
                      className="hidden"
                    />
                    <label
                      htmlFor="image-upload"
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer backdrop-blur-sm"
                    >
                      <FiCamera className="text-white text-2xl mb-2" />
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">Upload Visual</span>
                    </label>
                  </div>
                  <p className="text-[9px] text-white/20 uppercase tracking-wider text-center px-4 font-bold leading-relaxed">
                    Identity visuals support JPG, PNG. Resolution is auto-optimized for the archive.
                  </p>
                </div>

                <div className="flex-1 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Character Name</label>
                    <div className="relative group">
                      <FiType className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-primary transition-colors" />
                      <input
                        required
                        value={characterName}
                        onChange={(e) => setCharacterName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-4 text-white placeholder:text-white/5 outline-none focus:border-primary/50 focus:bg-white/10 transition-all font-bold"
                        placeholder="Identity label..."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Public Biography</label>
                    <textarea
                      required
                      value={characterBio}
                      onChange={(e) => setCharacterBio(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/5 outline-none focus:border-primary/50 focus:bg-white/10 transition-all text-sm h-32 resize-none scrollbar-hide font-medium leading-relaxed"
                      placeholder="Brief history for the central archives..."
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group transition-all hover:border-orange-500/20">
                    <div className="flex items-center gap-3">
                      <FiAlertTriangle className={`transition-colors ${isNsfw ? "text-orange-500" : "text-white/20"}`} />
                      <div>
                        <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Mature Content</p>
                        <p className="text-[9px] text-white/20 font-bold uppercase tracking-tighter mt-1">Mark character as NSFW</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsNsfw(!isNsfw)}
                      className={`relative w-12 h-6 rounded-full transition-all duration-300 ${isNsfw ? "bg-white" : "bg-white/5 border border-white/5"}`}
                    >
                      <motion.div
                        animate={{ x: isNsfw ? 26 : 2 }}
                        className={`absolute top-1 w-4 h-4 rounded-full shadow-lg ${isNsfw ? "bg-zinc-950" : "bg-white/20"}`}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Tags Section */}
            <section className="bg-white/3 border border-white/5 rounded-[2.5rem] p-8 sm:p-10 backdrop-blur-3xl space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <FiHash className="text-white/40" />
                <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">Tags</h3>
              </div>
              <CharacterTags
                selectedOptions={selectedOptions}
                setSelectedOptions={setSelectedOptions}
              />
            </section>

            {/* Lorebooks Section */}
            <section className="bg-white/3 border border-white/5 rounded-[2.5rem] p-8 sm:p-10 backdrop-blur-3xl space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <FiBook className="text-white/40" />
                <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">Lorebooks</h3>
              </div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-black leading-relaxed">
                Link existing information modules to provide this entity with persistent world knowledge.
              </p>

              <div className="flex flex-wrap gap-2">
                {lorebooks && lorebooks.length > 0 ? (
                  lorebooks.map(lb => (
                    <button
                      key={lb.id}
                      type="button"
                      onClick={() => {
                        setSelectedLorebooks(prev =>
                          prev.includes(lb.id) ? prev.filter(id => id !== lb.id) : [...prev, lb.id]
                        );
                      }}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${selectedLorebooks.includes(lb.id)
                        ? "bg-white text-zinc-950 border-white"
                        : "bg-white/5 text-zinc-600 border-white/5 hover:border-white/20"
                        }`}
                    >
                      {lb.name}
                    </button>
                  ))
                ) : (
                  <p className="text-[10px] text-white/10 uppercase tracking-widest font-black py-4 italic">
                    No modules detected in your local archive.
                  </p>
                )}
              </div>
            </section>

            {/* Intelligence Configuration */}
            <section className="bg-white/3 border border-white/5 rounded-[2.5rem] p-8 sm:p-10 backdrop-blur-3xl space-y-8">
              <div className="flex items-center gap-3 mb-2">
                <FiCpu className="text-white/40" />
                <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">AI Configuration</h3>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-end px-1">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Character Persona</label>
                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{getTokenCount(characterPersona)} Tokens</span>
                  </div>
                  <textarea
                    required
                    value={characterPersona}
                    onChange={(e) => setCharacterPersona(e.target.value)}
                    className="w-full bg-white/1 shadow-inner border border-white/10 rounded-3xl px-6 py-6 text-white placeholder:text-white/5 outline-none focus:border-primary/50 focus:bg-white/5 transition-all text-sm h-64 resize-none scrollbar-hide font-medium leading-relaxed"
                    placeholder="Describe traits, personality, speech patterns..."
                  />
                  <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex gap-3">
                    <div className="text-primary pt-0.5"><FiInfo size={14} /></div>
                    <p className="text-[10px] text-white/40 leading-relaxed font-bold">
                      Use <span className="text-primary">{`{char}`}</span> for character and <span className="text-primary">{`{user}`}</span> for the person chatting.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-end px-1">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Scenario</label>
                    <span className="text-[9px] font-black text-primary uppercase tracking-widest">{getTokenCount(scenario)} Tokens</span>
                  </div>
                  <div className="relative">
                    <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      <div className="p-1 px-2 rounded-md bg-white/5 border border-white/10 text-[8px] font-black text-white/40 uppercase tracking-widest backdrop-blur-md">ENTITY</div>
                    </div>
                    <div className="absolute inset-0 bg-white/1 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                    <FiMap className="absolute right-6 top-6 text-white/10" />
                    <textarea
                      value={scenario}
                      onChange={(e) => setScenario(e.target.value)}
                      className="w-full bg-white/1 border border-white/10 rounded-3xl px-6 py-6 text-white placeholder:text-white/5 outline-none focus:border-primary/50 focus:bg-white/5 transition-all text-sm h-48 resize-none scrollbar-hide font-medium leading-relaxed"
                      placeholder="Context of the interaction or world state..."
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-end px-1">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Intro Message</label>
                    <span className="text-[9px] font-black text-primary uppercase tracking-widest">{getTokenCount(initialMessage)} Tokens</span>
                  </div>
                  <div className="relative">
                    <FiMessageSquare className="absolute right-6 top-6 text-white/10" />
                    <textarea
                      required
                      value={initialMessage}
                      onChange={(e) => setInitialMessage(e.target.value)}
                      className="w-full bg-white/1 border border-white/10 rounded-3xl px-6 py-6 text-white placeholder:text-white/5 outline-none focus:border-primary/50 focus:bg-white/5 transition-all text-sm h-48 resize-none scrollbar-hide font-medium leading-relaxed italic"
                      placeholder="The first greeting from the AI..."
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Submit Section (Mobile Only) */}
            <div className="lg:hidden">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 rounded-3xl bg-white text-zinc-950 flex items-center justify-center gap-3 group transition-all font-black uppercase tracking-widest text-[10px]"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-zinc-950/20 border-t-zinc-950 rounded-full animate-spin" />
                ) : (
                  <>
                    <FiPlus className="group-hover:scale-110 transition-transform" />
                    <span>New Character</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Sticky Preview Column */}
          <div className="lg:col-span-4 lg:sticky lg:top-32 h-fit space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3 px-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Live Preview</h3>
              </div>
              <div className="scale-95 sm:scale-100 origin-top">
                <CharacterCard
                  authorName={user?.username || "You"}
                  characterName={characterName || "New Identity"}
                  image={imagePreview}
                  characterBio={characterBio || "Draft your character to see it reflected here..."}
                  isNsfw={isNsfw}
                  tags={selectedOptions.map(opt => ({ name: opt.label, id: opt.value }))}
                />
              </div>
            </div>

            <div className="bg-white/3 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-3xl space-y-6">
              <div className="flex items-center gap-3">
                <FiZap className="text-white/40" />
                <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Deployment Stats</h3>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-[11px] font-black uppercase tracking-tight">
                  <span className="text-zinc-600">Total Tokens</span>
                  <span className="text-white">{totalTokens}/2048</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((totalTokens / 2048) * 100, 100)}%` }}
                    className={`h-full transition-all duration-500 bg-white shadow-[0_0_15px_rgba(255,255,255,0.2)] ${totalTokens > 1500 ? 'bg-zinc-400' : 'bg-white'
                      }`}
                  />
                </div>
                <p className="text-[9px] text-white/20 leading-relaxed font-bold">
                  Characters under 2000 tokens respond faster and with higher accuracy.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 rounded-2xl bg-white text-zinc-950 flex items-center justify-center gap-3 group mt-6 font-black uppercase tracking-widest text-[10px] hover:bg-zinc-200 transition-all"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-zinc-950/20 border-t-zinc-950 rounded-full animate-spin" />
                ) : (
                  <>
                    <FiPlus className="group-hover:scale-110 transition-transform" />
                    <span>New Character</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCharacterPage;
