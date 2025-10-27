// Delete api page
import {db} from '@/app/utils/prisma';
import {NextResponse} from 'next/server';

export const GET =
    async (req: Request, {params}: {params: Promise<{id: string}>}) => {
  const characterId = (await params).id;

  try {
    const character = await db.character.findUnique({
      where: {
        id: characterId,
      },
      include: {author: true, photo: true, tags: true},
    });
    return NextResponse.json({success: true, data: character}, {status: 200});
  } catch (error) {
    console.log(error);
    return NextResponse.json(
        {success: false, error: 'Failed to fetch character'}, {status: 500});
  }
};

export const DELETE =
    async (req: Request, {params}: {params: Promise<{id: string}>}) => {
  const characterId = (await params).id;

  try {
    // First, find all chats related to this character
    const chats = await db.chat.findMany({
      where: {
        characterId: characterId,
      },
      select: {id: true}
    });

    const chatIds = chats.map(chat => chat.id);

    // Delete all messages in those chats
    if (chatIds.length > 0) {
      await db.message.deleteMany({where: {chatId: {in : chatIds}}});
    }

    // Delete all chats related to this character
    await db.chat.deleteMany({
      where: {
        characterId: characterId,
      }
    });

    // Delete all comments related to this character
    await db.comment.deleteMany({
      where: {
        characterId: characterId,
      }
    });

    // Remove this character from all tags
    await db.characterTag.updateMany({
      where: {charIds: {has: characterId}},
      data: {
        charIds: {
          set:
              await db.characterTag
                  .findMany({where: {charIds: {has: characterId}}})
                  .then(tags => tags.map(tag => ({
                                           ...tag,
                                           charIds: tag.charIds.filter(
                                               id => id !== characterId)
                                         })))
                  .then(
                      updatedTags => updatedTags.map(tag => tag.charIds).flat())
        }
      }
    });

    // Delete character image if exists
    await db.characterImage.deleteMany({
      where: {
        charId: characterId,
      }
    });

    // Finally, delete the character
    await db.character.delete({
      where: {
        id: characterId,
      },
    });

    return NextResponse.json(
        {
          success: true,
          message: 'Character and all related data deleted successfully'
        },
        {status: 200});
  } catch (error) {
    console.log(error);
    return NextResponse.json(
        {success: false, error: 'Failed to delete character'}, {status: 500});
  }
};