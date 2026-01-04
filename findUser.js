
const { PrismaClient } = require("./app/generated/prisma");
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst();
    if (user) {
        console.log("USER_ID:" + user.id);
    } else {
        console.log("NO_USER_FOUND");
    }
    await prisma.$disconnect();
}

main();
