"use client";

import { Character, CharacterTag, User } from "@/app/generated/prisma";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import React, { FormEvent, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { bytesToBase64 } from "@/app/utils/image";
import { AuthContext } from "../../providers/AuthProvider";
import toast from "react-hot-toast";
import CharacterTags from "../CharacterTags/CharacterTags";
import CharacterCard from "../CharacterCard/CharacterCard";
import { motion, AnimatePresence } from "motion/react";
import {
  FiCamera,
  FiInfo,
  FiType,
  FiCpu,
  FiMap,
  FiMessageSquare,
  FiSave,
  FiHash,
  FiZap,
  FiChevronLeft,
  FiBook,
  FiAlertTriangle,
  FiGlobe
} from "react-icons/fi";
import Link from "next/link";

const CharacterEdit = ({ id }: { id: string }) => {
  const [image, setImage] = useState<File | string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [characterName, setCharacterName] = useState<string>("");
  const [characterBio, setCharacterBio] = useState<string>("");
  const [characterPersona, setCharacterPersona] = useState<string>("");
  const [scenario, setScenario] = useState<string>("");
  const [initialMessage, setInitialMessage] = useState<string>("");
  const [exampleConversations, setExampleConversations] = useState<string>("");
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedOptions, setSelectedOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [selectedLorebooks, setSelectedLorebooks] = useState<string[]>([]);
  const [isNsfw, setIsNsfw] = useState<boolean>(false);
  const [importUrl, setImportUrl] = useState<string>("");
  const [isImporting, setIsImporting] = useState<boolean>(false);

  const router = useRouter();
  const { user } = useContext(AuthContext);

  const { isPending, error, data } = useQuery<
    Character & {
      author: User;
      photo: { id: string; mimetype: string; name: string };
      tags: CharacterTag[];
      lorebooks: { id: string }[];
    }
  >({
    queryKey: ["character", id],
    queryFn: () =>
      fetch(`/api/characters/${id}`).then((res) =>
        res.json().then((data) => data.data)
      ),
  });

  const { data: userLorebooks } = useQuery<any[]>({
    queryKey: ["lorebooks"],
    queryFn: () => fetch("/api/lorebooks").then(res => res.json().then(d => d.data)),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (data) {
      const imageUrl = `/api/image/${id}`;
      setImage(imageUrl);
      setImagePreview(imageUrl);
      setCharacterName(data.name);
      setCharacterBio(data.bio);
      setCharacterPersona(data.persona);
      setScenario(data.scenario);
      setInitialMessage(data.introMessage);
      setExampleConversations(data.exampleConversations || "");
      setSelectedOptions(
        data.tags.map((tag) => ({ label: tag.name, value: tag.id }))
      );
      setSelectedLorebooks(data.lorebooks.map(lb => lb.id));
      setIsNsfw(data.isNsfw);
    }
  }, [data]);

  const handleChubImport = async () => {
    if (!importUrl) {
      toast.error("Please enter a Chub.ai URL");
      return;
    }

    setIsImporting(true);
    const id = toast.loading("Syncing with external intelligence...");

    try {
      const response = await fetch("/api/import/chub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      const { data: chubData } = result;
      setCharacterName(chubData.name);
      setCharacterBio(chubData.bio);
      setCharacterPersona(chubData.persona);
      setScenario(chubData.scenario);
      setInitialMessage(chubData.introMessage);
      setExampleConversations(chubData.exampleConversations || "");
      setIsNsfw(chubData.isNsfw);

      if (chubData.avatarBase64) {
        setImagePreview(chubData.avatarBase64);
        // Convert base64 to File
        const res = await fetch(chubData.avatarBase64);
        const blob = await res.blob();
        const file = new File([blob], "chub_import.png", { type: "image/png" });
        setImage(file);
      }

      toast.success("Identity core synchronized", { id });
      setImportUrl("");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Synchronization failed", { id });
    } finally {
      setIsImporting(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    setLoading(true);
    e.preventDefault();

    const formData = new FormData();
    formData.append("characterId", id);
    if (image instanceof File) {
      formData.append("image", image);
    } else if (typeof image === 'string') {
      formData.append("image", image);
    }
    formData.append("characterName", characterName);
    formData.append("characterBio", characterBio);
    formData.append("characterPersona", characterPersona);
    formData.append("scenario", scenario);
    formData.append("initialMessage", initialMessage);
    formData.append("exampleConversations", exampleConversations);
    formData.append("userId", user?.id as string);
    formData.append("tags", JSON.stringify(selectedOptions));
    formData.append("lorebooks", JSON.stringify(selectedLorebooks));
    formData.append("isNsfw", isNsfw.toString());

    try {
      const response = await fetch("/api/characters", {
        method: "POST",
        body: formData,
      });

      setLoading(false);

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message);
        router.push("/my_characters");
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to update character");
      }
    } catch (error) {
      setLoading(false);
      console.error(error);
      toast.error("An error occurred");
    }
  };

  const handleGenerateImage = async () => {
    if (!characterName || !characterBio) {
      toast.error("Please provide at least a name and bio first");
      return;
    }

    setIsGeneratingImage(true);
    const toastId = toast.loading("Synthesizing character visual...");

    try {
      const prompt = encodeURIComponent(`${characterName}, ${characterBio.slice(0, 200)}, highly detailed, masterpiece, anime style, high quality`);
      const seed = Math.floor(Math.random() * 1000000);
      const imageUrl = `https://pollinations.ai/p/${prompt}?width=1024&height=1024&seed=${seed}&model=flux&nologo=true`;

      // Fetch the image and convert to blob/file
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], `${characterName.toLowerCase().replace(/\s+/g, "_")}.jpg`, { type: "image/jpeg" });

      setImage(file);
      setImagePreview(URL.createObjectURL(file));

      toast.success("Visual synthesized successfully!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Vision synthesis failed", { id: toastId });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const getTokenCount = (text: string) => Math.floor(text.length / 4);
  const permanentTokens = getTokenCount(characterPersona) + getTokenCount(scenario) + getTokenCount(exampleConversations);
  const totalTokens = permanentTokens + getTokenCount(initialMessage);

  if (isPending) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-white/20 font-black uppercase tracking-[0.3em] text-[10px]">Loading Character Data...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <p className="text-red-400 font-black uppercase tracking-widest">{error.message}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] pt-28 pb-20 px-6 sm:px-12 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 blur-[100px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Navigation / Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="space-y-2">
            <Link
              href="/my_characters"
              className="flex items-center gap-2 text-white/30 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest mb-4 group"
            >
              <FiChevronLeft className="group-hover:-translate-x-1 transition-transform" /> Back to My Characters
            </Link>
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-10 bg-primary rounded-full shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
              <h1 className="text-4xl sm:text-6xl font-black text-white italic tracking-tighter uppercase leading-none">
                Edit Character
              </h1>
            </div>
            <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.4em] ml-6">
              Character • ID: {id.slice(0, 8)}... • Modifying Configuration
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-3 backdrop-blur-xl">
              <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Token Usage</p>
              <div className="flex items-center gap-2">
                <FiZap className="text-primary animate-pulse" />
                <span className="text-lg font-black text-white italic">{totalTokens} <span className="text-xs text-white/20 not-italic">Tokens</span></span>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Editing Column */}
          <div className="lg:col-span-8 space-y-10">
            {/* Quick Import Section */}
            <section className="bg-gradient-to-tr from-primary/10 to-purple-500/10 border border-primary/20 rounded-[2.5rem] p-8 backdrop-blur-3xl space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FiGlobe className="text-primary" />
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">Intelligence Sync</h3>
                    <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest mt-1">Update from external databases (Chub.ai)</p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-primary/20 rounded-full border border-primary/30">
                  <p className="text-[8px] font-black text-primary uppercase">Alpha Feature</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="relative flex-1 group">
                  <input
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    placeholder="https://chub.ai/characters/creator/slug..."
                    className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/10 outline-none focus:border-primary/50 transition-all text-xs font-bold"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleChubImport}
                  disabled={isImporting}
                  className="px-8 py-4 bg-primary text-black rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isImporting ? (
                    <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      <FiZap /> Sync
                    </>
                  )}
                </button>
              </div>
            </section>

            {/* Image & Identity Section */}
            <section className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 sm:p-10 backdrop-blur-3xl space-y-8">
              <div className="flex items-center gap-3 mb-2">
                <FiInfo className="text-primary" />
                <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">Core Identity</h3>
              </div>

              <div className="flex flex-col md:flex-row gap-10">
                <div className="w-full md:w-1/3 space-y-4">
                  <div className="relative aspect-square rounded-[2rem] overflow-hidden border border-white/10 bg-white/5 group">
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
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">Update Visuals</span>
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateImage}
                    disabled={isGeneratingImage || !characterName || !characterBio}
                    className="w-full py-3 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center gap-3 text-primary hover:bg-primary/20 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeneratingImage ? (
                      <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                    ) : (
                      <FiZap className="group-hover:scale-110 transition-transform" />
                    )}
                    <span className="text-[10px] font-black uppercase tracking-widest">Magic Generate</span>
                  </button>

                  <p className="text-[9px] text-white/20 uppercase tracking-wider text-center px-4 font-bold leading-relaxed">
                    Image uploads support JPG, PNG up to 1MB. Use Magic Generate for AI-drawn visuals.
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
                        placeholder="Name..."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Archive Bio</label>
                    <textarea
                      required
                      value={characterBio}
                      onChange={(e) => setCharacterBio(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/5 outline-none focus:border-primary/50 focus:bg-white/10 transition-all text-sm h-32 resize-none scrollbar-hide font-medium leading-relaxed"
                      placeholder="Public description for the central archives..."
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
                      className={`relative w-12 h-6 rounded-full transition-all duration-300 ${isNsfw ? "bg-orange-500" : "bg-white/10 border border-white/5"}`}
                    >
                      <motion.div
                        animate={{ x: isNsfw ? 26 : 2 }}
                        className={`absolute top-1 w-4 h-4 rounded-full shadow-lg ${isNsfw ? "bg-white" : "bg-white/20"}`}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Tags Section */}
            <section className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 sm:p-10 backdrop-blur-3xl space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <FiHash className="text-primary" />
                <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">Character Tags</h3>
              </div>
              <CharacterTags
                selectedOptions={selectedOptions}
                setSelectedOptions={setSelectedOptions}
              />
            </section>

            {/* Lorebooks Section */}
            <section className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 sm:p-10 backdrop-blur-3xl space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <FiBook className="text-primary" />
                <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">Lorebooks</h3>
              </div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-black leading-relaxed">
                Link existing information modules to provide this entity with persistent world knowledge.
              </p>

              <div className="flex flex-wrap gap-2">
                {userLorebooks && userLorebooks.length > 0 ? (
                  userLorebooks.map(lb => (
                    <button
                      key={lb.id}
                      type="button"
                      onClick={() => {
                        setSelectedLorebooks(prev =>
                          prev.includes(lb.id) ? prev.filter(id => id !== lb.id) : [...prev, lb.id]
                        );
                      }}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${selectedLorebooks.includes(lb.id)
                        ? "bg-primary text-slate-950 border-primary shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                        : "bg-white/5 text-white/40 border-white/10 hover:border-white/20"
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
            <section className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 sm:p-10 backdrop-blur-3xl space-y-8">
              <div className="flex items-center gap-3 mb-2">
                <FiCpu className="text-primary" />
                <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">AI configuration</h3>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-end px-1">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Character Persona</label>
                    <span className="text-[9px] font-black text-primary uppercase tracking-widest">{getTokenCount(characterPersona)} Tokens</span>
                  </div>
                  <textarea
                    required
                    value={characterPersona}
                    onChange={(e) => setCharacterPersona(e.target.value)}
                    className="w-full bg-white/1 shadow-inner border border-white/10 rounded-3xl px-6 py-6 text-white placeholder:text-white/5 outline-none focus:border-primary/50 focus:bg-white/5 transition-all text-sm h-64 resize-none scrollbar-hide font-medium leading-relaxed"
                    placeholder="Describe {char}'s personality, physical traits, background..."
                  />
                  <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex gap-3">
                    <div className="text-primary pt-0.5"><FiInfo size={14} /></div>
                    <p className="text-[10px] text-white/40 leading-relaxed font-bold">
                      Use <span className="text-primary">{`{char}`}</span> for the character and <span className="text-primary">{`{user}`}</span> for the person chatting. Example: <span className="italic text-white/60">{`{char} is a rival of {user}`}</span>.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-end px-1">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Environmental Scenario</label>
                    <span className="text-[9px] font-black text-primary uppercase tracking-widest">{getTokenCount(scenario)} Tokens</span>
                  </div>
                  <div className="relative">
                    <FiMap className="absolute right-6 top-6 text-white/10" />
                    <textarea
                      value={scenario}
                      onChange={(e) => setScenario(e.target.value)}
                      className="w-full bg-white/1 border border-white/10 rounded-3xl px-6 py-6 text-white placeholder:text-white/5 outline-none focus:border-primary/50 focus:bg-white/5 transition-all text-sm h-48 resize-none scrollbar-hide font-medium leading-relaxed"
                      placeholder="Describe the current context or world setting..."
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
                      placeholder="The simulation's first response..."
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-end px-1">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Example Conversations</label>
                    <span className="text-[9px] font-black text-primary uppercase tracking-widest">{getTokenCount(exampleConversations)} Tokens</span>
                  </div>
                  <div className="relative">
                    <textarea
                      value={exampleConversations}
                      onChange={(e) => setExampleConversations(e.target.value)}
                      className="w-full bg-white/1 border border-white/10 rounded-3xl px-6 py-6 text-white placeholder:text-white/5 outline-none focus:border-primary/50 focus:bg-white/5 transition-all text-sm h-64 resize-none scrollbar-hide font-medium leading-relaxed"
                      placeholder={`<START>\n{user}: Hello!\n{char}: Hey there, how's it going?\n<START>\n...`}
                    />
                  </div>
                  <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex gap-3">
                    <div className="text-primary pt-0.5"><FiInfo size={14} /></div>
                    <p className="text-[10px] text-white/40 leading-relaxed font-bold">
                      Use <span className="text-primary">{`<START>`}</span> to separate different conversation blocks. This helps the AI learn the specific speaking style of the character.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Submit Section (Mobile Only) */}
            <div className="lg:hidden">
              <button
                disabled={loading}
                className="btn-primary w-full py-5 rounded-[1.5rem] flex items-center justify-center gap-3 group transition-all"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <FiSave className="group-hover:scale-110 transition-transform" />
                    <span className="font-black uppercase tracking-widest text-xs">Save Changes</span>
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
                <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Preview</h3>
              </div>
              <div className="scale-95 sm:scale-100 origin-top">
                <CharacterCard
                  authorName={user?.username || "Architect"}
                  characterName={characterName || "New Character"}
                  image={imagePreview}
                  characterBio={characterBio || "Describe your entity to see it reflected here..."}
                  isNsfw={isNsfw}
                  tags={selectedOptions.map(opt => ({ name: opt.label, id: opt.value }))}
                />
              </div>
            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-3xl space-y-6">
              <div className="flex items-center gap-3">
                <FiZap className="text-primary" />
                <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Usage</h3>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-[11px] font-black uppercase tracking-tight">
                  <span className="text-white/30">Total Tokens</span>
                  <span className="text-white">{totalTokens}/2048</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((totalTokens / 2048) * 100, 100)}%` }}
                    className={`h-full transition-all duration-500 shadow-[0_0_10px_rgba(34,211,238,0.5)] ${totalTokens > 1500 ? 'bg-orange-500' : 'bg-primary'
                      }`}
                  />
                </div>
                <p className="text-[9px] text-white/20 leading-relaxed font-bold">
                  High token density results in deeper context but may increase simulation latency.
                </p>
              </div>

              <button
                disabled={loading}
                className="btn-primary w-full py-5 rounded-2xl flex items-center justify-center gap-3 group mt-6"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <FiSave className="group-hover:scale-110 transition-transform" />
                    <span className="font-black uppercase tracking-widest text-xs">Commit Changes</span>
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

export default CharacterEdit;
