
import { db } from '@/app/utils/prisma';

async function main() {
    const banners = await db.banner.findMany({
        select: {
            id: true,
            title: true,
            imageType: true,
            imageUrl: true,
            isActive: true,
            imageData: true,
        }
    });

    console.log('BANNERS IN DB:');
    banners.forEach(b => {
        console.log(`- ID: ${b.id}`);
        console.log(`  Title: ${b.title}`);
        console.log(`  Type: ${b.imageType}`);
        console.log(`  External URL: ${b.imageUrl}`);
        console.log(`  Has Data: ${!!b.imageData} (Size: ${b.imageData?.length || 0})`);
        console.log(`  Active: ${b.isActive}`);
        console.log('---');
    });
}

main().catch(console.error).finally(() => db.$disconnect());
