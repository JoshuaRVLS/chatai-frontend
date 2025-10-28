"use client";

import { useQuery } from "@tanstack/react-query";
import React, { useContext } from "react";
import { AuthContext } from "../../providers/AuthProvider";
import CharacterCard from "../CharacterCard/CharacterCard";
import { CharactersData } from "@/@types/type";
import { FaPencilAlt, FaTrash, FaPlus, FaUser } from "react-icons/fa";
import Link from "next/link";
import toast from "react-hot-toast";

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

  const deleteChar = async (characterId: string, characterName: string) => {
    if (!confirm(`Are you sure you want to delete "${characterName}"? This action cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/characters/${characterId}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        toast.success('Character deleted successfully');
        window.location.reload();
      } else {
        toast.error('Failed to delete character');
      }
    } catch (error) {
      console.log(error);
      toast.error('An error occurred while deleting the character');
    }
  };

  if (isPending) return (
    <div className="min-h-screen bg-var-color-primary-background pt-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-var-color-borders rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-80 bg-var-color-borders rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-var-color-primary-background pt-24 px-4 flex items-center justify-center">
      <div className="text-center">
        <p className="text-var-color-error text-lg">Error loading characters: {error.message}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-var-color-primary-background pt-24 pb-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-var-color-primary-text mb-2">
              My Characters
            </h1>
            <p className="text-var-color-secondary-text">
              Manage your AI characters and create new ones
            </p>
          </div>
          <Link
            href="/create_character"
            className="bg-var-color-primary-button text-white px-6 py-3 rounded-lg hover:bg-var-color-primary-hover-state transition-all duration-200 flex items-center gap-2 font-semibold shadow-lg"
          >
            <FaPlus className="w-4 h-4" />
            Create New
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-var-color-for-dark-surface border border-var-color-borders rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-var-color-primary-button rounded-full">
                <FaUser className="text-white w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-var-color-primary-text">{data?.length || 0}</p>
                <p className="text-var-color-secondary-text">Total Characters</p>
              </div>
            </div>
          </div>
        </div>

        {/* Characters Grid */}
        {data && data.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data.map((character) => (
              <div key={character.id} className="group relative">
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
                  className="h-full"
                />
                
                {/* Action Overlay */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                  <Link
                    href={`/edit_character/${character.id}`}
                    className="p-2 bg-var-color-for-dark-surface border border-var-color-borders rounded-lg hover:bg-var-color-primary-button hover:text-white transition-colors shadow-lg"
                    title="Edit character"
                  >
                    <FaPencilAlt className="w-3 h-3" />
                  </Link>
                  <button
                    onClick={() => deleteChar(character.id, character.name)}
                    className="p-2 bg-var-color-for-dark-surface border border-var-color-borders rounded-lg hover:bg-var-color-error hover:text-white transition-colors shadow-lg"
                    title="Delete character"
                  >
                    <FaTrash className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 mx-auto mb-6 bg-var-color-borders rounded-full flex items-center justify-center">
                <FaUser className="text-var-color-disabled w-10 h-10" />
              </div>
              <h3 className="text-2xl font-semibold text-var-color-primary-text mb-2">
                No characters yet
              </h3>
              <p className="text-var-color-secondary-text mb-6">
                Create your first AI character to start chatting and sharing with the community.
              </p>
              <Link
                href="/create_character"
                className="bg-var-color-primary-button text-white px-8 py-3 rounded-lg hover:bg-var-color-primary-hover-state transition-all duration-200 inline-flex items-center gap-2 font-semibold"
              >
                <FaPlus className="w-4 h-4" />
                Create Your First Character
              </Link>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {data && data.length > 0 && (
          <div className="mt-12 text-center">
            <div className="bg-var-color-for-dark-surface border border-var-color-borders rounded-2xl p-6 max-w-2xl mx-auto">
              <h3 className="text-xl font-semibold text-var-color-primary-text mb-2">
                Need more characters?
              </h3>
              <p className="text-var-color-secondary-text mb-4">
                Create amazing AI characters to expand your collection.
              </p>
              <Link
                href="/create_character"
                className="bg-var-color-secondary-button text-white px-6 py-2 rounded-lg hover:bg-var-color-secondary-hover-state transition-all duration-200 inline-flex items-center gap-2"
              >
                <FaPlus className="w-4 h-4" />
                Create Another Character
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCharacters;