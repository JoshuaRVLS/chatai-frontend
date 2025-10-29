"use client";

import {
  Character,
  CharacterImage,
  Chat,
  Message,
  User,
} from "@/app/generated/prisma";
import { useQuery } from "@tanstack/react-query";
import React, { useContext } from "react";
import CharacterCard from "../../CharacterCard/CharacterCard";
import Link from "next/link";
import { AuthContext } from "@/app/(pages)/providers/AuthProvider";
import { FiMessageCircle, FiClock, FiArrowRight, FiPlay } from "react-icons/fi";

const History = () => {
  const { user } = useContext(AuthContext);
  const { isPending, data, error } = useQuery<
    (Chat & {
      character: Character & { 
        photo: CharacterImage; 
        author: User;
        tags?: { name: string; id: string }[]; // Make tags optional
      };
      messages: Message[];
    })[]
  >({
    queryKey: ["chatsHistory"],
    queryFn: () =>
      fetch(`/api/history/${user?.id}`).then((res) =>
        res.json().then((data) => data.data)
      ),
    enabled: !!user?.id,
  });

  if (isPending) return (
    <div className="w-full mb-8">
      <div className="animate-pulse">
        <div className="h-8 bg-var-color-borders rounded w-1/3 mb-4"></div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3].map(i => (
            <div key={i} className="min-w-64 h-80 bg-var-color-borders rounded-xl"></div>
          ))}
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="w-full mb-8">
      <p className="text-var-color-error">Error loading chat history: {error.message}</p>
    </div>
  );

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div className="w-full mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-var-color-primary-text mb-2">
            Continue Chatting
          </h2>
          <p className="text-var-color-secondary-text flex items-center gap-2 text-sm">
            <FiClock className="w-4 h-4" />
            Pick up where you left off
          </p>
        </div>
        <div className="hidden lg:flex items-center gap-2 text-var-color-disabled text-sm">
          <FiArrowRight className="w-4 h-4" />
          Scroll horizontally to browse
        </div>
      </div>

      {/* Chat History Cards */}
      <div className="relative">
        <div className="flex gap-4 pb-4 overflow-x-auto scrollbar-hide">
          {data.map((chat) => (
            <div
              key={chat.id}
              className="flex flex-col min-w-64 max-w-64 bg-var-color-for-dark-surface border border-var-color-borders rounded-xl overflow-hidden hover:border-var-color-primary-button/50 transition-all duration-300 group flex-shrink-0"
            >
              {/* Character Card - Compact Version */}
              <div className="flex-1 p-3">
                <div className="flex flex-col gap-3 h-full">
                  {/* Character Image */}
                  <div className="relative aspect-square rounded-lg overflow-hidden">
                    {chat.character.photo?.data ? (
                      <img
                        src={`data:${chat.character.photo.mimetype};base64,${Buffer.from(
                          Object.values(chat.character.photo.data)
                        ).toString("base64")}`}
                        alt={chat.character.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-var-color-borders flex items-center justify-center">
                        <FiMessageCircle className="text-var-color-disabled w-8 h-8" />
                      </div>
                    )}
                  </div>

                  {/* Character Info */}
                  <div className="flex-1 flex flex-col gap-2">
                    <h3 className="font-semibold text-var-color-primary-text text-sm line-clamp-1">
                      {chat.character.name}
                    </h3>
                    <p className="text-var-color-secondary-text text-xs line-clamp-2 leading-relaxed">
                      {chat.character.bio}
                    </p>
                    <div className="flex items-center gap-1 text-var-color-disabled text-xs">
                      <FiMessageCircle className="w-3 h-3" />
                      <span>{chat.messages.length} messages</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Actions */}
              <div className="p-3 border-t border-var-color-borders bg-var-color-primary-background/30">
                {/* Last Message Preview */}
                {chat.messages.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs text-var-color-disabled mb-1">Last message:</p>
                    <p className="text-var-color-secondary-text text-xs line-clamp-2 bg-var-color-for-dark-surface p-2 rounded border border-var-color-borders">
                      {chat.messages[chat.messages.length - 1].content}
                    </p>
                  </div>
                )}

                {/* Continue Button */}
                <Link
                  href={`/chat/${chat.id}`}
                  className="w-full bg-var-color-primary-button text-white py-2 px-3 rounded-lg hover:bg-var-color-primary-hover-state transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium group/btn"
                >
                  <FiPlay className="w-3 h-3" />
                  Continue
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Gradient Overlays for Scroll Indication */}
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-var-color-primary-background to-transparent pointer-events-none"></div>
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-var-color-primary-background to-transparent pointer-events-none"></div>
      </div>

      {/* Mobile Hint */}
      <div className="lg:hidden text-center mt-3">
        <p className="text-var-color-disabled text-xs flex items-center justify-center gap-2">
          <FiArrowRight className="w-3 h-3" />
          Swipe to see more conversations
        </p>
      </div>
    </div>
  );
};

export default History;