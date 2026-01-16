
export default function SkeletonLoader({ className = "" }: { className?: string }) {
    return (
        <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />
    );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number, cols?: number }) {
    return (
        <div className="space-y-4 w-full">
            {/* Header */}
            <div className="flex gap-4 p-4 border-b border-white/5">
                {Array.from({ length: cols }).map((_, i) => (
                    <SkeletonLoader key={i} className="h-4 flex-1" />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, r) => (
                <div key={r} className="flex gap-4 p-4">
                    {Array.from({ length: cols }).map((_, c) => (
                        <div key={c} className="flex-1">
                            <SkeletonLoader className="h-8 w-full" />
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}
