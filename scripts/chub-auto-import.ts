/**
 * Chub.ai Automatic Discovery & Import Tool
 * 
 * Fetches characters from Chub.ai and imports them directly into the database.
 * 
 * Usage: npx tsx scripts/chub-auto-import.ts --search "Anime" --pages 2
 */

import { PrismaClient } from '../app/generated/prisma';

const prisma = new PrismaClient();
const DEFAULT_USER_ID = "cmdgxw4200000ua60gmk4m351";
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

async function main() {
    const args = process.argv.slice(2);
    const searchIndex = args.indexOf('--search');
    const pagesIndex = args.indexOf('--pages');
    const tagsIndex = args.indexOf('--tags');
    const sortIndex = args.indexOf('--sort');

    // Map user-friendly sort names to API values
    const sortMap: Record<string, string> = {
        'popular': 'star_count',
        'newest': 'created_at',
        'downloads': 'download_count',
        'default': 'default'
    };

    // Handle empty or missing search - use empty string for browsing
    let query = searchIndex !== -1 ? (args[searchIndex + 1] || '') : '';
    if (query === '""' || query === "''") query = '';

    const maxPages = pagesIndex !== -1 ? parseInt(args[pagesIndex + 1]) : 1;
    const tagsInput = tagsIndex !== -1 ? args[tagsIndex + 1] : '';
    const sortInput = sortIndex !== -1 ? args[sortIndex + 1]?.toLowerCase() : 'default';
    const sort = sortMap[sortInput] || sortInput;

    console.log(`\n🚀 Starting Automatic Intelligence Sync${query ? ` for: "${query}"` : ''} (${maxPages} pages)`);
    if (tagsInput) console.log(`🏷️  Filtered by Topics: ${tagsInput}`);
    console.log(`📈 Sort Order: ${sort}`);
    console.log(`👤 Target Author ID: ${DEFAULT_USER_ID}\n`);

    let totalImported = 0;

    for (let page = 1; page <= maxPages; page++) {
        console.log(`📄 Processing Page ${page}...`);
        try {
            // Build search URL - use 'topics' parameter for tag filtering
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

            for (const node of characterNodes) {
                const creator = node.fullPath.split('/')[0];
                console.log(`🔍 [${node.id}] ${node.name} by ${creator}`);

                try {
                    // 1. Fetch full details (Details endpoint DOES use /api)
                    const detailUrl = `${CHUB_GATEWAY_API}/characters/${node.fullPath}?full=true`;
                    const detailRes = await fetch(detailUrl, {
                        headers: {
                            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                            "Accept": "application/json",
                            "Referer": "https://chub.ai/"
                        }
                    });
                    if (!detailRes.ok) throw new Error(`Detail fetch failed: ${detailRes.statusText}`);

                    const detail = (await detailRes.json()).node;
                    const { definition } = detail;
                    const topics = detail.topics || [];

                    // 2. Handle Tags
                    const tagIds: string[] = [];
                    for (const topicName of topics) {
                        const tag = await prisma.characterTag.upsert({
                            where: { name: topicName },
                            update: {},
                            create: { name: topicName }
                        });
                        tagIds.push(tag.id);
                    }

                    // 3. Create Character - Using correct Chub.ai field names
                    const introMessage = definition.first_message || definition.first_mes || "";
                    const exampleConvo = definition.example_dialogs || definition.mes_example || "";
                    const newChar = await prisma.character.create({
                        data: {
                            name: detail.name,
                            bio: stripHtml(detail.description || detail.tagline || ""),
                            persona: stripHtml(definition.personality || definition.description || ""),
                            scenario: stripHtml(definition.scenario || ""),
                            introMessage: stripHtml(introMessage),
                            exampleConversations: stripHtml(exampleConvo),
                            isNsfw: topics.some((t: string) => t.toLowerCase() === "nsfw" || t.toLowerCase() === "mature"),
                            authorId: DEFAULT_USER_ID,
                            tagIds: tagIds
                        }
                    });

                    // 4. Handle Image
                    if (definition.avatar) {
                        try {
                            const imgRes = await fetch(definition.avatar);
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
                                console.log(`   ✅ Integrated: ${detail.name} (with visuals)`);
                            } else {
                                console.log(`   ✅ Integrated: ${detail.name} (no visuals)`);
                            }
                        } catch (e) {
                            console.log(`   ✅ Integrated: ${detail.name} (visual error)`);
                        }
                    } else {
                        console.log(`   ✅ Integrated: ${detail.name}`);
                    }

                    totalImported++;
                } catch (e: any) {
                    console.error(`   ❌ Failed to process ${node.name}:`, e.message);
                }
            }
        } catch (error: any) {
            console.error(`❌ Global error on page ${page}:`, error.message);
        }
    }

    console.log(`\n🎉 Automatic synchronization completed!`);
    console.log(`🚀 Total characters integrated into archive: ${totalImported}\n`);
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
