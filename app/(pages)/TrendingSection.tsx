"use client";

import { useQuery } from '@tanstack/react-query';
import { FiTrendingUp } from 'react-icons/fi';
import CharacterCard from './components/CharacterCard/CharacterCard';
import { motion } from 'motion/react';
import { fadeUpVariants } from './components/Animations/variants';

const TrendingSection = () => {
    const { data: trending, isPending } = useQuery({
        queryKey: ['trendingCharacters'],
        queryFn: () => fetch('/api/trending').then(res => res.json().then(data => data.data)),
    });

    if (isPending || !trending || trending.length === 0) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-1.5 h-8 bg-linear-to-b from-yellow-400 to-orange-500 rounded-full" />
                <h2 className="text-2xl font-black text-white uppercase tracking-wide flex items-center gap-3">
                    Top Rated <FiTrendingUp className="text-yellow-400" />
                </h2>
            </div>

            {/* Horizontal Scroll Container */}
            <div className="relative group">
                {/* Fade Masks */}
                <div className="absolute left-0 top-0 bottom-0 w-12 bg-linear-to-r from-zinc-950 to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-12 bg-linear-to-l from-zinc-950 to-transparent z-10 pointer-events-none" />

                <div className="flex gap-4 overflow-x-auto pb-8 pt-2 px-4 snap-x snap-mandatory scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
                    {trending.map((char: any, index: number) => (
                        <div key={char.id} className="min-w-[280px] w-[280px] snap-center">
                            <CharacterCard
                                authorName={char.author.username}
                                characterName={char.name}
                                image={char.photo ? `/api/image/${char.id}` : null}
                                characterBio={char.bio}
                                tags={char.tags}
                                characterId={char.id}
                                rating={char.averageRating}
                                ratingCount={char.ratingCount}
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

export default TrendingSection;
