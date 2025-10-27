import { CharacterTag, User } from "@/app/generated/prisma";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import defaultJPG from "@/public/default.jpg";
import { useRouter } from "next/navigation";

const CharacterCard = ({
  characterName,
  image,
  characterBio,
  authorName,
  characterId,
  className,
  tags,
  selectedTags,
}: {
  characterName: string;
  image: File | Blob | string | null;
  characterBio: string;
  authorName: string;
  characterId?: string;
  className?: string;
  tags?: { name: string; id: string }[];
  selectedTags?: { label: string; value: string }[];
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>("");
  const router = useRouter();

  useEffect(() => {
    if (!image) {
      setImageUrl(null);
      return;
    }

    // If image is already a URL string
    if (typeof image === "string") {
      console.log("Set image url");
      setImageUrl(image);
      return;
    }

    // If image is a File or Blob object
    const url = URL.createObjectURL(image);
    setImageUrl(url);

    // Clean up the object URL when component unmounts
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [image]);

  return (
    <div
      onClick={() => router.push(`/character/${characterId}`)}
      className={`${className ? className : "card"}`}
    >
      <div className="w-full flex flex-col gap-3 overflow-hidden">
        <span>{characterName}</span>
        <div className="w-full">
          {image && (
            <Image
              src={imageUrl || defaultJPG}
              width={50}
              height={50}
              className="object-cover w-full h-52"
              alt="Image"
            />
          )}
        </div>
        <span className="font-light text-purple-300">@{authorName}</span>
        <span className="font-light w-full wrap-break-word overflow-hidden">
          {characterBio}
        </span>
      </div>
      <div className="flex-col flex gap-2">
        <div className="flex gap-1 flex-wrap overflow-hidden">
          {tags?.length! > 0
            ? tags?.map((tag) => (
                <span className="p-2 border-borders border" key={tag.id}>
                  {tag.name}
                </span>
              ))
            : null}

          {selectedTags?.length! > 0
            ? selectedTags?.map((tag) => (
                <span className="p-2 border-borders border" key={tag.value}>
                  {tag.label}
                </span>
              ))
            : null}
        </div>
      </div>
    </div>
  );
};

export default CharacterCard;
