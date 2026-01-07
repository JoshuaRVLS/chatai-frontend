/**
 * Delete all lorebooks with 0 entries
 */

import { PrismaClient } from '../app/generated/prisma';

const prisma = new PrismaClient();

async function main() {
    console.log('\n🗑️  Cleaning up empty lorebooks...\n');

    // Find all lorebooks with 0 entries
    const emptyLorebooks = await prisma.lorebook.findMany({
        include: {
            _count: {
                select: { entries: true }
            }
        }
    });

    const toDelete = emptyLorebooks.filter(lb => lb._count.entries === 0);

    if (toDelete.length === 0) {
        console.log('✅ No empty lorebooks found. Database is clean!\n');
        return;
    }

    console.log(`Found ${toDelete.length} empty lorebook(s):\n`);
    toDelete.forEach((lb, i) => {
        console.log(`${i + 1}. "${lb.name}" (ID: ${lb.id})`);
    });

    console.log('\n🗑️  Deleting...\n');

    // Delete all empty lorebooks
    const result = await prisma.lorebook.deleteMany({
        where: {
            id: {
                in: toDelete.map(lb => lb.id)
            }
        }
    });

    console.log(`✅ Deleted ${result.count} empty lorebook(s)\n`);

    // Summary
    const remaining = await prisma.lorebook.count();
    console.log(`📊 Remaining lorebooks: ${remaining}\n`);
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
