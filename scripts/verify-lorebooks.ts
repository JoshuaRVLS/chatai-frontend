/**
 * Quick script to verify lorebook imports
 * Lists all lorebooks in the database with entry counts
 */

import { PrismaClient } from '../app/generated/prisma';

const prisma = new PrismaClient();

async function main() {
    console.log('\n📊 Lorebook Database Summary\n');

    const lorebooks = await prisma.lorebook.findMany({
        include: {
            entries: true,
            user: {
                select: {
                    username: true
                }
            },
            characters: {
                select: {
                    name: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    if (lorebooks.length === 0) {
        console.log('No lorebooks found in database.\n');
        return;
    }

    console.log(`Total Lorebooks: ${lorebooks.length}\n`);
    console.log('═'.repeat(80));

    let totalEntries = 0;

    lorebooks.forEach((lb, index) => {
        totalEntries += lb.entries.length;

        console.log(`\n${index + 1}. ${lb.name}`);
        console.log(`   📝 Entries: ${lb.entries.length}`);
        console.log(`   👤 Owner: ${lb.user.username}`);
        if (lb.description) {
            console.log(`   📄 Description: ${lb.description.substring(0, 60)}${lb.description.length > 60 ? '...' : ''}`);
        }
        if (lb.characters.length > 0) {
            console.log(`   🔗 Linked Characters: ${lb.characters.map(c => c.name).join(', ')}`);
        }
        console.log(`   🕐 Created: ${lb.createdAt.toISOString()}`);
    });

    console.log('\n' + '═'.repeat(80));
    console.log(`\n📊 Summary:`);
    console.log(`   Total Lorebooks: ${lorebooks.length}`);
    console.log(`   Total Entries: ${totalEntries}`);
    console.log(`   Average Entries per Lorebook: ${(totalEntries / lorebooks.length).toFixed(1)}\n`);
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
