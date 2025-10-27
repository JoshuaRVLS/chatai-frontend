// Character Card
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

    if (typeof image === "string") {
      setImageUrl(image);
      return;
    }

    const url = URL.createObjectURL(image);
    setImageUrl(url);

    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [image]);

  return (
    <div
      onClick={() => router.push(`/character/${characterId}`)}
      className={`${className ? className : "card"} w-full flex flex-col cursor-pointer hover:scale-105 transition-transform duration-200`}
    >
      {/* Image Container with Fixed Aspect Ratio */}
      <div className="w-full aspect-square overflow-hidden rounded-lg mb-2">
        {image ? (
          <Image
            src={imageUrl || defaultJPG}
            width={200}
            height={200}
            className="object-cover w-full h-full"
            alt={`${characterName} image`}
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-lg">
            <span className="text-gray-500 text-sm">No Image</span>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="flex flex-col gap-1 flex-1 px-1">
        <span className="font-semibold text-sm line-clamp-1">{characterName}</span>
        <span className="font-light text-purple-300 text-xs">@{authorName}</span>
        <span className="font-light text-xs line-clamp-2 text-gray-600 leading-tight">
          {characterBio}
        </span>
      </div>
      
      {/* Tags - Hidden on mobile to save space */}
      <div className="mt-2 hidden sm:block">
        <div className="flex gap-1 flex-wrap">
          {tags?.slice(0, 2).map((tag) => (
            <span 
              className="px-1.5 py-0.5 border border-borders text-xs rounded"
              key={tag.id}
            >
              {tag.name}
            </span>
          ))}
          {tags && tags.length > 2 && (
            <span className="px-1.5 py-0.5 border border-borders text-xs rounded">
              +{tags.length - 2}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CharacterCard;