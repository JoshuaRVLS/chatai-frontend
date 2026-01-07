/**
 * ChubAI Lorebook Scraper & Auto-Import (ENHANCED)
 * 
 * Fetches lorebooks from ChubAI with ALL ChubAI features and imports them with parallel processing.
 * 
 * Usage:
 *   npx tsx scripts/chub-lorebook-scraper-enhanced.ts --search "fantasy" --userId <user-id>
 *   npx tsx scripts/chub-lorebook-scraper-enhanced.ts --id <lorebook-id> --userId <user-id>
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
    scanDepth?: number;
    tokenBudget?: number;
    recursiveScanning?: boolean;
    topics?: string[];
    avatarUrl?: string;
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
 * Fetch a single lorebook from ChubAI with ALL fields
 */
async function fetchChubLorebook(lorebookPath: string): Promise<ChubLorebook | null> {
    try {
        const detailUrl = `${CHUB_GATEWAY_API}/${lorebookPath}?full=true`;
        console.log(`📡 Fetching: ${detailUrl}`);

        const response = await fetch(detailUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "application/json, text/plain, */*",
                "Accept-Language": "en-US,en;q=0.9",
                "Accept-Encoding": "gzip, deflate, br",
                "Referer": "https://chub.ai/",
                "Origin": "https://chub.ai",
                "Sec-Fetch-Dest": "empty",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Site": "same-site",
                "Cache-Control": "no-cache",
                "Pragma": "no-cache"
            }
        });

        if (!response.ok) {
            console.error(`❌ HTTP ${response.status}: ${response.statusText}`);
            return null;
        }

        const data: any = await response.json();
        const node = data.node || data;

        // Extract lorebook entries
        const entries: ChubLoreEntry[] = [];

        if (node.definition?.embedded_lorebook?.entries && Array.isArray(node.definition.embedded_lorebook.entries)) {
            entries.push(...node.definition.embedded_lorebook.entries.map((entry: any) => ({
                keys: entry.keys || [],
                content: stripHtml(entry.content || ''),
                enabled: entry.enabled !== false,
                order: entry.insertion_order || entry.order || 0
            })));
        }
        else if (node.definition?.entries && Array.isArray(node.definition.entries)) {
            entries.push(...node.definition.entries.map((entry: any) => ({
                keys: entry.keys || [],
                content: stripHtml(entry.content || ''),
                enabled: entry.enabled !== false,
                order: entry.insertion_order || entry.order || 0
            })));
        }
        else if (node.entries && Array.isArray(node.entries)) {
            entries.push(...node.entries.map((entry: any) => ({
                keys: entry.keys || entry.keywords || [],
                content: stripHtml(entry.content || entry.text || ''),
                enabled: entry.enabled !== false,
                order: entry.order || 0
            })));
        }
        else if (node.extensions?.world_info?.entries) {
            entries.push(...node.extensions.world_info.entries.map((entry: any) => ({
                keys: entry.keys || [],
                content: stripHtml(entry.content || ''),
                enabled: entry.enabled !== false,
                order: entry.order || 0
            })));
        }

        // Extract ChubAI-specific settings
        const embeddedLorebook = node.definition?.embedded_lorebook || {};
        const scanDepth = embeddedLorebook.scan_depth || 4;
        const tokenBudget = embeddedLorebook.token_budget || 512;
        const recursiveScanning = embeddedLorebook.recursive_scanning || false;

        // Extract topics as tags
        const topics = node.topics || [];

        // Extract avatar URL
        const avatarUrl = node.avatar_url || node.max_res_url || null;

        return {
            fullPath: lorebookPath,
            name: node.name || 'Unnamed Lorebook',
            description: stripHtml(node.description || node.tagline || ''),
            entries,
            scanDepth,
            tokenBudget,
            recursiveScanning,
            topics,
            avatarUrl
        };
    } catch (error: any) {
        console.error(`❌ Error fetching lorebook ${lorebookPath}:`, error.message);
        return null;
    }
}

/**
 * Download image from URL and return as Buffer
 */
async function downloadImage(url: string): Promise<Buffer | null> {
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (error) {
        console.error(`❌ Failed to download image:`, error);
        return null;
    }
}

/**
 * Import a single lorebook into the database with ALL ChubAI features
 */
async function importChubLorebook(lorebook: ChubLorebook, userId: string): Promise<{ success: boolean; skipped?: boolean }> {
    try {
        // Check if already exists (PRIMARY: by chubId)
        const existingByChubId = await prisma.lorebook.findUnique({
            where: { chubId: lorebook.fullPath }
        });

        if (existingByChubId) {
            console.log(`⏩ Skipping: ${lorebook.name} (Already imported from ChubAI)`);
            return { success: true, skipped: true };
        }

        // Check for duplicates by name + userId (SECONDARY)
        const existingByName = await prisma.lorebook.findFirst({
            where: {
                AND: [
                    { name: lorebook.name },
                    { userId: userId }
                ]
            }
        });

        if (existingByName) {
            console.log(`⏩ Skipping: ${lorebook.name} (Duplicate name)`);
            return { success: true, skipped: true };
        }

        // Process tags (upsert each tag)
        const tagRecords = await Promise.all(
            (lorebook.topics || []).map(async (topicName) => {
                return prisma.lorebookTag.upsert({
                    where: { name: topicName },
                    update: {},
                    create: { name: topicName }
                });
            })
        );

        // Create lorebook with all ChubAI fields
        const createdLorebook = await prisma.lorebook.create({
            data: {
                name: lorebook.name,
                description: lorebook.description || '',
                chubId: lorebook.fullPath,
                scanDepth: lorebook.scanDepth || 4,
                tokenBudget: lorebook.tokenBudget || 512,
                recursiveScanning: lorebook.recursiveScanning || false,
                userId,
                entries: {
                    create: lorebook.entries.map((entry) => ({
                        keywords: entry.keys,
                        content: entry.content,
                        enabled: entry.enabled !== false
                    }))
                },
                ...(tagRecords.length > 0 && {
                    tags: {
                        connect: tagRecords.map(tag => ({ id: tag.id }))
                    }
                })
            }
        });

        // Download and save avatar image
        if (lorebook.avatarUrl) {
            const imageBuffer = await downloadImage(lorebook.avatarUrl);
            if (imageBuffer) {
                const mimeType = lorebook.avatarUrl.includes('.png') ? 'image/png' : 'image/jpeg';
                await prisma.lorebookImage.create({
                    data: {
                        lorebookId: createdLorebook.id,
                        name: `${lorebook.name}_avatar`,
                        mimetype: mimeType,
                        data: new Uint8Array(imageBuffer)
                    }
                });
                console.log(`   🖼️  Avatar downloaded`);
            }
        }

        console.log(`✅ Imported: ${lorebook.name} (${lorebook.entries.length} entries, ${tagRecords.length} tags, depth:${lorebook.scanDepth}, budget:${lorebook.tokenBudget})`);
        return { success: true };
    } catch (error: any) {
        console.error(`❌ Failed to import ${lorebook.name}:`, error.message);
        return { success: false };
    }
}

/**
 * Search ChubAI for lorebooks
 */
async function searchChubLorebooks(query: string, limit: number = 20): Promise<string[]> {
    try {
        // Use the SAME search pattern as character import (which works!)
        const params = new URLSearchParams({
            first: limit.toString(),
            page: '1',
            namespace: 'lorebooks',
            include_forks: 'true',
            nsfw: 'true',
            nsfl: 'true',
            chub: 'true',
            sort: 'star_count'
        });

        if (query) params.set('search', query);

        const searchUrl = `${CHUB_GATEWAY_SEARCH}?${params.toString()}`;
        console.log(`🔍 Searching: ${searchUrl}\n`);

        const response = await fetch(searchUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "application/json",
                "Referer": "https://chub.ai/"
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data: any = await response.json();
        const nodes = data.data?.nodes || data.nodes || [];

        console.log(`Found ${nodes.length} lorebook(s)\n`);

        return nodes
            .filter((n: any) => n.fullPath || n.id)
            .map((n: any) => n.fullPath || `lorebooks/${n.id}`);
    } catch (error: any) {
        console.error(`❌ Search failed:`, error.message);
        return [];
    }
}

/**
 * Process multiple lorebooks with controlled concurrency
 */
async function processWithConcurrency(
    lorebookPaths: string[],
    userId: string,
    concurrency: number
): Promise<void> {
    let completed = 0;
    let skipped = 0;
    let failed = 0;
    const total = lorebookPaths.length;

    const activePromises = new Set<Promise<void>>();

    for (const path of lorebookPaths) {
        const promise = (async () => {
            const lorebook = await fetchChubLorebook(path);
            if (lorebook) {
                const result = await importChubLorebook(lorebook, userId);
                if (result.success) {
                    if (result.skipped) skipped++;
                    else completed++;
                } else {
                    failed++;
                }
            } else {
                failed++;
            }
        })();

        activePromises.add(promise);
        promise.finally(() => activePromises.delete(promise));

        if (activePromises.size >= concurrency) {
            await Promise.race(activePromises);
        }
    }

    await Promise.all(activePromises);

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Imported: ${completed}`);
    console.log(`   ⏩ Skipped: ${skipped}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📦 Total: ${total}\n`);
}

/**
 * Main function
 */
async function main() {
    const args = process.argv.slice(2);

    const userIdIndex = args.indexOf('--userId');
    const userId = userIdIndex !== -1 ? args[userIdIndex + 1] : null;

    if (!userId) {
        console.error('❌ Error: --userId is required');
        process.exit(1);
    }

    // Concurrency
    const concurrencyIndex = args.indexOf('--concurrency');
    const concurrency = concurrencyIndex !== -1
        ? parseInt(args[concurrencyIndex + 1], 10)
        : Math.max(2, Math.floor(cpus().length / 2));

    console.log(`\n🚀 ChubAI Lorebook Scraper (Enhanced)\n`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Concurrency: ${concurrency}\n`);

    // Single lorebook import
    const idIndex = args.indexOf('--id');
    if (idIndex !== -1) {
        const lorebookId = args[idIndex + 1];
        const lorebookPath = lorebookId.startsWith('lorebooks/') ? lorebookId : `lorebooks/${lorebookId}`;

        const lorebook = await fetchChubLorebook(lorebookPath);
        if (lorebook) {
            await importChubLorebook(lorebook, userId);
        }
        return;
    }

    // Search and import
    const searchIndex = args.indexOf('--search');
    if (searchIndex !== -1) {
        const query = args[searchIndex + 1];
        const limitIndex = args.indexOf('--limit');
        const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1], 10) : 20;

        const lorebookPaths = await searchChubLorebooks(query, limit);
        if (lorebookPaths.length > 0) {
            await processWithConcurrency(lorebookPaths, userId, concurrency);
        }
        return;
    }

    console.error('❌ Error: Please provide --search or --id');
    console.log('\nUsage:');
    console.log('  Search: npx tsx scripts/chub-lorebook-scraper-enhanced.ts --search "fantasy" --userId <user-id>');
    console.log('  Single: npx tsx scripts/chub-lorebook-scraper-enhanced.ts --id <lorebook-id> --userId <user-id>');
    process.exit(1);
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
