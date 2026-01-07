/**
 * Import Known ChubAI Lorebooks
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const KNOWN_LOREBOOKS = [
    'lorebooks/RosaIsIllegal/runa-world-base-fork',
    'lorebooks/Chickenmadness/fantasy-rpg-v016',
    'lorebooks/NeverendingStoryteller/final-fantasy-xvi',
    'lorebooks/Zanthoril/world-of-elendar-lorebook',
];

const USER_ID = 'cmk3aq9vi0000vmksfjul6xnc';

async function importLorebooks() {
    console.log(`\n📚 Importing ${KNOWN_LOREBOOKS.length} known lorebooks...\n`);

    for (const lorebookPath of KNOWN_LOREBOOKS) {
        console.log(`\n📖 Importing: ${lorebookPath}`);
        try {
            const { stdout, stderr } = await execAsync(
                `npx tsx scripts/chub-lorebook-scraper-enhanced.ts --id "${lorebookPath}" --userId ${USER_ID}`
            );
            console.log(stdout);
            if (stderr) console.error(stderr);
        } catch (error: any) {
            console.error(`❌ Failed to import ${lorebookPath}:`, error.message);
        }
    }

    console.log(`\n✅ Import process complete!\n`);
}

importLorebooks();
