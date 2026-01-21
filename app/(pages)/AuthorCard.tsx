"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { FiArrowRight, FiBox, FiStar } from "react-icons/fi";
import UserAvatar from "./components/Common/UserAvatar";
import { bytesToBase64 } from '@/app/utils/image';

interface AuthorCardProps {
    author: any;
}

const AuthorCard = React.memo(({ author }: AuthorCardProps) => {

    // Memoize the expensive base64 conversion
    // This ensures we only recompute if the profileImage object actually changes
    const profileImageBase64 = useMemo(() => {
        return author.profileImage ? bytesToBase64(author.profileImage) : null;
    }, [author.profileImage]);

    return (
        <Link
            href={`/user/${author.username}`}
            className="min-w-[200px] w-[200px] snap-center group/card"
        >
            <div className="h-full bg-surface border border-border-default rounded-3xl p-6 flex flex-col items-center text-center gap-4 hover:border-border-hover hover:bg-surface-hover transition-all duration-300 relative overflow-hidden">
                {/* Decor */}
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover/card:opacity-100 transition-opacity">
                    <FiArrowRight className="text-text-primary -rotate-45 group-hover/card:rotate-0 transition-transform duration-300" />
                </div>

                <div className="relative w-20 h-20 rounded-full border-2 border-border-default p-1 group-hover/card:scale-110 transition-transform duration-300">
                    <UserAvatar
                        name={author.username}
                        image={profileImageBase64}
                        className="w-full h-full rounded-full border-none shadow-none text-2xl"
                    />
                </div>

                <div className="space-y-1">
                    <h3 className="font-black text-text-primary text-lg tracking-tight truncate max-w-[160px]">{author.username}</h3>
                    <p className="text-[10px] text-text-muted font-medium uppercase tracking-widest">
                        Lv. {Math.floor(author.stats.characterCount / 5) + 1} Creator
                    </p>
                </div>

                <div className="w-full h-px bg-border-default" />

                <div className="flex items-center gap-4 text-xs font-bold text-text-secondary">
                    <div className="flex items-center gap-1.5" title="Total Masterpieces">
                        <FiBox className="text-text-muted" />
                        <span>{author.stats.characterCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Total Interactions">
                        <FiStar className="text-yellow-500 fill-yellow-500/20" />
                        <span>{author.stats.totalRatings}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
});

export default AuthorCard;
