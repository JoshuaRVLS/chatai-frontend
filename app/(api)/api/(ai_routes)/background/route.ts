import { db } from '@/app/utils/prisma';
import { NextResponse } from 'next/server';

// Background processing endpoint for chat summarization and memory extraction
// This should be called AFTER the AI message is saved, keeping TTFT fast
export const POST = async (req: Request) => {
    try {
        const { chatId } = await req.json();

        const chat = await db.chat.findFirst({
            where: { id: chatId },
            include: {
                user: true,
                messages: { orderBy: { createdAt: 'asc' } },
                character: true,
            },
        });

        if (!chat) {
            return NextResponse.json({ success: false, error: 'Chat not found' }, { status: 404 });
        }

        const personaId = chat?.personaId || chat?.user.personaUsed;
        const persona = await db.userPersona.findFirst({
            where: { id: (personaId as string) || undefined },
        });

        const chatSettings = chat?.chatSettings as any;
        const selectedModel = chatSettings?.model || 'deepseek/deepseek-chat-v3-0324';

        const userName = persona?.name || chat?.user.username || 'User';
        const charName = chat?.character.name || 'Character';

        const replacePlaceholders = (text: string) => {
            if (!text) return text;
            return text
                .replace(/{{user}}/gi, userName)
                .replace(/{{char}}/gi, charName)
                .replace(/<USER>/gi, userName)
                .replace(/<CHAR>/gi, charName);
        };

        const previousMessages = chat?.messages.map((message) => ({
            role: message.fromUser ? 'user' : 'assistant',
            content: replacePlaceholders(message.content),
        })) || [];

        let contextSummary = chat?.summary || "";
        let contextMemory = chat?.memory || "";
        const recentMessagesCount = 15;
        const messagesToSummarize = previousMessages.length - recentMessagesCount;

        let didSummarize = false;
        let didExtractMemory = false;

        // --- SUMMARIZATION LOGIC ---
        if (messagesToSummarize >= 10) {
            try {
                const oldMessages = previousMessages.slice(0, messagesToSummarize);
                const summaryRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: 'openai/gpt-3.5-turbo', // Use a fast, cheap model for summarization
                        messages: [
                            {
                                role: 'system',
                                content: `You are a conversation summarizer. Provide a concise, cumulative summary of the chat history so far, including these new events. Current summary: "${contextSummary}". New messages to incorporate into the summary: ${JSON.stringify(oldMessages)}`
                            }
                        ],
                    }),
                });

                if (summaryRes.ok) {
                    const summaryData = await summaryRes.json();
                    contextSummary = summaryData.choices[0]?.message?.content || contextSummary;
                    const messageIdsToDelete = chat?.messages.slice(0, messagesToSummarize).map(m => m.id) || [];

                    await db.$transaction([
                        db.chat.update({
                            where: { id: chatId },
                            data: { summary: contextSummary }
                        }),
                        db.message.deleteMany({
                            where: { id: { in: messageIdsToDelete } }
                        })
                    ]);
                    didSummarize = true;
                }
            } catch (err) {
                console.error("Background summarization failed:", err);
            }
        }

        // --- MEMORY EXTRACTION LOGIC ---
        if (previousMessages.length > 0 && previousMessages.length % 5 === 0) {
            try {
                const memoryRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: 'openai/gpt-3.5-turbo', // Use a fast, cheap model for memory extraction
                        messages: [
                            {
                                role: 'system',
                                content: `You are a memory extractor. Analyze the conversation and extract ONLY key long-term facts about ${persona ? persona.name : chat?.user.username} (e.g., family, job, preferences, shared history). 
Update the existing memory list elegantly. If a fact is already there, don't duplicate. Keep it in a bulleted list format.
CURRENT MEMORIES:
${contextMemory || "None yet."}

RECENT MESSAGES:
${JSON.stringify(previousMessages.slice(-10))}

Provide the NEW COMPLETE memory list.`
                            }
                        ],
                    }),
                });

                if (memoryRes.ok) {
                    const memoryData = await memoryRes.json();
                    const newMemory = memoryData.choices[0]?.message?.content;
                    if (newMemory) {
                        contextMemory = newMemory;
                        await db.chat.update({
                            where: { id: chatId },
                            data: { memory: replacePlaceholders(contextMemory) }
                        });
                        didExtractMemory = true;
                    }
                }
            } catch (err) {
                console.error("Background memory extraction failed:", err);
            }
        }

        return NextResponse.json({
            success: true,
            didSummarize,
            didExtractMemory
        });
    } catch (error) {
        console.error('Background processing error:', error);
        return NextResponse.json({ success: false, error: 'Background processing failed' }, { status: 500 });
    }
};
