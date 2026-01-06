import { db } from "@/app/utils/prisma";
import formidable from "formidable";
import fs from "fs";
import { NextApiRequest } from "next";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
  try {
    const form = await req.formData();
    const image = form.get("image");
    const characterId = form.get("characterId") as string;
    const characterName = form.get("characterName") as string;
    const characterBio = form.get("characterBio") as string;
    const characterPersona = form.get("characterPersona") as string;
    const scenario = form.get("scenario") as string;
    const initialMessage = form.get("initialMessage") as string;
    const exampleConversations = form.get("exampleConversations") as string;
    const userId = form.get("userId") as string;
    const tags: { label: string; value: string }[] = JSON.parse(
      form.get("tags") as string
    );
    const lorebooks: string[] = JSON.parse(
      form.get("lorebooks") as string || "[]"
    );
    const isNsfw = form.get("isNsfw") === "true";

    const isNewImage = image instanceof File;
    const isEditing = !!characterId && characterId !== "undefined";

    if (isEditing) {
      // --- UPDATE LOGIC ---
      const updateData: any = {
        name: characterName,
        bio: characterBio,
        persona: characterPersona,
        introMessage: initialMessage,
        scenario: scenario,
        exampleConversations: exampleConversations,
        tags: {
          set: tags.map((tag) => ({ id: tag.value })),
        },
        lorebooks: {
          set: lorebooks.map((id) => ({ id })),
        },
        isNsfw: isNsfw,
      };

      if (isNewImage) {
        updateData.photo = {
          upsert: {
            create: {
              data: Buffer.from(await image.arrayBuffer()),
              mimetype: image.type,
              name: image.name,
            },
            update: {
              data: Buffer.from(await image.arrayBuffer()),
              mimetype: image.type,
              name: image.name,
            },
          },
        };
      }

      await db.character.update({
        where: { id: characterId },
        data: updateData,
      });

      return NextResponse.json({
        success: true,
        message: "Character updated successfully",
      });
    } else {
      // --- CREATE LOGIC ---
      const createData: any = {
        name: characterName,
        bio: characterBio,
        persona: characterPersona,
        introMessage: initialMessage,
        scenario: scenario,
        exampleConversations: exampleConversations,
        author: {
          connect: { id: userId },
        },
        tags: {
          connect: tags.map((tag) => ({ id: tag.value })),
        },
        lorebooks: {
          connect: lorebooks.map((id) => ({ id })),
        },
        isNsfw: isNsfw,
      };

      if (isNewImage) {
        createData.photo = {
          create: {
            data: Buffer.from(await image.arrayBuffer()),
            mimetype: image.type,
            name: image.name,
          },
        };
      }

      await db.character.create({
        data: createData,
      });

      return NextResponse.json({
        success: true,
        message: "Character created successfully",
      });
    }
  } catch (error: any) {
    console.error("Character save error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error during character save",
        details: error.message
      },
      { status: 500 }
    );
  }
};

export const GET = async (req: Request) => {
  try {
    const characters = await db.character.findMany({
      include: {
        author: true,
        photo: {
          select: {
            id: true,
            charId: true,
            mimetype: true,
            name: true,
            // data omitted
          }
        },
        tags: true
      },
    });
    return NextResponse.json({ success: true, data: characters });
  } catch (error) {
    console.log(error);
  }
};
