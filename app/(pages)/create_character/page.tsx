"use client";

import React, { FormEvent, useContext, useEffect, useState } from "react";
import CharacterCard from "../components/CharacterCard/CharacterCard";
import Dropdown from "../components/Dropdown/Dropdown";
import { AuthContext } from "../providers/AuthProvider";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import CharacterTags from "../components/CharacterTags/CharacterTags";
import { motion } from 'motion/react';

const page = () => {
  const [image, setImage] = useState<File | null>(null);
  const [characterName, setCharacterName] = useState<string>("");
  const [characterAlias, setCharacterAlias] = useState<string>("");
  const [characterBio, setCharacterBio] = useState<string>("");
  const [characterPersona, setCharacterPersona] = useState<string>("");
  const [scenario, setScenario] = useState<string>("");
  const [initialMessage, setInitialMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedOptions, setSelectedOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const router = useRouter();

  const { user } = useContext(AuthContext);

  const handleSubmit = async (e: FormEvent) => {
    setLoading(true);
    e.preventDefault();

    const formData = new FormData();

    formData.append("image", image!);
    formData.append("characterName", characterName);
    formData.append("characterAlias", characterAlias);
    formData.append("characterBio", characterBio);
    formData.append("characterPersona", characterPersona);
    formData.append("scenario", scenario);
    formData.append("initialMessage", initialMessage);
    formData.append("userId", user?.id as string);
    formData.append("tags", JSON.stringify(selectedOptions));

    try {
      const response = await fetch("/api/characters", {
        method: "POST",
        body: formData,
      });

      setLoading(false);

      if (!response.ok) {
        console.log(response);
        return;
      }
      const data = await response.json();
      toast.success(data.message);
      router.push("/");
    } catch (error) {
      setLoading(false);
      console.log(error);
    }
  };

  // Animation variants for staggered entrance
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <motion.div 
      className="create-character-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.form 
        onSubmit={handleSubmit} 
        className="create-character-form"
        variants={containerVariants}
      >
        <motion.h1 
          className="text-3xl text-center w-full"
          variants={itemVariants}
        >
          Create a Character
        </motion.h1>

        {/* Image Upload */}
        <motion.div 
          className="flex flex-col gap-1 w-full"
          variants={itemVariants}
        >
          <span>
            Foto<sup className="error">*</sup>
          </span>
          <input
            type="file"
            id="image-upload"
            accept="image/*"
            required
            onChange={(e) => setImage(e.target.files![0])}
            className="hidden"
          />
          <motion.label
            htmlFor="image-upload"
            className="w-full flex transition hover:opacity-70 cursor-pointer items-center justify-center border border-dashed rounded-md h-36"
            whileHover={{ scale: 1.02, borderColor: "var(--color-primary-button)" }}
            whileTap={{ scale: 0.98 }}
          >
            {!image ? "Upload Image" : "Change Image"}
          </motion.label>
          <ul>
            <li>Max size: 1MB</li>
            <li>Supported formats: jpg, jpeg, png</li>
            <li>
              Preview at the bottom for <b>MOBILE</b>
            </li>
          </ul>
        </motion.div>

        {/* Character Name */}
        <motion.div 
          className="flex flex-col gap-1 w-full"
          variants={itemVariants}
        >
          <span>
            Nama Karakter<sup className="error">*</sup>
          </span>
          <motion.input
            required
            value={characterName}
            onChange={(e) => setCharacterName(e.target.value)}
            type="text"
            placeholder="Character Name"
            className="input"
            whileFocus={{ scale: 1.02, boxShadow: "0 0 10px rgba(0, 196, 179, 0.3)" }}
            transition={{ duration: 0.2 }}
          />
          <ul>
            <li>Nama karakter masukin sini.</li>
          </ul>
        </motion.div>

        {/* Character Alias */}
        <motion.div 
          className="flex flex-col gap-1 w-full"
          variants={itemVariants}
        >
          <span>Panggilan Karakter</span>
          <motion.input
            value={characterAlias}
            onChange={(e) => setCharacterAlias(e.target.value)}
            type="text"
            placeholder="Character Alias"
            className="input scrollbar-hide"
            whileFocus={{ scale: 1.02, boxShadow: "0 0 10px rgba(0, 196, 179, 0.3)" }}
            transition={{ duration: 0.2 }}
          />
          <ul>
            <li>Nama panggilan buat karakter. OPTIONAL</li>
          </ul>
        </motion.div>

        {/* Character Bio */}
        <motion.div 
          className="flex flex-col gap-1 w-full"
          variants={itemVariants}
        >
          <span>
            Character Bio<sup className="error">*</sup>
          </span>
          <motion.textarea
            value={characterBio}
            required
            onChange={(e) => setCharacterBio(e.target.value)}
            placeholder="Deskripsi tentang bot lu"
            className="input resize-none h-52 scrollbar-hide"
            whileFocus={{ scale: 1.02, boxShadow: "0 0 10px rgba(0, 196, 179, 0.3)" }}
            transition={{ duration: 0.2 }}
          />
          <ul>
            <li>
              Ga ngaruh ke AI nya nanti. Ini kayak ngasih penjelasan ke user
              lain doang.
            </li>
          </ul>
        </motion.div>

        {/* Character Persona */}
        <motion.div 
          className="flex flex-col gap-1 w-full"
          variants={itemVariants}
        >
          <span>
            Character Persona<sup className="error">*</sup>
          </span>
          <motion.textarea
            required
            value={characterPersona}
            onChange={(e) => setCharacterPersona(e.target.value)}
            placeholder="Persona character"
            className="input resize-none h-52 scrollbar-hide"
            whileFocus={{ scale: 1.02, boxShadow: "0 0 10px rgba(0, 196, 179, 0.3)" }}
            transition={{ duration: 0.2 }}
          />
          <ul>
            <li>
              <span>{"{char}"} untuk format karakter nya, contoh</span>
              <span>
                {"{user}"} untuk format user nya, contoh:{" "}
                {"{char} adalah sahabat {user}"}
              </span>
            </li>
            <li>
              Personality AI lu, <b>sifat</b>, <b>fisik</b>, <b>nama</b>,{" "}
              <b>latar belakang</b>, dan banyak lagi. Semua jelaskan disini.
            </li>
            <li>
              {Math.floor(characterPersona.length / 4)} Token ( 1 token = 4
              huruf )
            </li>
          </ul>
        </motion.div>

        {/* Character Tags */}
        <motion.div 
          className="w-full flex flex-col gap-1"
          variants={itemVariants}
        >
          <span>Character Tags</span>
          <CharacterTags
            selectedOptions={selectedOptions}
            setSelectedOptions={setSelectedOptions}
          />
        </motion.div>

        {/* Scenario */}
        <motion.div 
          className="flex flex-col gap-1 w-full"
          variants={itemVariants}
        >
          <span>Scenario</span>
          <motion.textarea
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            placeholder="Scenario buat AI"
            className="input resize-none h-52 scrollbar-hide"
            whileFocus={{ scale: 1.02, boxShadow: "0 0 10px rgba(0, 196, 179, 0.3)" }}
            transition={{ duration: 0.2 }}
          />
          <ul>
            <li>
              Konteks nya lagi ngapain, latar belakang tempat seperti apa.
              Contoh kayak misalkan dunia magic, Lu kasih info nya disini.
              Misalkan tinggal di indonesia, jakarta tahun 1999.
            </li>
            <li>
              {Math.floor(scenario.length / 4)} Token ( 1 token = 4 huruf )
            </li>
          </ul>
        </motion.div>

        {/* Initial Message */}
        <motion.div 
          className="flex flex-col gap-1 w-full"
          variants={itemVariants}
        >
          <span>
            Initial Message<sup className="error">*</sup>
          </span>
          <motion.textarea
            required
            value={initialMessage}
            onChange={(e) => setInitialMessage(e.target.value)}
            placeholder="Initial Message"
            className="input resize-none h-52 scrollbar-hide"
            whileFocus={{ scale: 1.02, boxShadow: "0 0 10px rgba(0, 196, 179, 0.3)" }}
            transition={{ duration: 0.2 }}
          />
          <ul>
            <li>
              ini tuh kayak chat pertama lu. Contoh: **Di suatu cafe yang ramai
              dengan pengunjung**
            </li>
            <li>
              {Math.floor(initialMessage.length / 4)} Token ( 1 token = 4 huruf
              )
            </li>
          </ul>
        </motion.div>

        {/* Submit Section */}
        <motion.div 
          className="flex flex-col gap-2 justify-center w-full"
          variants={itemVariants}
        >
          <span>
            Token:{" "}
            {Math.floor(
              (characterPersona.length +
                scenario.length +
                initialMessage.length) /
                4
            )}
            , Permenant Token:{" "}
            {Math.floor((characterPersona.length + scenario.length) / 4)}
          </span>
          <motion.button 
            className="btn"
            whileHover={{ scale: 1.05, boxShadow: "0 10px 20px rgba(0, 196, 179, 0.3)" }}
            whileTap={{ scale: 0.95 }}
            disabled={loading}
          >
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                ⏳
              </motion.div>
            ) : (
              "Buat Character"
            )}
          </motion.button>
        </motion.div>
      </motion.form>

     </motion.div>
  );
};

export default page;
