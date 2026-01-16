"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { FiTrendingUp, FiUser, FiStar, FiBox, FiArrowRight } from 'react-icons/fi';
import Image from 'next/image';
import Link from 'next/link';
import { bytesToBase64 } from '@/app/utils/image';
import UserAvatar from './components/Common/UserAvatar';

const TrendingAuthors = () => {
    const { data: authors, isPending } = useQuery({
        queryKey: ['trendingAuthors'],
        queryFn: () => fetch('/api/users/trending').then(res => res.json().then(data => data.data)),
    });

    if (isPending || !authors || authors.length === 0) return null;

    return (
        <div className="space-y-6 mt-12 mb-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-linear-to-b from-purple-400 to-pink-500 rounded-full" />
                    <h2 className="text-2xl font-black text-white uppercase tracking-wide flex items-center gap-3 italic">
                        Top Architects <FiUser className="text-purple-400" />
                    </h2>
                </div>
            </div>

            {/* Horizontal Scroll Container */}
            <div className="relative -mx-6 md:-mx-12 group h-fit">
                {/* Fade Masks - Aligned to true edges */}
                <div className="absolute left-0 top-0 bottom-0 w-8 md:w-16 bg-linear-to-r from-zinc-950 to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-8 md:w-16 bg-linear-to-l from-zinc-950 to-transparent z-10 pointer-events-none" />

                <div
                    className="flex gap-4 overflow-x-auto pb-10 pt-2 px-6 md:px-12 snap-x snap-mandatory scroll-pl-6 md:scroll-pl-12 no-scrollbar scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20 h-fit"
                >
                    {authors.map((author: any, index: number) => (
                        <Link
                            key={author.id}
                            href={`/user/${author.username}`}
                            className="min-w-[200px] w-[200px] snap-center group/card"
                        >
                            <div className="h-full bg-linear-to-b from-white/5 to-white/2 border border-white/5 rounded-3xl p-6 flex flex-col items-center text-center gap-4 hover:border-white/20 hover:bg-white/10 transition-all duration-300 relative overflow-hidden">
                                {/* Decor */}
                                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover/card:opacity-100 transition-opacity">
                                    <FiArrowRight className="text-white -rotate-45 group-hover/card:rotate-0 transition-transform duration-300" />
                                </div>

                                <div className="relative w-20 h-20 rounded-full border-2 border-white/10 p-1 group-hover/card:scale-110 transition-transform duration-300">
                                    <UserAvatar
                                        name={author.username}
                                        image={author.profileImage ? bytesToBase64(author.profileImage) : null}
                                        className="w-full h-full rounded-full border-none shadow-none text-2xl"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <h3 className="font-black text-white text-lg tracking-tight truncate max-w-[160px]">{author.username}</h3>
                                    <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest">
                                        Lv. {Math.floor(author.stats.characterCount / 5) + 1} Creator
                                    </p>
                                </div>

                                <div className="w-full h-px bg-white/5" />

                                <div className="flex items-center gap-4 text-xs font-bold text-zinc-300">
                                    <div className="flex items-center gap-1.5" title="Total Masterpieces">
                                        <FiBox className="text-zinc-500" />
                                        <span>{author.stats.characterCount}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5" title="Total Interactions">
                                        <FiStar className="text-yellow-500 fill-yellow-500/20" />
                                        <span>{author.stats.totalRatings}</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default React.memo(TrendingAuthors);
