"use client";

import React, { FormEvent, useContext, useState } from "react";
import { motion, Variants } from "motion/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { AuthContext } from "../providers/AuthProvider";
import CharacterTags from "../components/CharacterTags/CharacterTags";
import CharacterCard from "../components/CharacterCard/CharacterCard";
import { FaPlus, FaUpload } from "react-icons/fa";

type TagOption = { label: string; value: string };

const CreateCharacterPage: React.FC = () => {
  const { user } = useContext(AuthContext);
  const router = useRouter();

  const [image, setImage] = useState<File | null>(null);
  const [characterName, setCharacterName] = useState("");
  const [characterAlias, setCharacterAlias] = useState("");
  const [characterBio, setCharacterBio] = useState("");
  const [characterPersona, setCharacterPersona] = useState("");
  const [scenario, setScenario] = useState("");
  const [initialMessage, setInitialMessage] = useState("");
  const [selectedOptions, setSelectedOptions] = useState<TagOption[]>([]);
  const [loading, setLoading] = useState(false);

  // --- Animation Variants ---
  const pageVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut", staggerChildren: 0.05 },
    },
  };

  const fieldVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  // --- Handle Submit ---
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();

    formData.append("image", image!);
    formData.append("characterName", characterName);
    formData.append("characterAlias", characterAlias);
    formData.append("characterBio", characterBio);
    formData.append("characterPersona", characterPersona);
    formData.append("scenario", scenario);
    formData.append("initialMessage", initialMessage);
    formData.append("userId", user?.id || "");
    formData.append("tags", JSON.stringify(selectedOptions));

    try {
      const response = await fetch("/api/characters", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to create character");

      const data = await response.json();
      toast.success(data.message);
      router.push("/");
    } catch (err) {
      console.error(err);
      toast.error("Failed to create character");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="relative min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0d0d14] to-[#050507] text-white flex justify-center items-start pt-24 px-6 pb-20 overflow-hidden"
    >
      {/* Glowing Background Blobs */}
      <motion.div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-cyan-500/20 blur-[150px]"
        animate={{ y: [0, 30, 0], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-purple-600/20 blur-[180px]"
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Main Form Container */}
      <motion.form
        onSubmit={handleSubmit}
        className="relative z-10 max-w-4xl w-full flex flex-col lg:grid lg:grid-cols-2 gap-10 backdrop-blur-xl border border-white/10 bg-white/5 p-8 rounded-2xl shadow-[0_0_40px_rgba(0,196,179,0.1)]"
      >
        <div className="lg:col-span-2 text-center mb-8 space-y-4">
          <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase italic">
            Create Character
          </h1>
          <p className="text-white/40 text-xs font-black uppercase tracking-[0.3em]">Design a unique artificial intelligence profile.</p>
        </div>

        {/* Left Side Form Fields */}
        <motion.div
          className="flex flex-col gap-6"
          variants={pageVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={fieldVariants} className="w-full space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Character Visual</label>
            <label
              htmlFor="image-upload"
              className="group relative w-full border-2 border-dashed border-white/5 bg-white/[0.02] rounded-3xl h-52 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-white/[0.05] transition-all overflow-hidden"
            >
              {image ? (
                <div className="absolute inset-0">
                  <img src={URL.createObjectURL(image)} className="w-full h-full object-cover opacity-40" alt="Preview" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-sm">
                    <FaUpload className="text-primary mb-2 text-xl" />
                    <span className="text-white font-bold text-sm">{image.name}</span>
                    <span className="text-white/40 text-[9px] uppercase font-black mt-1">Click to change</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <FaUpload className="text-white/20 group-hover:text-primary transition-colors text-2xl" />
                  </div>
                  <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">
                    Upload Identity Image
                  </span>
                  <span className="text-white/20 text-[9px] mt-1 font-medium">PNG, JPG or WebP</span>
                </>
              )}
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                required
                className="hidden"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
              />
            </label>
          </motion.div>

          <motion.div variants={fieldVariants} className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Identity Name</label>
            <motion.input
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              placeholder="Full name of the character"
              required
              className="input-modern"
            />
          </motion.div>

          <motion.div variants={fieldVariants} className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Callsign / Alias</label>
            <motion.input
              value={characterAlias}
              onChange={(e) => setCharacterAlias(e.target.value)}
              placeholder="Known as..."
              className="input-modern"
            />
          </motion.div>

          <motion.div variants={fieldVariants} className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Public Biography</label>
            <motion.textarea
              value={characterBio}
              onChange={(e) => setCharacterBio(e.target.value)}
              placeholder="A brief history or summary..."
              required
              className="input-modern h-32 resize-none"
            />
          </motion.div>

          <motion.div variants={fieldVariants} className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Classification Tags</label>
            <CharacterTags
              selectedOptions={selectedOptions}
              setSelectedOptions={setSelectedOptions}
            />
          </motion.div>
        </motion.div>

        {/* Right Side */}
        <motion.div
          className="flex flex-col gap-6"
          variants={pageVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={fieldVariants} className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Internal Persona</label>
            <motion.textarea
              value={characterPersona}
              onChange={(e) => setCharacterPersona(e.target.value)}
              placeholder="Personality, traits, and hidden knowledge..."
              required
              className="input-modern h-40 resize-none"
            />
          </motion.div>

          <motion.div variants={fieldVariants} className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Environmental Scenario</label>
            <motion.textarea
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              placeholder="Describe the current context or world setting..."
              className="input-modern h-40 resize-none"
            />
          </motion.div>

          <motion.div variants={fieldVariants} className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Greeting Protocol</label>
            <motion.textarea
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              placeholder="First message to establish connection..."
              required
              className="input-modern h-40 resize-none"
            />
          </motion.div>
        </motion.div>

        {/* Live Character Preview */}
        {characterName && (
          <motion.div
            className="col-span-2 flex justify-center mt-4"
            variants={fieldVariants}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <CharacterCard
              characterName={characterName}
              characterBio={characterBio}
              authorName={user?.username || "You"}
              tags={selectedOptions.map((t) => ({
                name: t.label,
                id: t.value,
              }))} // ✅ correct type
              characterId="preview"
              image={image ? URL.createObjectURL(image) : null}
            />
          </motion.div>
        )}

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn-primary col-span-2 mt-8 py-5 flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-xs font-black shadow-[0_0_40px_rgba(56,189,248,0.2)]"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
          ) : (
            <>
              <FaPlus /> Initialize Character
            </>
          )}
        </motion.button>
      </motion.form>
    </motion.div>
  );
};

export default CreateCharacterPage;
