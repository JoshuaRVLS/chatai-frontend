"use client";

import { Character, CharacterTag, User } from "@/app/generated/prisma";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import React, { FormEvent, useContext, useEffect, useState } from "react";
import Dropdown from "../Dropdown/Dropdown";
import Comments from "../Comments/Comments";
import { useRouter } from "next/navigation";
import { bytesToBase64 } from "@/app/utils/image";
import { AuthContext } from "../../providers/AuthProvider";
import toast from "react-hot-toast";
import CharacterTags from "../CharacterTags/CharacterTags";
import CharacterCard from "../CharacterCard/CharacterCard";

const CharacterEdit = ({ id }: { id: string }) => {
  const [defaultImage, setDefaultImage] = useState<string | null>(null);
  const [image, setImage] = useState<File | string | null>(null);
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

  const { isPending, error, data } = useQuery<
    Character & {
      author: User;
      photo: { data: Uint8Array; mimetype: string; name: string };
      tags: CharacterTag[];
    }
  >({
    queryKey: ["character"],
    queryFn: () =>
      fetch(`/api/characters/${id}`).then((res) =>
        res.json().then((data) => data.data)
      ),
  });

  const router = useRouter();

  useEffect(() => {
    if (data) {
      setImage(bytesToBase64(data.photo));
      setCharacterName(data.name);
      setCharacterBio(data.bio);
      setCharacterPersona(data.persona);
      setScenario(data.scenario);
      setInitialMessage(data.introMessage);
      setSelectedOptions(
        data.tags.map((tag) => ({ label: tag.name, value: tag.id }))
      );
    }
  }, [data]);

  const handleSubmit = async (e: FormEvent) => {
    setLoading(true);
    e.preventDefault();

    const formData = new FormData();

    formData.append("characterId", id);
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

  const { user } = useContext(AuthContext);

  if (isPending) return <p></p>;
  if (error) return <p>{error.message}</p>;

  return (
    <div className="create-character-container">
      <form onSubmit={handleSubmit} className="create-character-form">
        <h1 className="text-3xl text-center w-full">Create a Character</h1>
        <div className="flex flex-col gap-1 w-full">
          <span>
            Foto<sup className="error">*</sup>
          </span>
          <input
            type="file"
            id="image-upload"
            accept="image/*"
            onChange={(e) => setImage(e.target.files![0])}
            className="hidden"
          />
          <label
            htmlFor="image-upload"
            className="w-full flex transition hover:opacity-70 cursor-pointer items-center justify-center border border-dashed rounded-md h-36"
          >
            {!image ? "Upload Image" : "Change Image"}
          </label>
          <ul>
            <li>Max size: 1MB</li>
            <li>Supported formats: jpg, jpeg, png</li>
            <li>
              Preview at the bottom for <b>MOBILE</b>
            </li>
          </ul>
        </div>
        <div className="flex flex-col gap-1 w-full">
          <span>
            Nama Karakter<sup className="error">*</sup>
          </span>
          <input
            required
            value={characterName}
            onChange={(e) => setCharacterName(e.target.value)}
            type="text"
            placeholder="Character Name"
            className="input"
          />
          <ul>
            <li>Nama karakter masukin sini. </li>
          </ul>
        </div>
        <div className="flex flex-col gap-1 w-full">
          <span>Panggilan Karakter</span>
          <input
            value={characterAlias}
            onChange={(e) => setCharacterAlias(e.target.value)}
            type="text"
            placeholder="Character Alias"
            className="input scrollbar-hide"
          />
          <ul>
            <li>Nama panggilan buat karakter. OPTIONAL</li>
          </ul>
        </div>
        <div className="flex flex-col gap-1 w-full">
          <span>
            Character Bio<sup className="error">*</sup>
          </span>
          <textarea
            value={characterBio}
            required
            onChange={(e) => setCharacterBio(e.target.value)}
            placeholder="Deskripsi tentang bot lu"
            className="input resize-none h-52 scrollbar-hide"
          />
          <ul>
            <li>
              Ga ngaruh ke AI nya nanti. Ini kayak ngasih penjelasan ke user
              lain doang.
            </li>
          </ul>
        </div>
        <div className="flex flex-col gap-1 w-full">
          <span>
            Character Persona<sup className="error">*</sup>
          </span>
          <textarea
            required
            value={characterPersona}
            onChange={(e) => setCharacterPersona(e.target.value)}
            placeholder="Persona character "
            className="input resize-none h-52 scrollbar-hide"
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
        </div>
        <div className="w-full flex flex-col gap-1">
          <span>Character Tags</span>
          <CharacterTags
            selectedOptions={selectedOptions}
            setSelectedOptions={setSelectedOptions}
          />
        </div>
        <div className="flex flex-col gap-1 w-full">
          <span>Scenario</span>
          <textarea
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            placeholder="Scenario buat AI"
            className="input resize-none h-52 scrollbar-hide"
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
        </div>
        <div className="flex flex-col gap-1 w-full">
          <span>
            Initial Message<sup className="error">*</sup>
          </span>
          <textarea
            required
            value={initialMessage}
            onChange={(e) => setInitialMessage(e.target.value)}
            placeholder="Initial Message"
            className="input resize-none h-52 scrollbar-hide"
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
        </div>
        <div className="flex flex-col gap-2 justify-center w-full">
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
          <button className="btn">
            {loading ? "Sedang diupdate..." : "Update"}
          </button>
        </div>
      </form>
      <div className="w-full md:w-auto flex justify-center">
        <div className="w-1/2 lg:w-full">
          {user && (
            <CharacterCard
              className=""
              authorName={user!.username}
              characterName={characterName}
              image={image}
              characterBio={characterBio}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CharacterEdit;
