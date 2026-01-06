export type RateLimitOptions = {
    limit: number;
    windowMs: number;
};

const trackers = new Map<string, { count: number; expiresAt: number }>();

export const rateLimit = async (ip: string, options: RateLimitOptions) => {
    const now = Date.now();
    const tracker = trackers.get(ip);

    if (!tracker || now > tracker.expiresAt) {
        trackers.set(ip, {
            count: 1,
            expiresAt: now + options.windowMs,
        });
        return { success: true, count: 1 };
    }

    tracker.count++;
    if (tracker.count > options.limit) {
        return { success: false, count: tracker.count };
    }

    return { success: true, count: tracker.count };
};

// Cleanup expired trackers periodically
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        for (const [ip, tracker] of trackers.entries()) {
            if (now > tracker.expiresAt) {
                trackers.delete(ip);
            }
        }
    }, 60000); // Every minute
}
