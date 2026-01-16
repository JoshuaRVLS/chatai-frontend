"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { FiClock } from 'react-icons/fi';
import CharacterCard from './components/CharacterCard/CharacterCard';
import { motion } from 'motion/react';

const RecentSection = () => {
    const { data: recent, isPending } = useQuery({
        queryKey: ['recentCharacters'],
        queryFn: () => fetch('/api/recent').then(res => res.json().then(data => data.data)),
    });

    if (isPending || !recent || recent.length === 0) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-linear-to-b from-purple-400 to-pink-600 rounded-full" />
                    <h2 className="text-2xl font-black text-white uppercase tracking-wide flex items-center gap-3 italic">
                        New Arrivals <FiClock className="text-purple-400" />
                    </h2>
                </div>
            </div>

            {/* Horizontal Scroll Container */}
            <div className="relative -mx-6 md:-mx-12 h-fit">
                {/* Fade Masks */}
                <div className="absolute left-0 top-0 bottom-0 w-8 md:w-16 bg-linear-to-r from-zinc-950 to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-8 md:w-16 bg-linear-to-l from-zinc-950 to-transparent z-10 pointer-events-none" />

                <div
                    className="flex gap-4 overflow-x-auto pb-10 pt-2 px-6 md:px-12 snap-x snap-mandatory scroll-pl-6 md:scroll-pl-12 no-scrollbar scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20 h-fit"
                >
                    {recent.map((char: any) => (
                        <div key={char.id} className="min-w-[280px] w-[280px] snap-center">
                            <CharacterCard
                                authorName={char.author.username}
                                characterName={char.name}
                                image={char.photo ? `/api/image/${char.id}` : null}
                                characterId={char.id}
                                characterBio={char.bio}
                                tags={char.tags}
                                rating={char.averageRating}
                                ratingCount={char.ratingCount}
                                chatCount={char.chatCount}
                                views={char.views}
                                isNsfw={char.isNsfw}
                                authorId={char.authorId}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default React.memo(RecentSection);
