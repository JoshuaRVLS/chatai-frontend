import { PrismaClient } from '../app/generated/prisma';
const prisma = new PrismaClient();

async function main() {
    // Delete in order respecting all relations
    const deletedMessages = await prisma.message.deleteMany();
    console.log('Deleted', deletedMessages.count, 'messages');

    const deletedChats = await prisma.chat.deleteMany();
    console.log('Deleted', deletedChats.count, 'chats');

    const deletedComments = await prisma.comment.deleteMany();
    console.log('Deleted', deletedComments.count, 'comments');

    const deletedImages = await prisma.characterImage.deleteMany();
    console.log('Deleted', deletedImages.count, 'character images');

    const deletedChars = await prisma.character.deleteMany();
    console.log('Deleted', deletedChars.count, 'characters');

    console.log('\n✅ Database cleaned successfully!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
