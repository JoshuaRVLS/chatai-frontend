const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const rawToken = process.argv[2];

    if (!rawToken) {
        console.error('Error: Please provide a security token as an argument.');
        console.log('Usage: node scripts/set-admin-token.js <token>');
        process.exit(1);
    }
    const salt = await bcrypt.genSalt(12);
    const hashedToken = await bcrypt.hash(rawToken, salt);

    console.log('--- Administrator Security Token Initialization ---');
    console.log('Target Key: ADMIN_SECURITY_TOKEN');
    console.log('Status: Hashing token...');

    try {
        await prisma.systemSetting.upsert({
            where: { key: 'ADMIN_SECURITY_TOKEN' },
            update: { value: hashedToken },
            create: {
                key: 'ADMIN_SECURITY_TOKEN',
                value: hashedToken,
            },
        });
        console.log('SUCCESS: Admin Security Token has been securely encrypted and stored in the database.');
    } catch (error) {
        console.error('FAILURE: Could not store security token:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
