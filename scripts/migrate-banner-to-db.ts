
import { db } from '@/app/utils/prisma';
import fs from 'fs/promises';
import path from 'path';

async function main() {
    console.log('Migrating Happy New Year Banner to Database...');

    const banners = await db.banner.findMany({
        where: { imageUrl: { contains: 'happy_new_year' } }
    });

    if (banners.length === 0) {
        console.log('No file-based banner found to migrate.');
        return;
    }

    const banner = banners[0];
    const filePath = path.join(process.cwd(), 'public', 'banners', 'happy_new_year_2026.png');

    try {
        const fileBuffer = await fs.readFile(filePath);

        await db.banner.update({
            where: { id: banner.id },
            data: {
                imageData: fileBuffer,
                imageType: 'image/png',
                imageUrl: null // Clear the file path so it forces DB usage
            }
        });

        console.log(`Banner "${banner.title}" migrated to DB storage successfully.`);

        // Optional: Delete the file
        // await fs.unlink(filePath);
        // console.log('Old file deleted.');
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });
