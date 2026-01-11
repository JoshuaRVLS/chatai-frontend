const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const args = process.argv.slice(2);

    if (args.length < 3) {
        console.error('Error: Missing arguments.');
        console.log('Usage: node scripts/create-admin.js <username> <email> <password>');
        process.exit(1);
    }

    const [username, email, password] = args;

    console.log('--- Create Admin Account ---');
    console.log(`Username: ${username}`);
    console.log(`Email:    ${email}`);
    console.log('Status:   Creating account...');

    try {
        // Check if user exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { username },
                    { email }
                ]
            }
        });

        if (existingUser) {
            console.error('FAILURE: User with this username or email already exists.');
            process.exit(1);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                isAdmin: true,
                isWhitelisted: true, // Admins should be whitelisted
                verified: true,      // Admins should be verified
            }
        });

        console.log(`SUCCESS: Admin account created for ${user.username} (${user.id})`);
    } catch (error) {
        console.error('FAILURE: Could not create admin account:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
