/**
 * Chub.ai Automatic Discovery & Import Tool
 * 
 * Fetches characters from Chub.ai and imports them directly into the database.
 * 
 * Usage: npx tsx scripts/chub-auto-import.ts --search "Anime" --pages 2
 */

import { PrismaClient } from '../app/generated/prisma';

const prisma = new PrismaClient();
const DEFAULT_USER_ID = "cmk70q7xb0000cmlrwm9l86gz";
const CHUB_GATEWAY_API = "https://gateway.chub.ai/api";
const CHUB_GATEWAY_SEARCH = "https://gateway.chub.ai/search";

const stripHtml = (html: string): string => {
    if (!html) return "";
    return html
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
};

async function importSingleCharacter(charPath: string) {
    try {
        // Check for existing first
        const existing = await prisma.character.findFirst({
            where: { chubId: charPath }
        });

        if (existing) {
            console.log(`⏩ Skipping: ${charPath} (Already in archive)`);
            return { success: true, skipped: true };
        }

        const detailUrl = `${CHUB_GATEWAY_API}/characters/${charPath}?full=true`;
        console.log(`📡 Fetching: ${detailUrl}`);

        const detailRes = await fetch(detailUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "application/json",
                "Referer": "https://chub.ai/"
            }
        });

        if (!detailRes.ok) {
            console.error(`❌ Failed to fetch: ${detailRes.statusText}`);
            return { success: false };
        }

        const detail = (await detailRes.json()).node;
        const { definition } = detail;
        const topics = detail.topics || [];

        // Handle Tags in parallel
        const tags = await Promise.all(
            topics.map((topicName: string) =>
                prisma.characterTag.upsert({
                    where: { name: topicName },
                    update: {},
                    create: { name: topicName }
                })
            )
        );

        // Create Character
        const introMessage = definition.first_message || definition.first_mes || "";
        const exampleConvo = definition.example_dialogs || definition.mes_example || "";
        const newChar = await prisma.character.create({
            data: {
                name: detail.name,
                chubId: charPath,
                bio: stripHtml(detail.description || detail.tagline || ""),
                persona: stripHtml(definition.personality || definition.description || ""),
                scenario: stripHtml(definition.scenario || ""),
                introMessage: stripHtml(introMessage),
                exampleConversations: stripHtml(exampleConvo),
                isNsfw: topics.some((t: string) => t.toLowerCase() === "nsfw" || t.toLowerCase() === "mature"),
                authorId: DEFAULT_USER_ID,
                tags: {
                    connect: tags.map((t: any) => ({ id: t.id }))
                }
            }
        });

        // Handle Image
        const imageUrl = detail.max_res_url || definition.avatar;
        if (imageUrl) {
            try {
                const imgRes = await fetch(imageUrl);
                if (imgRes.ok) {
                    const buffer = await imgRes.arrayBuffer();
                    await prisma.characterImage.create({
                        data: {
                            charId: newChar.id,
                            name: `${detail.name}_avatar`,
                            mimetype: imgRes.headers.get("content-type") || "image/png",
                            data: Buffer.from(buffer)
                        }
                    });
                    console.log(`   ✅ Integrated: ${detail.name} (with HD visuals)`);
                } else {
                    console.log(`   ✅ Integrated: ${detail.name} (no visuals)`);
                }
            } catch {
                console.log(`   ✅ Integrated: ${detail.name} (visual error)`);
            }
        } else {
            console.log(`   ✅ Integrated: ${detail.name}`);
        }
        return { success: true, isNsfw: topics.some((t: string) => t.toLowerCase() === "nsfw" || t.toLowerCase() === "mature") };
    } catch (e: any) {
        console.error(`❌ Failed to import ${charPath}:`, e.message);
        return { success: false };
    }
}

async function main() {
    const args = process.argv.slice(2);
    const searchIndex = args.indexOf('--search');
    const pagesIndex = args.indexOf('--pages');
    const tagsIndex = args.indexOf('--tags');
    const sortIndex = args.indexOf('--sort');
    const idIndex = args.indexOf('--id');
    const concurrencyIndex = args.indexOf('--concurrency');

    if (idIndex !== -1) {
        const charId = args[idIndex + 1];
        if (!charId) {
            console.error("❌ Please provide a character ID, e.g.: --id Anonymous/furina-5e0e2c07");
            return;
        }
        await importSingleCharacter(charId);
        return;
    }

    const sortMap: Record<string, string> = {
        'popular': 'star_count',
        'newest': 'created_at',
        'downloads': 'download_count',
        'rating': 'rating',
        'default': 'default'
    };

    let query = searchIndex !== -1 ? (args[searchIndex + 1] || '') : '';
    if (query === '""' || query === "''") query = '';

    const maxPages = pagesIndex !== -1 ? parseInt(args[pagesIndex + 1]) : 1;
    const tagsInput = tagsIndex !== -1 ? args[tagsIndex + 1] : '';
    const sortInput = sortIndex !== -1 ? args[sortIndex + 1]?.toLowerCase() : 'default';
    const sort = sortMap[sortInput] || sortInput;
    const concurrency = concurrencyIndex !== -1 ? parseInt(args[concurrencyIndex + 1]) : 5;

    console.log(`\n🚀 Starting Multi-threaded Intelligence Sync${query ? ` for: "${query}"` : ''}`);
    console.log(`📄 Scope: ${maxPages} pages`);
    console.log(`⚡ Concurrency: ${concurrency}`);
    if (tagsInput) console.log(`🏷️  Filtered by Topics: ${tagsInput}`);
    console.log(`📈 Sort Order: ${sort}`);
    console.log(`👤 Target Author ID: ${DEFAULT_USER_ID}\n`);

    let totalImported = 0;
    let nsfwCount = 0;
    let cleanCount = 0;

    const startTime = Date.now();

    for (let page = 1; page <= maxPages; page++) {
        console.log(`📄 Fetching Page ${page}...`);
        try {
            const params = new URLSearchParams({
                first: '20',
                page: page.toString(),
                namespace: 'characters',
                include_forks: 'true',
                nsfw: 'true',
                nsfl: 'true',
                chub: 'true',
                sort: sort
            });
            if (query) params.set('search', query);
            if (tagsInput) params.set('topics', tagsInput);

            const searchUrl = `${CHUB_GATEWAY_SEARCH}?${params.toString()}`;
            const response = await fetch(searchUrl, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Accept": "application/json",
                    "Referer": "https://chub.ai/"
                }
            });

            if (!response.ok) {
                console.error(`❌ Failed to fetch page ${page}: ${response.statusText}`);
                continue;
            }

            const searchResult = await response.json();
            const characterNodes = searchResult.data?.nodes || [];

            if (characterNodes.length === 0) {
                console.log(`ℹ️ No characters found on page ${page}.`);
                break;
            }

            // Parallel Import with Concurrency Control
            const queue = [...characterNodes];
            const activePromises: Promise<void>[] = [];

            while (queue.length > 0 || activePromises.length > 0) {
                while (activePromises.length < concurrency && queue.length > 0) {
                    const node = queue.shift()!;
                    const promise = (async () => {
                        const result = await importSingleCharacter(node.fullPath);
                        if (result.success && !result.skipped) {
                            totalImported++;
                            if (result.isNsfw) nsfwCount++;
                            else cleanCount++;
                        }
                    })().finally(() => {
                        activePromises.splice(activePromises.indexOf(promise), 1);
                    });
                    activePromises.push(promise);
                }
                if (activePromises.length > 0) {
                    await Promise.race(activePromises);
                }
            }
        } catch (error: any) {
            console.error(`❌ Global error on page ${page}:`, error.message);
        }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n🎉 Multi-threaded sync completed in ${duration}s!`);
    console.log(`🚀 Total Integrated: ${totalImported}`);
    console.log(`🌶️  NSFW Integrated : ${nsfwCount}`);
    console.log(`🛡️  Clean Integrated: ${cleanCount}\n`);
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
