import { CharacterTag } from "@/app/generated/prisma";

export interface ChubCharacterNode {
    node: {
        id: number;
        name: string;
        fullPath: string;
        description: string;
        tagline: string;
        topics: string[];
        createdAt: string;
        lastActivityAt: string;
        primaryFormat: string;
        definition: {
            id: number;
            avatar: string;
            name: string;
            description: string;
            personality: string;
            scenario: string;
            first_mes: string;
            mes_example: string;
        };
    };
}

export const CHUB_GATEWAY = "https://gateway.chub.ai/api";

/**
 * Parses a Chub.ai URL to extract creator and slug.
 * Supported formats:
 * - https://chub.ai/characters/creator/slug
 * - https://www.chub.ai/characters/creator/slug
 * - creator/slug
 */
export const parseChubUrl = (url: string): { creator: string; slug: string } | null => {
    const cleanUrl = url.trim().replace(/\/$/, "");

    // Direct creator/slug format
    if (/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/.test(cleanUrl)) {
        const [creator, slug] = cleanUrl.split("/");
        return { creator, slug };
    }

    try {
        const parsed = new URL(cleanUrl);
        if (!parsed.hostname.includes("chub.ai")) return null;

        const parts = parsed.pathname.split("/").filter(Boolean);
        // Path should be ["characters", "creator", "slug"]
        if (parts[0] === "characters" && parts.length >= 3) {
            return { creator: parts[1], slug: parts[2] };
        }
    } catch (e) {
        // Not a valid URL, ignore
    }

    return null;
};

/**
 * Fetches character data from Chub.ai Gateway.
 */
export const fetchChubCharacter = async (creator: string, slug: string): Promise<ChubCharacterNode> => {
    const url = `${CHUB_GATEWAY}/characters/${creator}/${slug}?full=true`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Failed to fetch character from Chub.ai: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
};

/**
 * Searches for characters on Chub.ai.
 */
export const searchChubCharacters = async (query: string, page: number = 1): Promise<any> => {
    const url = `${CHUB_GATEWAY}/characters?search=${encodeURIComponent(query)}&first=20&page=${page}&sort=star_count&operator=and`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Failed to search characters on Chub.ai: ${response.statusText}`);
    }

    return response.json();
};

/**
 * Maps Chub.ai character data to our local Character schema.
 */
export const mapChubToLocal = (chubData: ChubCharacterNode) => {
    const { node } = chubData;
    const { definition } = node;

    return {
        name: node.name || definition.name,
        // Chub.ai's 'description' in definition is often the personality/behavior prompt in Tavern format.
        // node.description is the long bio.
        bio: node.description || node.tagline || "",
        persona: definition.personality || definition.description || "",
        scenario: definition.scenario || "",
        introMessage: definition.first_mes || "",
        exampleConversations: definition.mes_example || "",
        tags: node.topics || [],
        avatarUrl: definition.avatar,
        isNsfw: node.topics.some(t => t.toLowerCase() === "nsfw" || t.toLowerCase() === "mature"),
    };
};
