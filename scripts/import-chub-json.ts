/**
 * Chub.ai JSON to Database Importer
 * 
 * Usage: npx tsx scripts/import-chub-json.ts --file chub_export_Genshin.json
 */

import { PrismaClient } from '../app/generated/prisma';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const DEFAULT_USER_ID = "cmdgxw4200000ua60gmk4m351";

async function main() {
    const args = process.argv.slice(2);
    const fileIndex = args.indexOf('--file');

    if (fileIndex === -1) {
        console.error("❌ Please provide a JSON file path using --file");
        return;
    }

    const filePath = path.resolve(process.cwd(), args[fileIndex + 1]);
    if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        return;
    }

    const rawData = fs.readFileSync(filePath, 'utf-8');
    const characters = JSON.parse(rawData);

    console.log(`\n📦 Importing ${characters.length} characters to user ID: ${DEFAULT_USER_ID}\n`);

    for (const char of characters) {
        try {
            // 1. Handle Tags
            const tagIds: string[] = [];
            const topics = char.topics || [];

            for (const topicName of topics) {
                const tag = await prisma.characterTag.upsert({
                    where: { name: topicName } as any, // Simple check, might need 'name' to be unique in schema
                    update: {},
                    create: { name: topicName }
                });
                tagIds.push(tag.id);
            }

            // 2. Create Character
            const newChar = await prisma.character.create({
                data: {
                    name: char.name,
                    bio: char.description || char.tagline || "",
                    persona: char.definition?.personality || char.definition?.description || "",
                    scenario: char.definition?.scenario || "",
                    introMessage: char.definition?.first_mes || "",
                    exampleConversations: char.definition?.mes_example || "",
                    isNsfw: topics.some((t: string) => t.toLowerCase() === "nsfw" || t.toLowerCase() === "mature"),
                    authorId: DEFAULT_USER_ID,
                    tagIds: tagIds
                }
            });

            // 3. Handle Image (External URL to Bytes)
            if (char.definition?.avatar) {
                try {
                    const imgRes = await fetch(char.definition.avatar);
                    if (imgRes.ok) {
                        const buffer = await imgRes.arrayBuffer();
                        await prisma.characterImage.create({
                            data: {
                                charId: newChar.id,
                                name: `${char.name}_avatar`,
                                mimetype: imgRes.headers.get("content-type") || "image/png",
                                data: Buffer.from(buffer)
                            }
                        });
                        console.log(`✅ [${newChar.id}] ${char.name} (with image)`);
                    } else {
                        console.log(`✅ [${newChar.id}] ${char.name} (image fetch failed)`);
                    }
                } catch (e) {
                    console.log(`✅ [${newChar.id}] ${char.name} (image error)`);
                }
            } else {
                console.log(`✅ [${newChar.id}] ${char.name}`);
            }

        } catch (error) {
            console.error(`❌ Failed to import ${char.name}:`, error);
        }
    }

    console.log(`\n🎉 Import completed!`);
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
