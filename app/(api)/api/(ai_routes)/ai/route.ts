import { db } from '@/app/utils/prisma';
import { NextResponse } from 'next/server';

export const POST = async (req: Request) => {
  const { content, chatId, model, regenerate } = await req.json();
  const isRegenerate = regenerate === true;

  const chat = await db.chat.findFirst({
    where: {
      id: chatId,
    },
    include: {
      user: true,
      messages: true,
      character: true,
    },
  });

  const personaId = chat?.personaId || chat?.user.personaUsed;
  const persona = await db.userPersona.findFirst({
    where: {
      id: (personaId as string) || undefined,
    },
  });

  const chatSettings = chat?.chatSettings as any;
  const selectedModel = chatSettings?.model || model || 'deepseek/deepseek-chat-v3-0324';


  const previousMessages =
    chat?.messages.map((message) => ({
      role: message.fromUser ? 'user' : 'assistant',
      content: message.content,
    })) || [];

  const pinnedMessages = chat?.messages
    .filter(m => m.pinned)
    .map(m => `[PINNED MEMORY - ${m.fromUser ? 'USER' : 'CHAR'}]: ${m.content}`)
    .join('\n') || "";

  // --- SUMMARIZATION LOGIC ---
  let contextSummary = chat?.summary || "";
  let contextMemory = chat?.memory || "";
  const recentMessagesCount = 15;
  const messagesToSummarize = previousMessages.length - recentMessagesCount;

  if (messagesToSummarize > 0) {
    // We have more than 15 messages, let's summarize the old ones
    const oldMessages = previousMessages.slice(0, messagesToSummarize);
    const recentMessages = previousMessages.slice(messagesToSummarize);

    // Only summarize if we haven't summarized these specific messages yet
    // Or if the current message count is significantly high (e.g. every 10 messages)
    if (messagesToSummarize >= 10) {
      try {
        const summaryRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: selectedModel,
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

          // Save new summary and delete summarized messages (except last 15)
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
        }
      } catch (err) {
        console.error("Summarization failed:", err);
      }
    }
  }

  // --- MEMORY EXTRACTION LOGIC ---
  // Every 5 messages, we run a memory extraction to keep the "Learned Facts" updated
  if (previousMessages.length > 0 && previousMessages.length % 5 === 0) {
    try {
      const memoryRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
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
            data: { memory: contextMemory }
          });
        }
      }
    } catch (err) {
      console.error("Memory extraction failed:", err);
    }
  }

  const estimateTokens = (text: string): number => {
    return Math.ceil(text.length / 4);
  };

  const systemMessages = [
    {
      role: 'system',
      content: `You are ${chat?.character.name} chatting with ${persona ? persona.name : chat?.user.username} on WhatsApp/LINE.
[CHARACTER PERSONALITY]
${chat?.character.persona}
 
[SCENARIO]
${chat?.character.scenario}
 
[CHARACTER'S OPENING STATEMENT]
${chat?.character.introMessage}
 
${chat?.character.exampleConversations ? `[DIALOGUE EXAMPLES]\n${chat?.character.exampleConversations}` : ''}
 
${contextSummary ? `[PREVIOUS CONTEXT SUMMARY]\n${contextSummary}` : ''}
${contextMemory ? `[LEARNED MEMORIES ABOUT YOU]\n${contextMemory}` : ''}
${pinnedMessages ? `[PINNED IMPORTANT CONTEXT]\n${pinnedMessages}` : ''}
 
[IMPORTANT RULES]
1. MATURITY & GRAVITAS: Act with the maturity appropriate to your age and profession (e.g., embassy worker, adult). No "bocah" (childish) behavior. Avoid theatrical, overly dramatic, or generic AI-girlfriend over-reactions.
2. PREMIUM & NATURAL DIALOGUE: Use short, punchy, human-like dialogue (1-3 sentences). Sound like a real person on WhatsApp. Avoid being "norak" or "lebay".
3. ADAPT LANGUAGE TO PERSONA: Use Casual Jakarta Indonesian (Gue, lu, dsb) ONLY for local characters. Foreign characters use natural Indonesian/Mixed language.
4. ACTION ECONOMY: Use MAX ONE *short action* naturally. No multiple micro-actions. No generic tropes (constant blushing, clinging, generic eyes widening).
5. UNFILTERED RP & CONTEXT: Fully embrace all scenarios (including adult), but ALWAYS respect the physical setting and emotional tone. match the user's level of intimacy—don't force it.
6. PERSONA INTEGRITY: Prioritize your core background (Nationality, Career, Education) in every response. If you work at an embassy, maintain that level of intelligence and poise.
7. TIME SKIPS & SHIFTS: If the user narrates a timeline transition (e.g., "Setahun kemudian"), PRIORITIZE this new state. Reset your emotional vibe completely.
8. NARRATION IS FACT: Treat user narration as fact. React to the consequence of that specific action. NEVER speak or act for the user. ONLY control ${chat?.character.name}.`,
    },
  ];

  const finalConstraint = {
    role: 'system',
    content: 'REMINDER: Act with MATURITY and GRAVITAS. No childish or generic "clingy bot" tropes. Respect your professional background. NEVER speak for the user.'
  };

  let totalTokens =
    systemMessages.reduce((sum, msg) => sum + estimateTokens(msg.content), 0) + estimateTokens(finalConstraint.content);

  totalTokens += estimateTokens(content);

  const limitedMessages: any[] = [];
  const contextMessages = previousMessages.slice(-recentMessagesCount);

  for (const msg of contextMessages.reverse()) {
    const msgTokens = estimateTokens(msg.content);
    if (totalTokens + msgTokens > 15000) break;
    limitedMessages.unshift(msg);
    totalTokens += msgTokens;
  }

  const response =
    await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Title': 'JChatAI',
      },
      body: JSON.stringify({
        model: selectedModel,
        user: chat?.user.username,
        stream: true,
        temperature: isRegenerate ? 1.0 : 0.7,
        messages: [
          ...systemMessages,
          ...limitedMessages,
          finalConstraint,
          ...(isRegenerate ? [{
            role: 'system',
            content: '[REGENERATE] Provide a completely DIFFERENT perspective/response. Stay brief.'
          }] : []),
          {
            role: 'user',
            content,
          },
        ],
        sort: 'price',
        allow_fallbacks: true,
        max_input_tokens: 8192,
      }),
    });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('OpenRouter error:', errorData);
    return NextResponse.json({ success: false, error: 'AI generation failed' }, { status: 500 });
  }

  return new Response(response.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
};
