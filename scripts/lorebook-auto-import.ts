/**
 * Lorebook Auto-Import Tool with Parallel Processing
 * 
 * Imports lorebooks from JSON files with multi-threading support for maximum CPU utilization.
 * 
 * Supported formats:
 * - ChubAI Lorebook JSON export
 * - SillyTavern Lorebook format
 * - Custom JSON format
 * 
 * Usage: 
 *   npx tsx scripts/lorebook-auto-import.ts --file ./lorebooks.json --userId <user-id>
 *   npx tsx scripts/lorebook-auto-import.ts --directory ./lorebooks --userId <user-id> --concurrency 10
 *   npx tsx scripts/lorebook-auto-import.ts --url https://example.com/lorebooks.json --userId <user-id>
 */

import { PrismaClient } from '../app/generated/prisma';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Worker } from 'worker_threads';
import { cpus } from 'os';

const prisma = new PrismaClient();

// Type definitions for lorebook formats
interface LoreEntry {
    keywords: string[];
    content: string;
    enabled?: boolean;
}

interface LorebookData {
    name: string;
    description?: string;
    entries: LoreEntry[];
    // ChubAI specific
    topics?: string[];
    // SillyTavern specific
    extensions?: {
        world_info?: {
            entries: Array<{
                keys: string[];
                content: string;
                enabled?: boolean;
            }>;
        };
    };
}

interface ImportResult {
    success: boolean;
    lorebookName?: string;
    entriesCount?: number;
    skipped?: boolean;
    error?: string;
}

/**
 * Parse different lorebook formats into a unified structure
 */
function normalizeLorebookData(data: any): LorebookData | null {
    try {
        // ChubAI format detection
        if (data.name && Array.isArray(data.entries)) {
            return {
                name: data.name,
                description: data.description || '',
                entries: data.entries.map((entry: any) => ({
                    keywords: Array.isArray(entry.keywords) ? entry.keywords : [entry.keyword || ''],
                    content: entry.content || '',
                    enabled: entry.enabled !== false
                }))
            };
        }

        // SillyTavern format
        if (data.extensions?.world_info?.entries) {
            return {
                name: data.name || 'Imported Lorebook',
                description: data.description || '',
                entries: data.extensions.world_info.entries.map((entry: any) => ({
                    keywords: entry.keys || [],
                    content: entry.content || '',
                    enabled: entry.enabled !== false
                }))
            };
        }

        // Custom simple format
        if (data.lorebook && data.lorebook.entries) {
            return {
                name: data.lorebook.name || 'Imported Lorebook',
                description: data.lorebook.description || '',
                entries: data.lorebook.entries.map((entry: any) => ({
                    keywords: Array.isArray(entry.keywords) ? entry.keywords : [entry.keyword || ''],
                    content: entry.content || '',
                    enabled: entry.enabled !== false
                }))
            };
        }

        console.error('❌ Unknown lorebook format');
        return null;
    } catch (error: any) {
        console.error('❌ Error parsing lorebook data:', error.message);
        return null;
    }
}

/**
 * Import a single lorebook into the database
 */
async function importSingleLorebook(
    lorebookData: LorebookData,
    userId: string,
    characterIds: string[] = []
): Promise<ImportResult> {
    try {
        // Check if lorebook already exists
        const existing = await prisma.lorebook.findFirst({
            where: {
                name: lorebookData.name,
                userId: userId
            }
        });

        if (existing) {
            console.log(`⏩ Skipping: "${lorebookData.name}" (Already exists)`);
            return { success: true, skipped: true };
        }

        // Create lorebook with entries
        const lorebook = await prisma.lorebook.create({
            data: {
                name: lorebookData.name,
                description: lorebookData.description || '',
                userId: userId,
                entries: {
                    create: lorebookData.entries.map(entry => ({
                        keywords: entry.keywords,
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
        return {
            success: true,
            lorebookName: lorebook.name,
            entriesCount: lorebook.entries.length
        };
    } catch (error: any) {
        console.error(`❌ Failed to import "${lorebookData.name}":`, error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Process a JSON file and import the lorebook
 */
async function processLorebookFile(
    filePath: string,
    userId: string,
    characterIds: string[] = []
): Promise<ImportResult> {
    try {
        console.log(`📖 Reading: ${path.basename(filePath)}`);
        const content = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(content);

        const normalized = normalizeLorebookData(data);
        if (!normalized) {
            return { success: false, error: 'Invalid format' };
        }

        return await importSingleLorebook(normalized, userId, characterIds);
    } catch (error: any) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Fetch lorebook from URL and import
 */
async function processLorebookUrl(
    url: string,
    userId: string,
    characterIds: string[] = []
): Promise<ImportResult> {
    try {
        console.log(`🌐 Fetching: ${url}`);
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const normalized = normalizeLorebookData(data);

        if (!normalized) {
            return { success: false, error: 'Invalid format' };
        }

        return await importSingleLorebook(normalized, userId, characterIds);
    } catch (error: any) {
        console.error(`❌ Error fetching ${url}:`, error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Process multiple files in parallel with concurrency control
 */
async function processFilesInParallel(
    files: string[],
    userId: string,
    concurrency: number,
    characterIds: string[] = []
): Promise<ImportResult[]> {
    const results: ImportResult[] = [];
    const queue = [...files];
    const activePromises: Promise<void>[] = [];

    while (queue.length > 0 || activePromises.length > 0) {
        // Fill up to concurrency limit
        while (activePromises.length < concurrency && queue.length > 0) {
            const file = queue.shift()!;

            const promise = (async () => {
                const result = await processLorebookFile(file, userId, characterIds);
                results.push(result);
            })().finally(() => {
                const index = activePromises.indexOf(promise);
                if (index > -1) {
                    activePromises.splice(index, 1);
                }
            });

            activePromises.push(promise);
        }

        // Wait for at least one to complete
        if (activePromises.length > 0) {
            await Promise.race(activePromises);
        }
    }

    return results;
}

/**
 * Scan directory for JSON files
 */
async function scanDirectory(dirPath: string): Promise<string[]> {
    const files: string[] = [];

    try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);

            if (entry.isDirectory()) {
                // Recursively scan subdirectories
                const subFiles = await scanDirectory(fullPath);
                files.push(...subFiles);
            } else if (entry.isFile() && entry.name.endsWith('.json')) {
                files.push(fullPath);
            }
        }
    } catch (error: any) {
        console.error(`❌ Error scanning directory ${dirPath}:`, error.message);
    }

    return files;
}

/**
 * Main function
 */
async function main() {
    const args = process.argv.slice(2);
    const fileIndex = args.indexOf('--file');
    const dirIndex = args.indexOf('--directory');
    const urlIndex = args.indexOf('--url');
    const userIdIndex = args.indexOf('--userId');
    const concurrencyIndex = args.indexOf('--concurrency');
    const characterIdsIndex = args.indexOf('--characters');

    // Get userId (required)
    if (userIdIndex === -1 || !args[userIdIndex + 1]) {
        console.error('❌ Error: --userId is required');
        console.log('\nUsage:');
        console.log('  --file <path>           Import single JSON file');
        console.log('  --directory <path>      Import all JSON files in directory (recursive)');
        console.log('  --url <url>             Import from URL');
        console.log('  --userId <id>           User ID (required)');
        console.log('  --characters <id,id>    Comma-separated character IDs to link');
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

    console.log(`\n🚀 Lorebook Auto-Import Tool`);
    console.log(`👤 User ID: ${userId}`);
    console.log(`⚡ Max Concurrency: ${maxConcurrency}`);
    if (characterIds.length > 0) {
        console.log(`🔗 Linking to ${characterIds.length} character(s)`);
    }
    console.log('');

    const startTime = Date.now();
    let results: ImportResult[] = [];

    // Single file import
    if (fileIndex !== -1) {
        const filePath = args[fileIndex + 1];
        if (!filePath) {
            console.error('❌ Error: --file requires a path');
            return;
        }

        const result = await processLorebookFile(filePath, userId, characterIds);
        results = [result];
    }
    // Directory import (parallel)
    else if (dirIndex !== -1) {
        const dirPath = args[dirIndex + 1];
        if (!dirPath) {
            console.error('❌ Error: --directory requires a path');
            return;
        }

        console.log(`📂 Scanning directory: ${dirPath}\n`);
        const files = await scanDirectory(dirPath);
        console.log(`📋 Found ${files.length} JSON file(s)\n`);

        if (files.length === 0) {
            console.log('ℹ️  No JSON files found');
            return;
        }

        results = await processFilesInParallel(files, userId, maxConcurrency, characterIds);
    }
    // URL import
    else if (urlIndex !== -1) {
        const url = args[urlIndex + 1];
        if (!url) {
            console.error('❌ Error: --url requires a URL');
            return;
        }

        const result = await processLorebookUrl(url, userId, characterIds);
        results = [result];
    }
    else {
        console.error('❌ Error: Must specify --file, --directory, or --url');
        return;
    }

    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const successful = results.filter(r => r.success && !r.skipped).length;
    const skipped = results.filter(r => r.skipped).length;
    const failed = results.filter(r => !r.success).length;
    const totalEntries = results
        .filter(r => r.entriesCount)
        .reduce((sum, r) => sum + (r.entriesCount || 0), 0);

    console.log(`\n${'═'.repeat(50)}`);
    console.log(`🎉 Import completed in ${duration}s`);
    console.log(`✅ Successfully imported: ${successful} lorebook(s)`);
    console.log(`📝 Total entries: ${totalEntries}`);
    if (skipped > 0) console.log(`⏩ Skipped (duplicates): ${skipped}`);
    if (failed > 0) console.log(`❌ Failed: ${failed}`);
    console.log(`${'═'.repeat(50)}\n`);
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
