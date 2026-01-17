"use client";

import React, { FormEvent, useContext, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import { toast } from '@/app/lib/toast';
import { AuthContext } from "../providers/AuthProvider";
import CharacterTags from "../components/CharacterTags/CharacterTags";
import CharacterCard from "../components/CharacterCard/CharacterCard";
import DescriptionEditor from "../components/DescriptionEditor/DescriptionEditor";
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
  FiAlignLeft
} from "react-icons/fi";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { useAuthAction } from "@/app/hooks/useAuthAction";
import LorebookSelector from "../components/LorebookSelector/LorebookSelector";

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
  const [exampleConversations, setExampleConversations] = useState("");
  const [selectedOptions, setSelectedOptions] = useState<TagOption[]>([]);
  const [selectedLorebooks, setSelectedLorebooks] = useState<string[]>([]);
  const [isNsfw, setIsNsfw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  const { data: lorebooks } = useQuery<any[]>({
    queryKey: ["lorebooks"],
    queryFn: () => fetch("/api/lorebooks?filter=library").then(res => res.json().then(d => d.data)),
    enabled: !!user?.id,
  });

  const getTokenCount = (text: string) => Math.floor(text.length / 4);
  const totalTokens = getTokenCount(characterPersona) + getTokenCount(scenario) + getTokenCount(initialMessage) + getTokenCount(exampleConversations);


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
    formData.append("exampleConversations", exampleConversations);
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
    <div className="min-h-screen bg-page pt-28 pb-20 px-6 sm:px-12 relative">
      {/* Background Blobs - Monochrome */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-surface-hover/30 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-surface-hover/20 blur-[100px] rounded-full" />
      </div>

      <div className="w-full relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-10 bg-text-primary rounded-full shadow-sm" />
              <h1 className="text-4xl sm:text-6xl font-black text-text-primary italic tracking-tighter uppercase leading-none">
                New Character
              </h1>
            </div>
            <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.4em] ml-6">
              Creation Suite • Version 2.0 • Archiving into Central Database
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-surface border border-border-default rounded-2xl px-6 py-3 backdrop-blur-xl">
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Estimated Density</p>
              <div className="flex items-center gap-2">
                <FiZap className="text-text-muted" />
                <span className="text-lg font-black text-text-primary italic">{totalTokens} <span className="text-xs text-text-muted not-italic">Tokens</span></span>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Editing Column */}
          <div className="lg:col-span-8 space-y-10">

            {/* Image & Identity Section */}
            <section className="bg-surface/50 border border-border-default rounded-[2.5rem] p-8 sm:p-10 backdrop-blur-3xl space-y-8">
              <div className="flex items-center gap-3 mb-2">
                <FiInfo className="text-text-muted" />
                <h3 className="text-xs font-black text-text-primary uppercase tracking-[0.3em]">Core Identity</h3>
              </div>

              <div className="flex flex-col md:flex-row gap-10">
                <div className="w-full md:w-1/3 space-y-4">
                  <div className="relative aspect-square rounded-4xl overflow-hidden border border-border-default bg-input group">
                    {imagePreview ? (
                      <>
                        {imageLoading && (
                          <div className="absolute inset-0 bg-surface animate-pulse flex items-center justify-center z-10">
                            <div className="w-8 h-8 border-2 border-border-default border-t-text-primary rounded-full animate-spin" />
                          </div>
                        )}
                        <Image
                          src={imagePreview}
                          fill
                          className={`object-cover transition-opacity duration-500 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                          alt="Preview"
                          onLoad={() => setImageLoading(false)}
                          onError={() => setImageLoading(false)}
                        />
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FiCamera className="text-text-muted/30 text-4xl" />
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
                          setImageLoading(true);
                          setImagePreview(URL.createObjectURL(file));
                        }
                      }}
                      className="hidden"
                    />
                    <label
                      htmlFor="image-upload"
                      className="absolute inset-0 bg-overlay opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer backdrop-blur-sm"
                    >
                      <FiCamera className="text-text-primary text-2xl mb-2" />
                      <span className="text-[10px] font-black text-text-primary uppercase tracking-widest">Upload Visual</span>
                    </label>
                  </div>
                  <p className="text-[9px] text-text-muted uppercase tracking-wider text-center px-4 font-bold leading-relaxed">
                    Identity visuals support JPG, PNG. Resolution is auto-optimized for the archive.
                  </p>
                </div>

                <div className="flex-1 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Character Name</label>
                    <div className="relative group">
                      <FiType className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-text-primary transition-colors" />
                      <input
                        required
                        value={characterName}
                        onChange={(e) => setCharacterName(e.target.value)}
                        className="w-full bg-input border border-border-input rounded-2xl px-12 py-4 text-text-primary placeholder:text-text-muted/50 outline-none focus:border-border-hover focus:bg-surface-hover transition-all font-bold"
                        placeholder="Identity label..."
                      />
                    </div>
                  </div>



                  <div className="flex items-center justify-between p-4 bg-surface border border-border-default rounded-2xl group transition-all hover:border-orange-500/20">
                    <div className="flex items-center gap-3">
                      <FiAlertTriangle className={`transition-colors ${isNsfw ? "text-orange-500" : "text-text-muted"}`} />
                      <div>
                        <p className="text-[10px] font-black text-text-primary uppercase tracking-widest leading-none">Mature Content</p>
                        <p className="text-[9px] text-text-muted font-bold uppercase tracking-tighter mt-1">Mark character as NSFW</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsNsfw(!isNsfw)}
                      className={`relative w-12 h-6 rounded-full transition-all duration-300 ${isNsfw ? "bg-text-primary" : "bg-input border border-border-input"}`}
                    >
                      <motion.div
                        animate={{ x: isNsfw ? 26 : 2 }}
                        className={`absolute top-1 w-4 h-4 rounded-full shadow-lg ${isNsfw ? "bg-bg-page" : "bg-text-muted/50"}`}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Biography Section (Independent) */}
            <section className="bg-surface/50 border border-border-default rounded-[2.5rem] p-8 sm:p-10 backdrop-blur-3xl space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <FiAlignLeft className="text-text-muted" />
                <h3 className="text-xs font-black text-text-primary uppercase tracking-[0.3em]">Description</h3>
              </div>
              <DescriptionEditor
                value={characterBio}
                onChange={setCharacterBio}
                placeholder="Brief history for the central archives... (Supports HTML)"
                className="h-[500px]"
              />
            </section>

            {/* Tags Section */}
            <section className="bg-surface/50 border border-border-default rounded-[2.5rem] p-8 sm:p-10 backdrop-blur-3xl space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <FiHash className="text-text-muted" />
                <h3 className="text-xs font-black text-text-primary uppercase tracking-[0.3em]">Tags</h3>
              </div>
              <CharacterTags
                selectedOptions={selectedOptions}
                setSelectedOptions={setSelectedOptions}
              />
            </section>

            {/* Lorebooks Section */}
            <section className="bg-surface/50 border border-border-default rounded-[2.5rem] p-8 sm:p-10 backdrop-blur-3xl space-y-6 relative z-50">
              <div className="flex items-center gap-3 mb-2">
                <FiBook className="text-text-muted" />
                <h3 className="text-xs font-black text-text-primary uppercase tracking-[0.3em]">Lorebooks</h3>
              </div>
              <p className="text-[10px] text-text-muted uppercase tracking-widest font-black leading-relaxed">
                Link existing information modules to provide this entity with persistent world knowledge.
              </p>

              <LorebookSelector
                selectedIds={selectedLorebooks}
                onChange={setSelectedLorebooks}
                lorebooks={lorebooks || []}
              />
            </section>

            {/* Intelligence Configuration */}
            <section className="bg-surface/50 border border-border-default rounded-[2.5rem] p-8 sm:p-10 backdrop-blur-3xl space-y-8">
              <div className="flex items-center gap-3 mb-2">
                <FiCpu className="text-text-muted" />
                <h3 className="text-xs font-black text-text-primary uppercase tracking-[0.3em]">AI Configuration</h3>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-end px-1">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Character Persona</label>
                    <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">{getTokenCount(characterPersona)} Tokens</span>
                  </div>
                  <textarea
                    required
                    value={characterPersona}
                    onChange={(e) => setCharacterPersona(e.target.value)}
                    className="w-full bg-input shadow-inner border border-border-input rounded-3xl px-6 py-6 text-text-primary placeholder:text-text-muted/50 outline-none focus:border-border-hover focus:bg-surface-hover transition-all text-sm h-64 resize-none scrollbar-hide font-medium leading-relaxed"
                    placeholder="Describe traits, personality, speech patterns..."
                  />
                  <div className="bg-surface border border-border-default rounded-xl p-4 flex gap-3">
                    <div className="text-text-primary pt-0.5"><FiInfo size={14} /></div>
                    <p className="text-[10px] text-text-muted leading-relaxed font-bold">
                      Use <span className="text-text-primary">{`{char}`}</span> for character and <span className="text-text-primary">{`{user}`}</span> for the person chatting.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-end px-1">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Scenario</label>
                    <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">{getTokenCount(scenario)} Tokens</span>
                  </div>
                  <div className="relative">
                    <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      <div className="p-1 px-2 rounded-md bg-surface border border-border-default text-[8px] font-black text-text-muted uppercase tracking-widest backdrop-blur-md">ENTITY</div>
                    </div>
                    <div className="absolute inset-0 bg-surface-hover opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                    <FiMap className="absolute right-6 top-6 text-text-muted/10" />
                    <textarea
                      value={scenario}
                      onChange={(e) => setScenario(e.target.value)}
                      className="w-full bg-input border border-border-input rounded-3xl px-6 py-6 text-text-primary placeholder:text-text-muted/50 outline-none focus:border-border-hover focus:bg-surface-hover transition-all text-sm h-48 resize-none scrollbar-hide font-medium leading-relaxed"
                      placeholder="Context of the interaction or world state..."
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-end px-1">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Intro Message</label>
                    <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">{getTokenCount(initialMessage)} Tokens</span>
                  </div>
                  <div className="relative">
                    <FiMessageSquare className="absolute right-6 top-6 text-text-muted/10" />
                    <textarea
                      required
                      value={initialMessage}
                      onChange={(e) => setInitialMessage(e.target.value)}
                      className="w-full bg-input border border-border-input rounded-3xl px-6 py-6 text-text-primary placeholder:text-text-muted/50 outline-none focus:border-border-hover focus:bg-surface-hover transition-all text-sm h-48 resize-none scrollbar-hide font-medium leading-relaxed italic"
                      placeholder="The first greeting from the AI..."
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-end px-1">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Example Conversations</label>
                    <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">{getTokenCount(exampleConversations)} Tokens</span>
                  </div>
                  <div className="relative">
                    <textarea
                      value={exampleConversations}
                      onChange={(e) => setExampleConversations(e.target.value)}
                      className="w-full bg-input border border-border-input rounded-3xl px-6 py-6 text-text-primary placeholder:text-text-muted/50 outline-none focus:border-border-hover focus:bg-surface-hover transition-all text-sm h-64 resize-none scrollbar-hide font-medium leading-relaxed"
                      placeholder={`<START>\n{user}: Hello!\n{char}: Hey there, how's it going?\n<START>\n...`}
                    />
                  </div>
                  <div className="bg-surface border border-border-default rounded-xl p-4 flex gap-3">
                    <div className="text-text-primary pt-0.5"><FiInfo size={14} /></div>
                    <p className="text-[10px] text-text-muted leading-relaxed font-bold">
                      Use <span className="text-text-primary">{`<START>`}</span> to separate different conversation blocks. This helps the AI learn the specific speaking style.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Submit Section (Mobile Only) */}
            <div className="lg:hidden">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 rounded-3xl bg-text-primary text-page flex items-center justify-center gap-3 group transition-all font-black uppercase tracking-widest text-[10px]"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-bg-page/20 border-t-bg-page rounded-full animate-spin" />
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
                <div className="w-1.5 h-1.5 rounded-full bg-text-primary animate-pulse" />
                <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">Live Preview</h3>
              </div>
              <div className="scale-95 sm:scale-100 origin-top">
                <CharacterCard
                  authorName={user?.username || "You"}
                  characterName={characterName || "New Identity"}
                  image={imagePreview}
                  characterBio={characterBio || "Draft your character to see it reflected here..."}
                  isNsfw={isNsfw}
                  tags={selectedOptions.map(opt => ({ name: opt.label, id: opt.value }))}
                  disableHover
                />
              </div>
            </div>

            <div className="bg-surface/50 border border-border-default rounded-[2.5rem] p-8 backdrop-blur-3xl space-y-6">
              <div className="flex items-center gap-3">
                <FiZap className="text-text-muted" />
                <h3 className="text-[10px] font-black text-text-primary uppercase tracking-[0.2em]">Deployment Stats</h3>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-[11px] font-black uppercase tracking-tight">
                  <span className="text-text-muted">Total Tokens</span>
                  <span className="text-text-primary">{totalTokens}/2048</span>
                </div>
                <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((totalTokens / 2048) * 100, 100)}%` }}
                    className={`h-full transition-all duration-500 bg-text-primary shadow-sm ${totalTokens > 1500 ? 'bg-orange-500' : 'bg-text-primary'
                      }`}
                  />
                </div>
                <p className="text-[9px] text-text-muted leading-relaxed font-bold">
                  Characters under 2000 tokens respond faster and with higher accuracy.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 rounded-2xl bg-text-primary text-page flex items-center justify-center gap-3 group mt-6 font-black uppercase tracking-widest text-[10px] hover:bg-text-primary/90 transition-all"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-bg-page/20 border-t-bg-page rounded-full animate-spin" />
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
