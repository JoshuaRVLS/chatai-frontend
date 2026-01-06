import { NextRequest, NextResponse } from "next/server";
import { fetchChubCharacter, parseChubUrl, mapChubToLocal } from "@/app/utils/scrapers/chubScraper";

export async function POST(req: NextRequest) {
    try {
        const { url } = await req.json();

        if (!url) {
            return NextResponse.json({ error: "Chub.ai URL is required" }, { status: 400 });
        }

        const parsed = parseChubUrl(url);
        if (!parsed) {
            return NextResponse.json({ error: "Invalid Chub.ai URL format" }, { status: 400 });
        }

        const characterData = await fetchChubCharacter(parsed.creator, parsed.slug);
        const mapped = mapChubToLocal(characterData);

        // Fetch avatar and convert to base64 for frontend preview if needed,
        // but better yet, just return the URL and let the frontend handler download it during final submission
        // OR we can fetch it now to ensure it works.
        let avatarBase64 = null;
        if (mapped.avatarUrl) {
            try {
                const imgRes = await fetch(mapped.avatarUrl);
                if (imgRes.ok) {
                    const buffer = await imgRes.arrayBuffer();
                    const base64 = Buffer.from(buffer).toString("base64");
                    const contentType = imgRes.headers.get("content-type") || "image/png";
                    avatarBase64 = `data:${contentType};base64,${base64}`;
                }
            } catch (e) {
                console.error("Failed to fetch avatar from Chub.ai:", e);
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                ...mapped,
                avatarBase64
            }
        });

    } catch (error: any) {
        console.error("Scraper Error:", error);
        return NextResponse.json({ error: error.message || "Failed to scrape Chub.ai" }, { status: 500 });
    }
}
