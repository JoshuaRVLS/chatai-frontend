/**
 * Bulk Lorebook Generator
 * 
 * Generates multiple test lorebook JSON files for testing the import scripts
 * 
 * Usage:
 *   npx tsx scripts/generate-test-lorebooks.ts --count 10 --output ./test-lorebooks
 */

import * as fs from 'fs/promises';
import * as path from 'path';

interface GeneratorOptions {
    count: number;
    outputDir: string;
    minEntries: number;
    maxEntries: number;
}

const THEMES = [
    'Fantasy', 'Sci-Fi', 'Cyberpunk', 'Steampunk', 'Post-Apocalyptic',
    'Medieval', 'Space Opera', 'Urban Fantasy', 'Noir', 'Western',
    'Horror', 'Mystery', 'Romance', 'Adventure', 'Supernatural'
];

const LOCATIONS = [
    'Kingdom', 'City', 'Empire', 'Republic', 'Federation',
    'Colony', 'Station', 'Realm', 'Domain', 'Territory',
    'Sector', 'District', 'Province', 'Region', 'Zone'
];

const LOCATION_DESCRIPTORS = [
    'Ancient', 'Forgotten', 'Lost', 'Hidden', 'Sacred',
    'Cursed', 'Blessed', 'Eternal', 'Ruined', 'Majestic',
    'Crystal', 'Shadow', 'Golden', 'Silver', 'Dark',
    'Light', 'Mystic', 'Azure', 'Crimson', 'Emerald'
];

const ORGANIZATIONS = [
    'Guild', 'Order', 'Covenant', 'Alliance', 'Syndicate',
    'Brotherhood', 'Sisterhood', 'Council', 'Assembly', 'Collective',
    'Faction', 'Movement', 'Society', 'League', 'Union'
];

const ARTIFACTS = [
    'Amulet', 'Sword', 'Staff', 'Crown', 'Ring',
    'Orb', 'Tome', 'Relic', 'Crystal', 'Scepter',
    'Shield', 'Armor', 'Cloak', 'Scroll', 'Gem'
];

const ADJECTIVES = [
    'Powerful', 'Ancient', 'Legendary', 'Mysterious', 'Forbidden',
    'Sacred', 'Cursed', 'Enchanted', 'Divine', 'Demonic',
    'Ethereal', 'Arcane', 'Primal', 'Cosmic', 'Temporal'
];

/**
 * Generate a random element from an array
 */
function random<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generate a random integer between min and max (inclusive)
 */
function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a location entry
 */
function generateLocationEntry() {
    const descriptor = random(LOCATION_DESCRIPTORS);
    const type = random(LOCATIONS);
    const name = `${descriptor} ${type}`;

    const descriptions = [
        `${name} is a ${random(['thriving', 'declining', 'mysterious', 'bustling', 'quiet'])} settlement known for its ${random(['architecture', 'culture', 'resources', 'inhabitants', 'history'])}.`,
        `The ${name} has stood for ${randomInt(100, 5000)} years, serving as a ${random(['trading hub', 'military outpost', 'cultural center', 'sacred site', 'refuge'])}.`,
        `Located in the ${random(['north', 'south', 'east', 'west', 'center'])}, ${name} is ${random(['feared', 'revered', 'sought after', 'avoided', 'protected'])} by travelers.`
    ];

    return {
        keywords: [name, descriptor, type, name.toLowerCase()],
        content: random(descriptions),
        enabled: true
    };
}

/**
 * Generate an organization entry
 */
function generateOrganizationEntry() {
    const descriptor = random(ADJECTIVES);
    const type = random(ORGANIZATIONS);
    const name = `${descriptor} ${type}`;

    const purposes = [
        'protecting ancient knowledge',
        'maintaining balance in the realm',
        'seeking ultimate power',
        'preserving traditions',
        'exploring forbidden territories',
        'controlling trade routes',
        'researching arcane mysteries',
        'defending the innocent'
    ];

    const content = `The ${name} is a ${random(['secretive', 'public', 'powerful', 'declining', 'growing'])} organization dedicated to ${random(purposes)}. Members are ${random(['carefully selected', 'born into it', 'recruited from schools', 'chosen by prophecy', 'self-appointed'])}.`;

    return {
        keywords: [name, type, descriptor, name.toLowerCase()],
        content: content,
        enabled: true
    };
}

/**
 * Generate an artifact entry
 */
function generateArtifactEntry() {
    const descriptor = random(ADJECTIVES);
    const type = random(ARTIFACTS);
    const name = `${descriptor} ${type}`;

    const powers = [
        'grants immense power to its wielder',
        'can reshape reality itself',
        'protects against all harm',
        'reveals hidden truths',
        'controls the elements',
        'bends time and space',
        'commands the undead',
        'heals any wound'
    ];

    const content = `The ${name} is a legendary artifact that ${random(powers)}. It was ${random(['forged', 'discovered', 'created', 'blessed', 'cursed'])} in the ${random(['First Age', 'Time of Myths', 'Dark Era', 'Golden Age', 'Age of Heroes'])} and has ${random(['disappeared', 'resurfaced', 'been lost', 'changed hands', 'remained hidden'])} for centuries.`;

    return {
        keywords: [name, type, descriptor, name.toLowerCase(), 'artifact', 'relic'],
        content: content,
        enabled: true
    };
}

/**
 * Generate character/NPC entry
 */
function generateCharacterEntry() {
    const titles = [
        'Lord', 'Lady', 'King', 'Queen', 'Emperor', 'Empress',
        'Master', 'Mistress', 'Captain', 'Commander', 'General',
        'Archmage', 'High Priest', 'Chief', 'Elder', 'Champion'
    ];

    const names = [
        'Aetheron', 'Seraphina', 'Mordred', 'Lyra', 'Theron',
        'Celestia', 'Drakon', 'Aria', 'Valtor', 'Nyx',
        'Orion', 'Luna', 'Phoenix', 'Raven', 'Storm'
    ];

    const title = random(titles);
    const name = random(names);
    const fullName = `${title} ${name}`;

    const traits = [
        'wise and just',
        'cunning and ruthless',
        'brave and honorable',
        'mysterious and enigmatic',
        'charismatic and influential'
    ];

    const content = `${fullName} is a ${random(traits)} leader who ${random(['rules', 'commands', 'guides', 'protects', 'threatens'])} the ${random(LOCATIONS).toLowerCase()}. Known for their ${random(['strategic mind', 'magical prowess', 'combat skills', 'diplomatic abilities', 'ancient knowledge'])}, they have ${random(['united', 'divided', 'transformed', 'defended', 'conquered'])} their people.`;

    return {
        keywords: [fullName, name, title, fullName.toLowerCase()],
        content: content,
        enabled: true
    };
}

/**
 * Generate a complete lorebook
 */
function generateLorebook(index: number, options: GeneratorOptions) {
    const theme = random(THEMES);
    const entryCount = randomInt(options.minEntries, options.maxEntries);

    const entries = [];
    const entryTypes = [
        generateLocationEntry,
        generateOrganizationEntry,
        generateArtifactEntry,
        generateCharacterEntry
    ];

    for (let i = 0; i < entryCount; i++) {
        const generator = random(entryTypes);
        entries.push(generator());
    }

    return {
        name: `${theme} World Lore #${index}`,
        description: `Comprehensive lore collection for a ${theme.toLowerCase()} setting with ${entryCount} entries covering locations, organizations, artifacts, and key characters.`,
        entries: entries
    };
}

/**
 * Main function
 */
async function main() {
    const args = process.argv.slice(2);
    const countIndex = args.indexOf('--count');
    const outputIndex = args.indexOf('--output');
    const minEntriesIndex = args.indexOf('--min-entries');
    const maxEntriesIndex = args.indexOf('--max-entries');

    const options: GeneratorOptions = {
        count: countIndex !== -1 ? parseInt(args[countIndex + 1]) : 5,
        outputDir: outputIndex !== -1 ? args[outputIndex + 1] : './test-lorebooks',
        minEntries: minEntriesIndex !== -1 ? parseInt(args[minEntriesIndex + 1]) : 5,
        maxEntries: maxEntriesIndex !== -1 ? parseInt(args[maxEntriesIndex + 1]) : 15
    };

    console.log(`\n📚 Lorebook Generator`);
    console.log(`📁 Output directory: ${options.outputDir}`);
    console.log(`📊 Generating ${options.count} lorebook(s)`);
    console.log(`📝 Entries per lorebook: ${options.minEntries}-${options.maxEntries}\n`);

    // Create output directory
    try {
        await fs.mkdir(options.outputDir, { recursive: true });
    } catch (error: any) {
        console.error(`❌ Failed to create directory:`, error.message);
        return;
    }

    // Generate lorebooks
    const startTime = Date.now();
    let totalEntries = 0;

    for (let i = 1; i <= options.count; i++) {
        const lorebook = generateLorebook(i, options);
        const filename = `lorebook-${i.toString().padStart(3, '0')}.json`;
        const filepath = path.join(options.outputDir, filename);

        try {
            await fs.writeFile(filepath, JSON.stringify(lorebook, null, 2));
            totalEntries += lorebook.entries.length;
            console.log(`✅ Generated: ${filename} (${lorebook.entries.length} entries)`);
        } catch (error: any) {
            console.error(`❌ Failed to write ${filename}:`, error.message);
        }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\n${'═'.repeat(50)}`);
    console.log(`🎉 Generation completed in ${duration}s`);
    console.log(`✅ Created ${options.count} lorebook(s)`);
    console.log(`📝 Total entries: ${totalEntries}`);
    console.log(`📁 Location: ${path.resolve(options.outputDir)}`);
    console.log(`${'═'.repeat(50)}\n`);

    console.log(`\n💡 Next steps:`);
    console.log(`   Import all lorebooks:`);
    console.log(`   npx tsx scripts/lorebook-auto-import.ts \\`);
    console.log(`     --directory ${options.outputDir} \\`);
    console.log(`     --userId <your-user-id> \\`);
    console.log(`     --concurrency 10\n`);
}

main().catch(console.error);
