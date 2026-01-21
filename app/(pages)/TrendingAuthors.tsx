"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { FiTrendingUp, FiUser } from 'react-icons/fi';
import AuthorCard from './AuthorCard';

const TrendingAuthors = () => {
    const { data: authors, isPending } = useQuery({
        queryKey: ['trendingAuthors'],
        queryFn: () => fetch('/api/users/trending').then(res => res.json().then(data => data.data)),
    });

    if (isPending || !authors || authors.length === 0) return null;

    return (
        <div className="space-y-6 mt-12 mb-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border-default pb-6 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-linear-to-b from-purple-400 to-pink-500 rounded-full" />
                    <h2 className="text-2xl font-black text-text-primary uppercase tracking-wide flex items-center gap-3 italic">
                        Top Authors <FiUser className="text-purple-400" />
                    </h2>
                </div>
            </div>

            {/* Horizontal Scroll Container */}
            <div className="relative -mx-6 md:-mx-12 group h-fit">
                {/* Fade Masks - Aligned to true edges */}
                <div className="absolute left-0 top-0 bottom-0 w-8 md:w-16 bg-linear-to-r from-page to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-8 md:w-16 bg-linear-to-l from-page to-transparent z-10 pointer-events-none" />

                <div
                    className="flex gap-4 overflow-x-auto pb-10 pt-2 px-6 md:px-12 snap-x snap-mandatory scroll-pl-6 md:scroll-pl-12 no-scrollbar scrollbar-thin scrollbar-track-transparent scrollbar-thumb-black/10 dark:scrollbar-thumb-white/10 hover:scrollbar-thumb-black/20 dark:hover:scrollbar-thumb-white/20 h-fit"
                >
                    {authors.map((author: any) => (
                        <AuthorCard key={author.id} author={author} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default React.memo(TrendingAuthors);
