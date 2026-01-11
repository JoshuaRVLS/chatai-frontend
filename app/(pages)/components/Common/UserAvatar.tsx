"use client";

import React, { useMemo } from "react";

interface UserAvatarProps {
    name?: string | null;
    image?: string | null;
    size?: "sm" | "md" | "lg" | "xl";
    className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ name, image, size = "md", className = "" }) => {
    const [imageError, setImageError] = React.useState(false);

    const initials = useMemo(() => {
        const displayName = name || "";
        if (!displayName) return "?";

        // Split by space, dot, or underscore
        const parts = displayName.split(/[\s._]+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return displayName.substring(0, 2).toUpperCase();
    }, [name]);

    const bgColor = useMemo(() => {
        if (!name) return "bg-primary/20";
        const colors = [
            "bg-blue-500/20",
            "bg-purple-500/20",
            "bg-pink-500/20",
            "bg-emerald-500/20",
            "bg-orange-500/20",
            "bg-indigo-500/20",
            "bg-cyan-500/20",
            "bg-rose-500/20",
            "bg-amber-500/20",
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const colorIndex = Math.abs(hash) % colors.length;
        return colors[colorIndex];
    }, [name]);

    const sizeClasses = {
        sm: "w-8 h-8 text-[10px]",
        md: "w-10 h-10 text-xs",
        lg: "w-16 h-16 text-xl",
        xl: "w-24 h-24 text-4xl",
    };

    const [imageLoading, setImageLoading] = React.useState(true);
    const containerClasses = `relative rounded-2xl flex items-center justify-center overflow-hidden border border-white/10 shadow-2xl transition-all ${sizeClasses[size]} ${className}`;

    if (image && !imageError) {
        return (
            <div className={containerClasses}>
                {imageLoading && (
                    <div className="absolute inset-0 bg-white/5 animate-pulse flex items-center justify-center">
                        <div className="w-4 h-4 border border-white/10 border-t-white/40 rounded-full animate-spin" />
                    </div>
                )}
                <img
                    src={image}
                    alt={name || "User"}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                    onError={() => {
                        setImageError(true);
                        setImageLoading(false);
                    }}
                    onLoad={() => setImageLoading(false)}
                />
            </div>
        );
    }

    return (
        <div className={`${containerClasses} ${bgColor} text-white/60 font-black uppercase tracking-tighter italic pr-0.5`}>
            {initials}
        </div>
    );
};

export default UserAvatar;
