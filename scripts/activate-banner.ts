
import { db } from '@/app/utils/prisma';

async function main() {
    console.log('Activating Happy New Year Banner...');

    await db.banner.create({
        data: {
            imageUrl: '/banners/happy_new_year_2026.png',
            title: 'Happy New Year 2026!',
            link: '/create_character',
            isActive: true,
            order: 1,
        }
    });

    console.log('Banner activated successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });
