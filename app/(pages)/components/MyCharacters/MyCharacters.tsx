"use client";

import { useQuery } from "@tanstack/react-query";
import React, { useCallback, useContext } from "react";
import { AuthContext } from "../../providers/AuthProvider";
import Reveal from "../Animations/Reveal";
import CharacterCard from "../CharacterCard/CharacterCard";
import { CharactersData } from "@/@types/type";
import { FaPencilAlt, FaTrash } from "react-icons/fa";
import Link from "next/link";

const MyCharacters = () => {
  const { user } = useContext(AuthContext);
  const { isPending, data, error } = useQuery<CharactersData>({
    queryKey: ["myCharacters"],
    queryFn: () =>
      fetch(`/api/my-characters/${user?.id}`).then((res) =>
        res.json().then((data) => data.data)
      ),
    enabled: !!user?.id,
  });

  if (isPending) return <p></p>;
  if (error) return <p>{error.message}</p>;

  const deleteChar = async (characterId: string) => {
    try {
      await fetch(`/api/characters/${characterId}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full pb-8 pt-34 px-12">
      <h1 className="text-3xl">Your Characters</h1>
      <div className="flex flex-wrap w-full gap-4">
        {data.map((character) => (
          <Reveal key={character.id}>
            <div className="flex flex-col gap-2">
              <CharacterCard
                characterName={character.name}
                image={
                  character.photo?.data
                    ? `data:${character.photo.mimetype};base64,${Buffer.from(
                        Object.values(character.photo.data)
                      ).toString("base64")}`
                    : null
                }
                characterId={character.id}
                characterBio={character.bio}
                authorName={character.author.username}
              />
              <div className="flex gap-2">
                <Link
                  href={`/edit_character/${character.id}`}
                  className="btn-outline p-4"
                >
                  <FaPencilAlt width={40} height={40} />
                </Link>
                <span
                  onClick={() => deleteChar(character.id)}
                  className="error btn-outline"
                >
                  <FaTrash width={40} height={40} color="red" />
                </span>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
};

export default MyCharacters;
