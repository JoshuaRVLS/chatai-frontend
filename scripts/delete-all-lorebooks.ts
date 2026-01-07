/**
 * Delete ALL lorebooks from the database
 */

import { PrismaClient } from '../app/generated/prisma';

const prisma = new PrismaClient();

async function main() {
    console.log('\n🗑️  Deleting ALL lorebooks...\n');

    const count = await prisma.lorebook.count();
    console.log(`Found ${count} lorebook(s) to delete\n`);

    if (count === 0) {
        console.log('✅ No lorebooks to delete. Database is clean!\n');
        return;
    }

    // Delete all lorebooks (cascade will delete entries and images)
    const result = await prisma.lorebook.deleteMany({});

    console.log(`✅ Deleted ${result.count} lorebook(s)\n`);
    console.log('📊 Database is now clean and ready for fresh import\n');
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
