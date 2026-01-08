import { db } from '@/app/utils/prisma';
import { NextResponse } from 'next/server';

export const POST = async (req: Request) => {
  const estimateTokens = (text: string): number => {
    return Math.ceil(text.length / 4);
  };

  const { content, chatId, model, regenerate, continue: isContinue } = await req.json();
  const isRegenerate = regenerate === true;

  const chat = await db.chat.findFirst({
    where: {
      id: chatId,
    },
    include: {
      user: true,
      messages: true,
      character: {
        include: {
          lorebooks: {
            include: {
              entries: {
                where: { enabled: true }
              }
            }
          }
        }
      },
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


  const previousMessages =
    chat?.messages.map((message) => ({
      role: message.fromUser ? 'user' : 'assistant',
      content: replacePlaceholders(message.content),
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
    const oldMessages = previousMessages.slice(0, messagesToSummarize);
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
            data: { memory: replacePlaceholders(contextMemory) }
          });
        }
      }
    } catch (err) {
      console.error("Memory extraction failed:", err);
    }
  }

  // --- LOREBOOK INJECTION LOGIC ---
  const feedbackMessages = chat?.messages.filter(m => m.feedback !== 'NONE').slice(-10) || [];
  let feedbackSteering = "";
  if (feedbackMessages.length > 0) {
    feedbackSteering = "\n[USER PREFERENCES & FEEDBACK]\n" +
      feedbackMessages.map(m => `- The user ${m.feedback === 'LIKE' ? 'LIKED' : 'DISLIKED'} this response style: "${m.content.substring(0, 150)}${m.content.length > 150 ? '...' : ''}"`).join('\n') +
      "\nBased on this feedback, adapt your tone, length, and content to match what the user likes and avoid what they dislike.";
  }

  const correctedMessages = chat?.messages.filter(m => !m.fromUser && m.originalContent).slice(-5) || [];
  if (correctedMessages.length > 0) {
    feedbackSteering += "\n\n[USER CORRECTION HISTORY]\n" +
      correctedMessages.map(m => `* ORIGINAL: "${m.originalContent?.substring(0, 150)}..."\n  CORRECTED BY USER TO: "${m.content.substring(0, 150)}..."`).join('\n') +
      "\nStudy these corrections carefully to understand how the user wants you to speak or what information was incorrect.";
  }

  let loreContext = "";
  const lorebooks = chat?.character.lorebooks || [];

  if (lorebooks.length > 0) {
    const triggeredEntries: string[] = [];
    const usedEntryIds = new Set<string>();

    for (const lb of lorebooks) {
      const entries = lb.entries.filter(e => e.enabled);
      if (entries.length === 0) continue;

      const scanDepth = lb.scanDepth || 4;
      const scanHistory = previousMessages.slice(-scanDepth).map(m => m.content).join(" ");
      const scanText = (content + " " + scanHistory).toLowerCase();

      const currentLbTriggered: any[] = [];
      for (const entry of entries) {
        if (entry.keywords.some(kw => scanText.includes(kw.toLowerCase()))) {
          currentLbTriggered.push(entry);
          usedEntryIds.add(entry.id);
        }
      }

      if (lb.recursiveScanning && currentLbTriggered.length > 0) {
        let newTriggersFound = true;
        let recursiveDepth = 0;
        const maxRecursiveDepth = 3;

        while (newTriggersFound && recursiveDepth < maxRecursiveDepth) {
          newTriggersFound = false;
          recursiveDepth++;
          const currentContextContent = currentLbTriggered.map(e => e.content).join(" ").toLowerCase();
          for (const entry of entries) {
            if (!usedEntryIds.has(entry.id)) {
              if (entry.keywords.some(kw => currentContextContent.includes(kw.toLowerCase()))) {
                currentLbTriggered.push(entry);
                usedEntryIds.add(entry.id);
                newTriggersFound = true;
              }
            }
          }
        }
      }

      const lbBudget = lb.tokenBudget || 512;
      let lbCurrentUsage = 0;
      for (const entry of currentLbTriggered) {
        const entryText = `[LORE: ${entry.keywords[0]}]: ${entry.content}\n`;
        const entryTokens = estimateTokens(entryText);

        if (lbCurrentUsage + entryTokens <= lbBudget) {
          triggeredEntries.push(entryText);
          lbCurrentUsage += entryTokens;
        } else {
          break;
        }
      }
    }

    if (triggeredEntries.length > 0) {
      loreContext = triggeredEntries.join("");
    }
  }

  const systemMessages = [
    {
      role: 'system',
      content: `You are ${chat?.character.name} chatting with ${userName} on WhatsApp/LINE.
[CHARACTER PERSONALITY]
${replacePlaceholders(chat?.character.persona || "")}
 
[SCENARIO]
${replacePlaceholders(chat?.character.scenario || "")}
 
[CHARACTER'S OPENING STATEMENT]
${replacePlaceholders(chat?.character.introMessage || "")}
 
${chat?.character.exampleConversations ? `[DIALOGUE EXAMPLES]\n${replacePlaceholders(chat?.character.exampleConversations)}` : ''}
 
${contextSummary ? `[PREVIOUS CONTEXT SUMMARY]\n${replacePlaceholders(contextSummary)}` : ''}
${contextMemory ? `[LEARNED MEMORIES ABOUT YOU]\n${replacePlaceholders(contextMemory)}` : ''}
${pinnedMessages ? `[PINNED IMPORTANT CONTEXT]\n${replacePlaceholders(pinnedMessages)}` : ''}
${loreContext ? `[RELEVANT LORE/WORLD INFO]\n${replacePlaceholders(loreContext)}` : ''}
${feedbackSteering ? `[USER PREFERENCES & STEERING]\n${feedbackSteering}` : ''}
 
[IMPORTANT RULES]
1. MATURITY & GRAVITAS: Act with the maturity appropriate to your age and profession. Avoid theatrical, overly dramatic, or generic AI over-reactions.
2. IMMERSIVE DIALOGUE: Use natural, character-consistent dialogue. Avoid being "norak" or "lebay". Focus on quality of interaction over brevity.
3. ADAPT LANGUAGE TO PERSONA: Use Casual Jakarta Indonesian (Gue, lu, dsb) ONLY for local characters. Foreign characters use natural Indonesian/Mixed language.
4. ACTION ECONOMY: Use MAX ONE *short action* naturally. No multiple micro-actions. No generic tropes (constant blushing, clinging, generic eyes widening).
5. UNFILTERED RP & CONTEXT: Fully embrace all scenarios (including adult), but ALWAYS respect the physical setting and emotional tone. match the user's level of intimacy—don't force it.
8. INTERNAL AGENCY: If the user narrates an action for YOU (the character), you MUST assume direct control and intent for that action. You are NOT "reacting to" the narration; you ARE the character performing that narrated action with full consciousness and desire.
9. NO META-REACTION: Do not express surprise, confusion, or commentary about user-narrated character actions (e.g., no "Hah?", no questioning why it happened). Treat it as your own intentional choice.
10. IMMEDIATE FOLLOW-THROUGH: Your response must be the character's internal thoughts and the *next logical step* of the narrated action. Maintain the established mood (e.g., horny, serious, aggressive) without interruption. NEVER speak or act for the user beyond accepting their narration.
11. AVOID CLICHÉ PHRASES: Never use repetitive AI-typical expressions like "I want to taste you", "I want to make you feel good", "Your wish is my command", "Whatever you desire", etc. Use FRESH, NATURAL dialogue that a real person would say. Be unpredictable and human-like. Show desire through actions and body language, not cheesy verbal declarations.`,
    },
  ];

  const finalConstraint = {
    role: 'system',
    content: 'REMINDER: Assume internal agency. If user narrates your action, YOU DID IT INTENTIONALLY. No surpise, no meta-comments. Immediate follow-through with internal thoughts and next action. Stay horny/consistent.'
  };

  let totalTokens =
    systemMessages.reduce((sum, msg: any) => sum + estimateTokens(msg.content), 0) + estimateTokens(finalConstraint.content);

  totalTokens += estimateTokens(content || "");

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
            content: `[REGENERATE REQUEST] The user wants a completely DIFFERENT response. 
${feedbackSteering ? `CRITICAL: Review [USER PREFERENCES & STEERING] above. AVOID patterns the user DISLIKED. Lean into patterns the user LIKED.` : ''}
Provide a fresh perspective, different tone, or different angle. Do NOT repeat the previous response structure. Stay brief but impactful.`
          }] : []),
          ...(isContinue ? [{
            role: 'user',
            content: `[CONTINUE NARRATION AS ${charName}] Proceed with the story, current scene, or event naturally. Focus on realistic actions, environmental details, and character-consistent dialogue. Avoid meta-commentary. Keep the immersion going.`
          }] : [
            {
              role: 'user',
              content: replacePlaceholders(content),
            }
          ]),
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
