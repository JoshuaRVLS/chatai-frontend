"use client";

import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Character, User } from "@/app/generated/prisma";
import CharacterCard from "../../CharacterCard/CharacterCard";
import Reveal from "../../Animations/Reveal";
import { CharactersData } from "@/@types/type";

const Characters = () => {
  const { isPending, error, data } = useQuery<CharactersData>({
    queryKey: ["characters"],
    queryFn: () =>
      fetch("/api/characters").then((res) =>
        res.json().then((data) => data.data)
      ),
  });
  if (isPending) return <p></p>;
  if (error) return <p>{error.message}</p>;

  return (
    <div className="flex flex-col gap-4 w-full pb-8">
      <h1 className="text-3xl">Community Characters</h1>
      <div className="flex flex-wrap w-full gap-4">
        {data.map((character) => (
          <Reveal key={character.id}>
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
              tags={character.tags}
            />
          </Reveal>
        ))}
      </div>
    </div>
  );
};

export default Characters;
