/**
 * Chub.ai Batch Scraper Script
 * 
 * Usage: npx tsx scripts/chub-batch-scraper.ts --search "Genshin" --pages 1
 */

import fs from 'fs';
import path from 'path';

const CHUB_GATEWAY = "https://gateway.chub.ai/api";

async function main() {
    const args = process.argv.slice(2);
    const searchIndex = args.indexOf('--search');
    const pagesIndex = args.indexOf('--pages');

    const query = searchIndex !== -1 ? args[searchIndex + 1] : 'popular';
    const maxPages = pagesIndex !== -1 ? parseInt(args[pagesIndex + 1]) : 1;

    console.log(`\n🚀 Starting Chub.ai scraper for: "${query}" (${maxPages} pages)\n`);

    const allCharacters: any[] = [];

    for (let page = 1; page <= maxPages; page++) {
        console.log(`📄 Fetching page ${page}...`);
        try {
            const searchUrl = `${CHUB_GATEWAY}/characters?search=${encodeURIComponent(query)}&first=20&page=${page}&sort=star_count&operator=and`;
            const response = await fetch(searchUrl);

            if (!response.ok) {
                console.error(`❌ Failed to fetch page ${page}: ${response.statusText}`);
                continue;
            }

            const data = await response.json();
            const results = data.data?.searchCharacters?.edges || [];

            console.log(`✅ Found ${results.length} characters on page ${page}`);

            for (const edge of results) {
                const { node } = edge;
                console.log(`   - [${node.id}] ${node.name} by ${node.fullPath.split('/')[0]}`);

                // Fetch full details
                try {
                    const detailUrl = `${CHUB_GATEWAY}/characters/${node.fullPath}?full=true`;
                    const detailRes = await fetch(detailUrl);
                    if (detailRes.ok) {
                        const detailData = await detailRes.json();
                        allCharacters.push(detailData.node);
                    }
                } catch (e) {
                    console.error(`     ⚠️ Failed to fetch details for ${node.name}`);
                }
            }
        } catch (error) {
            console.error(`❌ Error on page ${page}:`, error);
        }
    }

    const outputPath = path.join(process.cwd(), `chub_export_${query.replace(/\s+/g, '_')}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(allCharacters, null, 2));

    console.log(`\n🎉 Scrape completed!`);
    console.log(`📂 Saved ${allCharacters.length} characters to: ${outputPath}\n`);
}

main().catch(console.error);
