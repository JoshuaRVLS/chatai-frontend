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
        <motion.h1
          className="text-3xl font-bold col-span-2 text-center mb-6"
          variants={fieldVariants}
        >
          ✨ Create Your Character
        </motion.h1>

        {/* Left Side Form Fields */}
        <motion.div
          className="flex flex-col gap-6"
          variants={pageVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Image Upload */}
          <motion.div variants={fieldVariants} className="w-full">
            <label className="block mb-2 font-semibold">Character Image</label>
            <label
              htmlFor="image-upload"
              className="w-full border-2 border-dashed border-cyan-500/40 rounded-lg h-40 flex flex-col items-center justify-center cursor-pointer hover:border-cyan-400 transition-all"
            >
              <FaUpload className="text-cyan-400 mb-2 text-xl" />
              <span className="text-cyan-300 text-sm">
                {image ? image.name : "Upload an image"}
              </span>
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

          {/* Name */}
          <motion.div variants={fieldVariants}>
            <label className="block mb-2 font-semibold">Name</label>
            <motion.input
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              placeholder="Character name"
              required
              className="w-full bg-transparent border border-white/20 rounded-md px-4 py-3 focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(0,196,179,0.4)] outline-none transition-all"
            />
          </motion.div>

          {/* Alias */}
          <motion.div variants={fieldVariants}>
            <label className="block mb-2 font-semibold">Alias (optional)</label>
            <motion.input
              value={characterAlias}
              onChange={(e) => setCharacterAlias(e.target.value)}
              placeholder="Nickname"
              className="w-full bg-transparent border border-white/20 rounded-md px-4 py-3 focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(0,196,179,0.4)] outline-none transition-all"
            />
          </motion.div>

          {/* Bio */}
          <motion.div variants={fieldVariants}>
            <label className="block mb-2 font-semibold">Bio</label>
            <motion.textarea
              value={characterBio}
              onChange={(e) => setCharacterBio(e.target.value)}
              placeholder="Describe your character..."
              required
              className="w-full h-40 bg-transparent border border-white/20 rounded-md px-4 py-3 focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(0,196,179,0.4)] outline-none resize-none transition-all"
            />
          </motion.div>

          {/* Tags */}
          <motion.div variants={fieldVariants}>
            <label className="block mb-2 font-semibold">Tags</label>
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
          {/* Persona */}
          <motion.div variants={fieldVariants}>
            <label className="block mb-2 font-semibold">Persona</label>
            <motion.textarea
              value={characterPersona}
              onChange={(e) => setCharacterPersona(e.target.value)}
              placeholder="Describe personality, traits, and background..."
              required
              className="w-full h-40 bg-transparent border border-white/20 rounded-md px-4 py-3 focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(0,196,179,0.4)] outline-none resize-none transition-all"
            />
          </motion.div>

          {/* Scenario */}
          <motion.div variants={fieldVariants}>
            <label className="block mb-2 font-semibold">Scenario</label>
            <motion.textarea
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              placeholder="Where and when does this take place?"
              className="w-full h-40 bg-transparent border border-white/20 rounded-md px-4 py-3 focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(0,196,179,0.4)] outline-none resize-none transition-all"
            />
          </motion.div>

          {/* Initial Message */}
          <motion.div variants={fieldVariants}>
            <label className="block mb-2 font-semibold">Initial Message</label>
            <motion.textarea
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              placeholder="First message your character will send..."
              required
              className="w-full h-40 bg-transparent border border-white/20 rounded-md px-4 py-3 focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(0,196,179,0.4)] outline-none resize-none transition-all"
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
          whileHover={{
            scale: 1.05,
            boxShadow: "0 0 25px rgba(0,196,179,0.4)",
          }}
          whileTap={{ scale: 0.95 }}
          className="col-span-2 mt-8 bg-cyan-500 hover:bg-cyan-400 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
        >
          {loading ? (
            "Creating..."
          ) : (
            <>
              <FaPlus /> Create Character
            </>
          )}
        </motion.button>
      </motion.form>
    </motion.div>
  );
};

export default CreateCharacterPage;
