import { db } from '@/app/utils/prisma';
import { NextResponse } from 'next/server';

export const POST = async (req: Request) => {
    try {
        const { chatId } = await req.json();

        const chat = await db.chat.findUnique({
            where: { id: chatId },
            include: {
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
                character: true,
                user: true,
            },
        });

        if (!chat) {
            return NextResponse.json({ success: false, error: 'Chat not found' }, { status: 404 });
        }

        const previousMessages = [...chat.messages].reverse().map((m) => ({
            role: m.fromUser ? 'user' : 'assistant',
            content: m.content,
        }));

        const personaId = chat?.personaId || chat?.user.personaUsed;
        const persona = await db.userPersona.findFirst({
            where: {
                id: (personaId as string) || undefined,
            },
        });

        const charName = chat.character.name;
        const userName = persona?.name || chat?.user.username || 'User';

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'X-Title': 'JChatAI - Suggestions',
            },
            body: JSON.stringify({
                model: 'openai/gpt-3.5-turbo', // Light model for speed
                messages: [
                    {
                        role: 'system',
                        content: `You are a roleplay assistant. Given the context of a conversation between a character named "${charName}" and a user, suggest 3 distinct things the user could say or do next. 
            Keep suggestions short (one or two sentences), varied (e.g., one action, one question, one emotional response), and immersive.
            Return ONLY a valid JSON array of strings. 
            Example: ["*I lean closer and whisper* What are you hiding?", "But why would you do that?", "*I look away, feeling a bit hurt* I thought we were friends."]`,
                    },
                    ...previousMessages,
                    {
                        role: 'user',
                        content: 'Give me 3 suggestions for my next response based on the above context.',
                    },
                ],
                response_format: { type: 'json_object' },
            }),
        });

        if (!response.ok) {
            throw new Error('OpenRouter failure');
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        // Parse the JSON array. LLM might wrap it in an object like { "suggestions": [...] } or just [...]
        let suggestions: string[] = [];
        try {
            const parsed = JSON.parse(content);
            suggestions = Array.isArray(parsed) ? parsed : (parsed.suggestions || []);
        } catch (e) {
            // Fallback regex if JSON parsing fails
            const matches = content.match(/"([^"]+)"/g);
            if (matches) suggestions = matches.map((m: string) => m.replace(/"/g, ''));
        }

        return NextResponse.json({ success: true, suggestions: suggestions.slice(0, 3) });
    } catch (error) {
        console.error('Suggestions error:', error);
        return NextResponse.json({ success: false, error: 'Failed to generate suggestions' }, { status: 500 });
    }
};
