/**
 * ChubAI Lorebook Scraper & Auto-Import
 * 
 * Fetches lorebooks from ChubAI and imports them with parallel processing.
 * 
 * Usage:
 *   npx tsx scripts/chub-lorebook-scraper.ts --search "fantasy" --userId <user-id>
 *   npx tsx scripts/chub-lorebook-scraper.ts --id <lorebook-id> --userId <user-id>
 */

import { PrismaClient } from '../app/generated/prisma';
import { cpus } from 'os';

const prisma = new PrismaClient();
const CHUB_GATEWAY_API = "https://gateway.chub.ai/api";
const CHUB_GATEWAY_SEARCH = "https://gateway.chub.ai/search";

interface ChubLoreEntry {
    keys: string[];
    content: string;
    enabled?: boolean;
    order?: number;
}

interface ChubLorebook {
    fullPath: string;
    name: string;
    description?: string;
    entries: ChubLoreEntry[];
}

/**
 * Strip HTML tags and decode entities
 */
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

/**
 * Fetch a single lorebook from ChubAI
 */
async function fetchChubLorebook(lorebookPath: string): Promise<ChubLorebook | null> {
    try {
        const detailUrl = `${CHUB_GATEWAY_API}/${lorebookPath}?full=true`;
        console.log(`📡 Fetching: ${detailUrl}`);

        const response = await fetch(detailUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "application/json",
                "Referer": "https://chub.ai/"
            }
        });

        if (!response.ok) {
            console.error(`❌ HTTP ${response.status}: ${response.statusText}`);
            return null;
        }

        const data = await response.json();
        const node = data.node || data;

        // Extract lorebook entries from the definition
        const entries: ChubLoreEntry[] = [];

        // ChubAI lorebooks store entries in definition.embedded_lorebook.entries
        if (node.definition?.embedded_lorebook?.entries && Array.isArray(node.definition.embedded_lorebook.entries)) {
            entries.push(...node.definition.embedded_lorebook.entries.map((entry: any) => ({
                keys: entry.keys || [],
                content: stripHtml(entry.content || ''),
                enabled: entry.enabled !== false,
                order: entry.insertion_order || entry.order || 0
            })));
        }
        // Fallback: Check definition.entries
        else if (node.definition?.entries && Array.isArray(node.definition.entries)) {
            entries.push(...node.definition.entries.map((entry: any) => ({
                keys: entry.keys || [],
                content: stripHtml(entry.content || ''),
                enabled: entry.enabled !== false,
                order: entry.insertion_order || entry.order || 0
            })));
        }
        // Fallback: Also check for direct entries array
        else if (node.entries && Array.isArray(node.entries)) {
            entries.push(...node.entries.map((entry: any) => ({
                keys: entry.keys || entry.keywords || [],
                content: stripHtml(entry.content || entry.text || ''),
                enabled: entry.enabled !== false,
                order: entry.order || 0
            })));
        }
        // Fallback: Check for world_info extension format (SillyTavern)
        else if (node.extensions?.world_info?.entries) {
            entries.push(...node.extensions.world_info.entries.map((entry: any) => ({
                keys: entry.keys || [],
                content: stripHtml(entry.content || ''),
                enabled: entry.enabled !== false,
                order: entry.order || 0
            })));
        }

        return {
            fullPath: lorebookPath,
            name: node.name || 'Unnamed Lorebook',
            description: stripHtml(node.description || node.tagline || ''),
            entries: entries
        };
    } catch (error: any) {
        console.error(`❌ Error fetching lorebook ${lorebookPath}:`, error.message);
        return null;
    }
}

/**
 * Import a ChubAI lorebook into the database
 */
async function importChubLorebook(
    lorebookData: ChubLorebook,
    userId: string,
    characterIds: string[] = []
): Promise<{ success: boolean; skipped?: boolean; entriesCount?: number }> {
    try {
        // Check if already exists by chubId (primary check)
        if (lorebookData.fullPath) {
            const existingByChubId = await prisma.lorebook.findFirst({
                where: { chubId: lorebookData.fullPath }
            });

            if (existingByChubId) {
                console.log(`⏩ Skipping: "${lorebookData.name}" (Already imported from ChubAI)`);
                return { success: true, skipped: true };
            }
        }

        // Secondary check: name + userId (for non-ChubAI imported lorebooks)
        const existingByName = await prisma.lorebook.findFirst({
            where: {
                name: lorebookData.name,
                userId: userId
            }
        });

        if (existingByName) {
            console.log(`⏩ Skipping: "${lorebookData.name}" (Lorebook with same name exists)`);
            return { success: true, skipped: true };
        }

        // Create lorebook
        const lorebook = await prisma.lorebook.create({
            data: {
                name: lorebookData.name,
                description: lorebookData.description || '',
                chubId: lorebookData.fullPath || null,
                userId: userId,
                entries: {
                    create: lorebookData.entries.map(entry => ({
                        keywords: entry.keys,
                        content: entry.content,
                        enabled: entry.enabled !== false
                    }))
                },
                ...(characterIds.length > 0 && {
                    characters: {
                        connect: characterIds.map(id => ({ id }))
                    }
                })
            },
            include: {
                entries: true
            }
        });

        console.log(`✅ Imported: "${lorebook.name}" (${lorebook.entries.length} entries)`);
        return { success: true, entriesCount: lorebook.entries.length };
    } catch (error: any) {
        console.error(`❌ Failed to import "${lorebookData.name}":`, error.message);
        return { success: false };
    }
}

/**
 * Search for lorebooks on ChubAI
 */
async function searchChubLorebooks(query: string, maxPages: number = 1): Promise<string[]> {
    const lorebookPaths: string[] = [];

    for (let page = 1; page <= maxPages; page++) {
        try {
            const params = new URLSearchParams({
                first: '20',
                page: page.toString(),
                namespace: 'lorebooks',
                include_forks: 'true',
                nsfw: 'true',
                sort: 'default'
            });

            if (query) {
                params.set('search', query);
            }

            const searchUrl = `${CHUB_GATEWAY_SEARCH}?${params.toString()}`;
            console.log(`📄 Searching page ${page}...`);

            const response = await fetch(searchUrl, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    "Accept": "application/json",
                    "Referer": "https://chub.ai/"
                }
            });

            if (!response.ok) {
                console.error(`❌ Search failed on page ${page}: ${response.statusText}`);
                continue;
            }

            const searchResult = await response.json();
            const nodes = searchResult.data?.nodes || [];

            if (nodes.length === 0) {
                console.log(`ℹ️ No lorebooks found on page ${page}`);
                break;
            }

            const paths = nodes
                .filter((node: any) => node.fullPath)
                .map((node: any) => node.fullPath);

            lorebookPaths.push(...paths);
            console.log(`   Found ${paths.length} lorebooks on page ${page}`);
        } catch (error: any) {
            console.error(`❌ Error on page ${page}:`, error.message);
        }
    }

    return lorebookPaths;
}

/**
 * Process lorebooks in parallel with concurrency control
 */
async function processLorebooksInParallel(
    lorebookPaths: string[],
    userId: string,
    concurrency: number,
    characterIds: string[] = []
): Promise<{ imported: number; skipped: number; failed: number; totalEntries: number }> {
    let imported = 0;
    let skipped = 0;
    let failed = 0;
    let totalEntries = 0;

    const queue = [...lorebookPaths];
    const activePromises: Promise<void>[] = [];

    while (queue.length > 0 || activePromises.length > 0) {
        while (activePromises.length < concurrency && queue.length > 0) {
            const lorebookPath = queue.shift()!;

            const promise = (async () => {
                const lorebookData = await fetchChubLorebook(lorebookPath);
                if (!lorebookData) {
                    failed++;
                    return;
                }

                const result = await importChubLorebook(lorebookData, userId, characterIds);
                if (result.success) {
                    if (result.skipped) {
                        skipped++;
                    } else {
                        imported++;
                        totalEntries += result.entriesCount || 0;
                    }
                } else {
                    failed++;
                }
            })().finally(() => {
                const index = activePromises.indexOf(promise);
                if (index > -1) {
                    activePromises.splice(index, 1);
                }
            });

            activePromises.push(promise);
        }

        if (activePromises.length > 0) {
            await Promise.race(activePromises);
        }
    }

    return { imported, skipped, failed, totalEntries };
}

/**
 * Main function
 */
async function main() {
    const args = process.argv.slice(2);
    const searchIndex = args.indexOf('--search');
    const idIndex = args.indexOf('--id');
    const pagesIndex = args.indexOf('--pages');
    const userIdIndex = args.indexOf('--userId');
    const concurrencyIndex = args.indexOf('--concurrency');
    const characterIdsIndex = args.indexOf('--characters');

    // Validate userId
    if (userIdIndex === -1 || !args[userIdIndex + 1]) {
        console.error('❌ Error: --userId is required');
        console.log('\nUsage:');
        console.log('  --id <lorebook-id>      Import specific lorebook by ID');
        console.log('  --search <query>        Search and import lorebooks');
        console.log('  --pages <num>           Number of search pages (default: 1)');
        console.log('  --userId <id>           User ID (required)');
        console.log('  --characters <id,id>    Character IDs to link');
        console.log('  --concurrency <num>     Max parallel imports (default: CPU count)');
        return;
    }

    const userId = args[userIdIndex + 1];
    const maxConcurrency = concurrencyIndex !== -1
        ? parseInt(args[concurrencyIndex + 1])
        : cpus().length;

    const characterIds = characterIdsIndex !== -1
        ? args[characterIdsIndex + 1].split(',').filter(Boolean)
        : [];

    console.log(`\n🚀 ChubAI Lorebook Scraper & Auto-Import`);
    console.log(`👤 User ID: ${userId}`);
    console.log(`⚡ Max Concurrency: ${maxConcurrency}`);
    if (characterIds.length > 0) {
        console.log(`🔗 Linking to ${characterIds.length} character(s)`);
    }
    console.log('');

    const startTime = Date.now();

    // Single lorebook import
    if (idIndex !== -1) {
        const lorebookId = args[idIndex + 1];
        if (!lorebookId) {
            console.error('❌ Error: --id requires a lorebook ID');
            return;
        }

        const lorebookData = await fetchChubLorebook(lorebookId);
        if (!lorebookData) {
            console.error('❌ Failed to fetch lorebook');
            return;
        }

        await importChubLorebook(lorebookData, userId, characterIds);
    }
    // Search and import
    else if (searchIndex !== -1) {
        const query = args[searchIndex + 1] || '';
        const maxPages = pagesIndex !== -1 ? parseInt(args[pagesIndex + 1]) : 1;

        console.log(`🔍 Searching for: "${query}"`);
        console.log(`📄 Pages: ${maxPages}\n`);

        const lorebookPaths = await searchChubLorebooks(query, maxPages);

        if (lorebookPaths.length === 0) {
            console.log('ℹ️ No lorebooks found');
            return;
        }

        console.log(`\n📋 Found ${lorebookPaths.length} lorebook(s)\n`);

        const results = await processLorebooksInParallel(
            lorebookPaths,
            userId,
            maxConcurrency,
            characterIds
        );

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(`\n${'═'.repeat(50)}`);
        console.log(`🎉 Import completed in ${duration}s`);
        console.log(`✅ Successfully imported: ${results.imported} lorebook(s)`);
        console.log(`📝 Total entries: ${results.totalEntries}`);
        if (results.skipped > 0) console.log(`⏩ Skipped (duplicates): ${results.skipped}`);
        if (results.failed > 0) console.log(`❌ Failed: ${results.failed}`);
        console.log(`${'═'.repeat(50)}\n`);
    }
    else {
        console.error('❌ Error: Must specify --id or --search');
        return;
    }
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
