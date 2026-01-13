"use client";

import { Character, CharacterTag, User } from "@/app/generated/prisma";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import React, { FormEvent, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "../../providers/AuthProvider";
import { toast } from '@/app/lib/toast';
import CharacterTags from "../CharacterTags/CharacterTags";
import LorebookSelector from "../LorebookSelector/LorebookSelector";
import CharacterCard from "../CharacterCard/CharacterCard";
import DescriptionEditor from "../DescriptionEditor/DescriptionEditor";
import { motion, AnimatePresence } from "motion/react";
import { useAuthAction } from "@/app/hooks/useAuthAction";
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
  FiAlignLeft
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
  const [imageLoading, setImageLoading] = useState<boolean>(false);

  const router = useRouter();
  const { user } = useContext(AuthContext);
  const { withAuth } = useAuthAction();

  const { isPending, error, data } = useQuery<
    Character & {
      author: User;
      photo: { id: string; mimetype: string; name: string };
      tags: CharacterTag[];
      lorebooks: { id: string; name: string }[];
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
    queryFn: () => fetch("/api/lorebooks?filter=library").then(res => res.json().then(d => d.data)),
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
  }, [data, id]);


  const handleSubmit = withAuth(async (e: FormEvent) => {
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
  });

  const handleGenerateImage = withAuth(async () => {
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
  });

  const getTokenCount = (text: string) => Math.floor(text.length / 4);
  const totalTokens = getTokenCount(characterPersona) + getTokenCount(scenario) + getTokenCount(initialMessage) + getTokenCount(exampleConversations);

  if (isPending) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-white/5 border-t-white rounded-full animate-spin" />
        <p className="text-white/20 font-black uppercase tracking-[0.3em] text-[10px]">Loading Character Data...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-red-400 font-black uppercase tracking-widest">{error.message}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-black pt-28 pb-20 px-6 sm:px-12 relative">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-white/2 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/1 blur-[100px] rounded-full" />
      </div>

      <div className="w-full relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="space-y-2">
            <Link
              href="/my_characters"
              className="flex items-center gap-2 text-white/30 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest mb-4 group"
            >
              <FiChevronLeft className="group-hover:-translate-x-1 transition-transform" /> Back to My Characters
            </Link>
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-10 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
              <h1 className="text-4xl sm:text-6xl font-black text-white italic tracking-tighter uppercase leading-none">
                Edit Character
              </h1>
            </div>
            <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.4em] ml-6">
              Character • ID: {id.slice(0, 8)}... • Modifying Configuration
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-zinc-900/30 border border-white/10 rounded-2xl px-6 py-3 backdrop-blur-xl">
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Estimated Density</p>
              <div className="flex items-center gap-2">
                <FiZap className="text-white/40" />
                <span className="text-lg font-black text-white italic">{totalTokens} <span className="text-xs text-zinc-600 not-italic">Tokens</span></span>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-10">
            <section className="bg-zinc-900/20 border border-white/10 rounded-[2.5rem] p-8 sm:p-10 backdrop-blur-3xl space-y-8">
              <div className="flex items-center gap-3 mb-2">
                <FiInfo className="text-white/40" />
                <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">Core Identity</h3>
              </div>

              <div className="flex flex-col md:flex-row gap-10">
                <div className="w-full md:w-1/3 space-y-4">
                  <div className="relative aspect-square rounded-4xl overflow-hidden border border-white/5 bg-white/5 group">
                    {imagePreview ? (
                      <>
                        {(imageLoading || isGeneratingImage) && (
                          <div className="absolute inset-0 bg-white/5 animate-pulse flex items-center justify-center z-10">
                            <div className="w-8 h-8 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
                          </div>
                        )}
                        <Image
                          src={imagePreview}
                          fill
                          className={`object-cover transition-opacity duration-500 ${imageLoading || isGeneratingImage ? 'opacity-0' : 'opacity-100'}`}
                          alt="Preview"
                          onLoad={() => setImageLoading(false)}
                          onError={() => setImageLoading(false)}
                        />
                      </>
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
                          setImageLoading(true);
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
                    disabled={isGeneratingImage || !characterName}
                    className="w-full py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-white hover:bg-white/10 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeneratingImage ? (
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <FiZap className="group-hover:scale-110 transition-transform text-white/40" />
                    )}
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Magic Generate</span>
                  </button>

                  <p className="text-[9px] text-white/20 uppercase tracking-wider text-center px-4 font-bold leading-relaxed">
                    Identity visuals support JPG, PNG. Resolution is auto-optimized for the archive.
                  </p>
                </div>

                <div className="flex-1 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Character Name</label>
                    <div className="relative group">
                      <FiType className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-white transition-colors" />
                      <input
                        required
                        value={characterName}
                        onChange={(e) => setCharacterName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-4 text-white placeholder:text-white/5 outline-none focus:border-white/20 focus:bg-white/10 transition-all font-bold"
                        placeholder="Identity label..."
                      />
                    </div>
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

            <section className="bg-zinc-900/20 border border-white/10 rounded-[2.5rem] p-8 sm:p-10 backdrop-blur-3xl space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <FiAlignLeft className="text-white/40" />
                <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">Public Biography</h3>
              </div>
              <DescriptionEditor
                value={characterBio}
                onChange={setCharacterBio}
                placeholder="Brief history for the central archives... (Supports HTML)"
                className="h-[500px]"
              />
            </section>

            <section className="bg-zinc-900/20 border border-white/10 rounded-[2.5rem] p-8 sm:p-10 backdrop-blur-3xl space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <FiHash className="text-white/40" />
                <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">Tags</h3>
              </div>
              <CharacterTags
                selectedOptions={selectedOptions}
                setSelectedOptions={setSelectedOptions}
              />
            </section>

            <section className="bg-zinc-900/20 border border-white/10 rounded-[2.5rem] p-8 sm:p-10 backdrop-blur-3xl space-y-6 relative z-50">
              <div className="flex items-center gap-3 mb-2">
                <FiBook className="text-white/40" />
                <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">Lorebooks</h3>
              </div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-black leading-relaxed">
                Link existing information modules to provide this entity with persistent world knowledge.
              </p>

              <LorebookSelector
                selectedIds={selectedLorebooks}
                onChange={setSelectedLorebooks}
                lorebooks={userLorebooks || []}
              />
            </section>

            <section className="bg-zinc-900/20 border border-white/10 rounded-[2.5rem] p-8 sm:p-10 backdrop-blur-3xl space-y-8">
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
                    className="w-full bg-white/1 shadow-inner border border-white/10 rounded-3xl px-6 py-6 text-white placeholder:text-white/5 outline-none focus:border-white/20 focus:bg-white/5 transition-all text-sm h-64 resize-none scrollbar-hide font-medium leading-relaxed"
                    placeholder="Describe traits, personality, speech patterns..."
                  />
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-3">
                    <div className="text-white pt-0.5"><FiInfo size={14} /></div>
                    <p className="text-[10px] text-white/40 leading-relaxed font-bold">
                      Use <span className="text-white">{`{char}`}</span> for character and <span className="text-white">{`{user}`}</span> for the person chatting.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-end px-1">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Scenario</label>
                    <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">{getTokenCount(scenario)} Tokens</span>
                  </div>
                  <div className="relative">
                    <FiMap className="absolute right-6 top-6 text-white/10" />
                    <textarea
                      value={scenario}
                      onChange={(e) => setScenario(e.target.value)}
                      className="w-full bg-white/1 border border-white/10 rounded-3xl px-6 py-6 text-white placeholder:text-white/5 outline-none focus:border-white/20 focus:bg-white/5 transition-all text-sm h-48 resize-none scrollbar-hide font-medium leading-relaxed"
                      placeholder="Context of the interaction or world state..."
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-end px-1">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Intro Message</label>
                    <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">{getTokenCount(initialMessage)} Tokens</span>
                  </div>
                  <div className="relative">
                    <FiMessageSquare className="absolute right-6 top-6 text-white/10" />
                    <textarea
                      required
                      value={initialMessage}
                      onChange={(e) => setInitialMessage(e.target.value)}
                      className="w-full bg-white/1 border border-white/10 rounded-3xl px-6 py-6 text-white placeholder:text-white/5 outline-none focus:border-white/20 focus:bg-white/5 transition-all text-sm h-48 resize-none scrollbar-hide font-medium leading-relaxed italic"
                      placeholder="The first greeting from the AI..."
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-end px-1">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Example Conversations</label>
                    <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">{getTokenCount(exampleConversations)} Tokens</span>
                  </div>
                  <div className="relative">
                    <textarea
                      value={exampleConversations}
                      onChange={(e) => setExampleConversations(e.target.value)}
                      className="w-full bg-white/1 border border-white/10 rounded-3xl px-6 py-6 text-white placeholder:text-white/5 outline-none focus:border-white/20 focus:bg-white/5 transition-all text-sm h-64 resize-none scrollbar-hide font-medium leading-relaxed"
                      placeholder={`<START>\n{user}: Hello!\n{char}: Hey there, how's it going?\n<START>\n...`}
                    />
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-3">
                    <div className="text-white pt-0.5"><FiInfo size={14} /></div>
                    <p className="text-[10px] text-white/40 leading-relaxed font-bold">
                      Use <span className="text-white">{`<START>`}</span> to separate different conversation blocks. This helps the AI learn the specific speaking style.
                    </p>
                  </div>
                </div>
              </div>
            </section>

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
                    <FiSave className="group-hover:scale-110 transition-transform" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="lg:col-span-4 lg:sticky lg:top-32 h-fit space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3 px-2">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
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
                  disableHover
                />
              </div>
            </div>

            <div className="bg-zinc-900/20 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-3xl space-y-6">
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
                    <FiSave className="group-hover:scale-110 transition-transform" />
                    <span>Save Changes</span>
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
