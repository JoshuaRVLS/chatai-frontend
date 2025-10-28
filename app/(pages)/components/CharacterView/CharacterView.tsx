"use client";

import { Character, CharacterTag, User } from "@/app/generated/prisma";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import React, { useContext, useState } from "react";
import Comments from "../Comments/Comments";
import { useRouter } from "next/navigation";
import { bytesToBase64 } from "@/app/utils/image";
import { AuthContext } from "../../providers/AuthProvider";
import { FiMessageCircle, FiUser, FiInfo, FiPlay, FiChevronDown, FiChevronUp } from "react-icons/fi";

const CharacterView = ({ id }: { id: string }) => {
  const { isPending, error, data } = useQuery<
    Character & {
      author: User;
      photo: { data: Uint8Array; mimetype: string; name: string };
      tags: CharacterTag[];
    }
  >({
    queryKey: ["character", id],
    queryFn: () =>
      fetch(`/api/characters/${id}`).then((res) =>
        res.json().then((data) => data.data)
      ),
  });

  const { user } = useContext(AuthContext);
  const router = useRouter();
  const [expandedSections, setExpandedSections] = useState({
    scenario: false,
    persona: false,
    intro: false
  });

  if (isPending) return (
    <div className="min-h-screen bg-var-color-primary-background pt-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-var-color-borders rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-var-color-borders rounded-xl"></div>
              ))}
            </div>
            <div className="space-y-4">
              <div className="h-96 bg-var-color-borders rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-var-color-primary-background pt-24 px-4 flex items-center justify-center">
      <div className="text-center">
        <p className="text-var-color-error text-lg">Error loading character: {error.message}</p>
      </div>
    </div>
  );

  const startChat = async () => {
    try {
      const response = await fetch("/api/chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          characterId: id,
          userId: user?.id,
        }),
      });
      if (!response.ok) {
        console.log(response);
        return;
      }

      const { chat } = await response.json();
      router.push(`/chat/${chat.id}`);
    } catch (error) {
      console.log(error);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const totalTokens = Math.floor((data.persona.length + data.introMessage.length + data.scenario.length) / 4);
  const permanentTokens = Math.floor((data.persona.length + data.scenario.length) / 4);

  return (
    <div className="min-h-screen bg-var-color-primary-background pt-24 pb-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column - Character Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Character Header */}
            <div className="bg-var-color-for-dark-surface border border-var-color-borders rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold text-var-color-primary-text mb-2">
                    {data.name}
                  </h1>
                  <div className="flex items-center gap-4 text-var-color-secondary-text">
                    <div className="flex items-center gap-2">
                      <FiUser className="w-4 h-4" />
                      <span>by @{data.author.username}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiInfo className="w-4 h-4" />
                      <span>{totalTokens} tokens ({permanentTokens} permanent)</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={startChat}
                  className="bg-var-color-primary-button text-white px-6 py-3 rounded-lg hover:bg-var-color-primary-hover-state active:bg-var-color-primary-active-state transition-all duration-200 flex items-center gap-2 font-semibold shadow-lg"
                >
                  <FiMessageCircle className="w-5 h-5" />
                  Start Chat
                </button>
              </div>

              {/* Bio */}
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-var-color-primary-text mb-3">About</h3>
                <p className="text-var-color-secondary-text leading-relaxed text-lg">
                  {data.bio}
                </p>
              </div>

              {/* Tags */}
              {data.tags.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-var-color-primary-text mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {data.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="px-3 py-1 bg-var-color-primary-background border border-var-color-borders text-var-color-secondary-text rounded-full text-sm"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Character Definition Sections */}
            <div className="space-y-4">
              {/* Scenario Section */}
              <div className="bg-var-color-for-dark-surface border border-var-color-borders rounded-2xl overflow-hidden">
                <button
                  onClick={() => toggleSection('scenario')}
                  className="w-full p-6 flex items-center justify-between text-left hover:bg-var-color-borders transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FiPlay className="w-5 h-5 text-var-color-primary-button" />
                    <div>
                      <h3 className="text-xl font-semibold text-var-color-primary-text">
                        Scenario
                      </h3>
                      <p className="text-var-color-secondary-text text-sm">
                        {Math.floor(data.scenario.length / 4)} tokens
                      </p>
                    </div>
                  </div>
                  {expandedSections.scenario ? (
                    <FiChevronUp className="w-5 h-5 text-var-color-disabled" />
                  ) : (
                    <FiChevronDown className="w-5 h-5 text-var-color-disabled" />
                  )}
                </button>
                {expandedSections.scenario && (
                  <div className="p-6 border-t border-var-color-borders">
                    <p className="text-var-color-secondary-text leading-relaxed whitespace-pre-wrap">
                      {data.scenario}
                    </p>
                  </div>
                )}
              </div>

              {/* Persona Section */}
              <div className="bg-var-color-for-dark-surface border border-var-color-borders rounded-2xl overflow-hidden">
                <button
                  onClick={() => toggleSection('persona')}
                  className="w-full p-6 flex items-center justify-between text-left hover:bg-var-color-borders transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FiUser className="w-5 h-5 text-var-color-primary-button" />
                    <div>
                      <h3 className="text-xl font-semibold text-var-color-primary-text">
                        Persona
                      </h3>
                      <p className="text-var-color-secondary-text text-sm">
                        {Math.floor(data.persona.length / 4)} tokens
                      </p>
                    </div>
                  </div>
                  {expandedSections.persona ? (
                    <FiChevronUp className="w-5 h-5 text-var-color-disabled" />
                  ) : (
                    <FiChevronDown className="w-5 h-5 text-var-color-disabled" />
                  )}
                </button>
                {expandedSections.persona && (
                  <div className="p-6 border-t border-var-color-borders">
                    <p className="text-var-color-secondary-text leading-relaxed whitespace-pre-wrap">
                      {data.persona}
                    </p>
                  </div>
                )}
              </div>

              {/* Intro Message Section */}
              <div className="bg-var-color-for-dark-surface border border-var-color-borders rounded-2xl overflow-hidden">
                <button
                  onClick={() => toggleSection('intro')}
                  className="w-full p-6 flex items-center justify-between text-left hover:bg-var-color-borders transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FiMessageCircle className="w-5 h-5 text-var-color-primary-button" />
                    <div>
                      <h3 className="text-xl font-semibold text-var-color-primary-text">
                        Intro Message
                      </h3>
                      <p className="text-var-color-secondary-text text-sm">
                        {Math.floor(data.introMessage.length / 4)} tokens
                      </p>
                    </div>
                  </div>
                  {expandedSections.intro ? (
                    <FiChevronUp className="w-5 h-5 text-var-color-disabled" />
                  ) : (
                    <FiChevronDown className="w-5 h-5 text-var-color-disabled" />
                  )}
                </button>
                {expandedSections.intro && (
                  <div className="p-6 border-t border-var-color-borders">
                    <p className="text-var-color-secondary-text leading-relaxed whitespace-pre-wrap">
                      {data.introMessage}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Character Image & Comments */}
          <div className="space-y-6">
            {/* Character Image */}
            <div className="bg-var-color-for-dark-surface border border-var-color-borders rounded-2xl overflow-hidden">
              <div className="relative aspect-square">
                <Image
                  src={bytesToBase64(data.photo)}
                  fill
                  className="object-cover"
                  alt={data.name}
                  priority
                />
              </div>
            </div>

            {/* Comments Section */}
            <div className="bg-var-color-for-dark-surface border border-var-color-borders rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-var-color-borders">
                <h3 className="text-xl font-semibold text-var-color-primary-text">
                  Community Comments
                </h3>
              </div>
              <div className="p-6">
                <Comments characterId={data.id} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterView;