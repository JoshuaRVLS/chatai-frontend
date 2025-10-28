import { CharacterTag, User } from "@/app/generated/prisma";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import defaultJPG from "@/public/default.jpg";
import { useRouter } from "next/navigation";
import { FiUser, FiMoreHorizontal } from "react-icons/fi";

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

  const displayTags = tags || selectedTags?.map(tag => ({ name: tag.label, id: tag.value }));

  return (
    <div
      onClick={() => characterId && router.push(`/character/${characterId}`)}
      className={`${className} group bg-var-color-for-dark-surface border border-var-color-borders rounded-xl overflow-hidden cursor-pointer hover:border-var-color-primary-button transition-all duration-300 hover:shadow-lg`}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {image ? (
          <Image
            src={imageUrl || defaultJPG}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            alt={`${characterName} image`}
          />
        ) : (
          <div className="w-full h-full bg-var-color-borders flex items-center justify-center">
            <FiUser className="text-var-color-disabled w-8 h-8" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-var-color-for-dark-surface/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-var-color-primary-text line-clamp-1 flex-1">
            {characterName}
          </h3>
          <FiMoreHorizontal className="text-var-color-disabled w-4 h-4 flex-shrink-0 mt-0.5" />
        </div>
        
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 bg-var-color-primary-button rounded-full" />
          <span className="text-var-color-secondary-text text-sm">@{authorName}</span>
        </div>

        <p className="text-var-color-secondary-text text-sm line-clamp-2 leading-relaxed mb-3">
          {characterBio}
        </p>

        {displayTags && displayTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {displayTags.slice(0, 3).map((tag) => (
              <span 
                className="px-2 py-1 bg-var-color-primary-background border border-var-color-borders text-var-color-secondary-text text-xs rounded-md"
                key={tag.id}
              >
                {tag.name}
              </span>
            ))}
            {displayTags.length > 3 && (
              <span className="px-2 py-1 bg-var-color-primary-background border border-var-color-borders text-var-color-disabled text-xs rounded-md">
                +{displayTags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CharacterCard;