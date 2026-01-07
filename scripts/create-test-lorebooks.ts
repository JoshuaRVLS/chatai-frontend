/**
 * Create test lorebooks with all ChubAI features
 */

import { PrismaClient } from '../app/generated/prisma';

const prisma = new PrismaClient();
const USER_ID = 'cmk3aq9vi0000vmksfjul6xnc';

async function main() {
    console.log('\n📚 Creating test lorebooks with all ChubAI features...\n');

    // Create tags
    const tags = await Promise.all([
        prisma.lorebookTag.upsert({ where: { name: 'Fantasy' }, update: {}, create: { name: 'Fantasy' } }),
        prisma.lorebookTag.upsert({ where: { name: 'RPG' }, update: {}, create: { name: 'RPG' } }),
        prisma.lorebookTag.upsert({ where: { name: 'Medieval' }, update: {}, create: { name: 'Medieval' } }),
        prisma.lorebookTag.upsert({ where: { name: 'Magic' }, update: {}, create: { name: 'Magic' } }),
    ]);

    // Create lorebook 1: High scan depth, high token budget, recursive ON
    const lb1 = await prisma.lorebook.create({
        data: {
            name: 'The Realm of Eldoria',
            description: 'A comprehensive fantasy world with deep lore and magic systems',
            scanDepth: 8,
            tokenBudget: 2048,
            recursiveScanning: true,
            userId: USER_ID,
            tags: {
                connect: [{ id: tags[0].id }, { id: tags[1].id }, { id: tags[3].id }]
            },
            entries: {
                create: [
                    {
                        keywords: ['Eldoria', 'Kingdom', 'Capital'],
                        content: 'Eldoria is the grand kingdom at the heart of the realm, ruled by the Starlight Dynasty. The capital city, Lumina, is known for its crystal towers that glow at night.',
                        enabled: true
                    },
                    {
                        keywords: ['Magic', 'Arcane', 'Spells'],
                        content: 'Magic in Eldoria flows through ley lines that crisscross the land. Mages must attune to these lines to cast powerful spells, making location crucial for magical combat.',
                        enabled: true
                    },
                    {
                        keywords: ['Dragons', 'Ancients'],
                        content: 'The Ancient Dragons are the oldest beings in Eldoria. They once ruled the skies but now slumber in hidden lairs, waiting for the stars to align.',
                        enabled: true
                    }
                ]
            }
        }
    });

    console.log(`✅ Created: ${lb1.name} (Depth:8, Budget:2048, Recursive:ON, 3 tags, 3 entries)`);

    // Create lorebook 2: Medium settings
    const lb2 = await prisma.lorebook.create({
        data: {
            name: 'Modern Urban Fantasy Guide',
            description: 'A lorebook detailing the hidden magical world within modern cities',
            scanDepth: 4,
            tokenBudget: 512,
            recursiveScanning: false,
            userId: USER_ID,
            tags: {
                connect: [{ id: tags[0].id }, { id: tags[3].id }]
            },
            entries: {
                create: [
                    {
                        keywords: ['Masquerade', 'Hidden World'],
                        content: 'The Masquerade is the strict code that prevents humans from discovering the supernatural. Breaking it results in severe punishment from the Council.',
                        enabled: true
                    },
                    {
                        keywords: ['Council', 'Elders'],
                        content: 'The Council of Elders governs all supernatural beings in the city. They meet in the abandoned subway station beneath Central Park.',
                        enabled: true
                    }
                ]
            }
        }
    });

    console.log(`✅ Created: ${lb2.name} (Depth:4, Budget:512, Recursive:OFF, 2 tags, 2 entries)`);

    // Create lorebook 3: Low settings
    const lb3 = await prisma.lorebook.create({
        data: {
            name: 'Quick Reference: Medieval Titles',
            description: 'A simple guide to medieval nobility ranks and titles',
            scanDepth: 2,
            tokenBudget: 256,
            recursiveScanning: false,
            userId: USER_ID,
            tags: {
                connect: [{ id: tags[2].id }]
            },
            entries: {
                create: [
                    {
                        keywords: ['King', 'Queen', 'Royalty'],
                        content: 'The King and Queen are the highest rulers of the kingdom, answering only to the gods themselves.',
                        enabled: true
                    },
                    {
                        keywords: ['Duke', 'Duchess', 'Noble'],
                        content: 'Dukes and Duchesses rule over large territories called duchies, serving directly under the crown.',
                        enabled: true
                    },
                    {
                        keywords: ['Knight', 'Sir'],
                        content: 'Knights are warriors granted noble status through demonstrated valor. They swear oaths of loyalty to their lords.',
                        enabled: true
                    }
                ]
            }
        }
    });

    console.log(`✅ Created: ${lb3.name} (Depth:2, Budget:256, Recursive:OFF, 1 tag, 3 entries)`);

    console.log(`\n📊 Summary: 3 lorebooks created with varying configurations!`);
    console.log(`\n💡 Test the features:`);
    console.log(`   1. Visit: http://localhost:3000/lorebooks`);
    console.log(`   2. See the different scan depths and token budgets`);
    console.log(`   3. Check the tags on each card`);
    console.log(`   4. Create a new lorebook with an avatar image!\n`);
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
