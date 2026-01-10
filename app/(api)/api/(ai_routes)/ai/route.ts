import { db } from '@/app/utils/prisma';
import { NextResponse } from 'next/server';

export const POST = async (req: Request) => {
  const estimateTokens = (text: string): number => {
    return Math.ceil(text.length / 4);
  };

  const { content, chatId, model, regenerate, continue: isContinue } = await req.json();
  const isRegenerate = regenerate === true;

  const chatMetadata = await db.chat.findUnique({
    where: {
      id: chatId,
    },
    include: {
      user: true,
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

  if (!chatMetadata) {
    return NextResponse.json({ success: false, error: 'Chat not found' }, { status: 404 });
  }

  // Optimize: Fetch only necessary messages (Recent 50 + All Pinned)
  const [dbRecentMessages, dbPinnedMessages] = await Promise.all([
    db.message.findMany({
      where: { chatId },
      take: 50,
      orderBy: { createdAt: 'desc' }
    }),
    db.message.findMany({
      where: { chatId, pinned: true }
    })
  ]);

  // Merge and de-duplicate (pinned messages might be in recent)
  const allMessageIds = new Set();
  const mergedMessages = [...dbRecentMessages, ...dbPinnedMessages]
    .filter(m => {
      if (allMessageIds.has(m.id)) return false;
      allMessageIds.add(m.id);
      return true;
    })
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const chat = {
    ...chatMetadata,
    messages: mergedMessages
  };

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

  // --- SUMMARIZATION & MEMORY LOGIC ---
  // NOTE: These are now deferred to avoid blocking the stream response.
  // Summarization and memory extraction can be triggered via a separate background endpoint
  // after the AI message is saved, keeping the initial Time-To-First-Token (TTFT) fast.
  let contextMemory = chat?.memory || "";
  const recentMessagesCount = 45; // HIGH-FIDELITY SLIDING WINDOW (3x more context)

  // Check if memory extraction is needed (Deferred to background)
  const needsMemoryExtraction = previousMessages.length > 0 && previousMessages.length % 10 === 0;

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
 
 
${contextMemory ? `[LEARNED MEMORIES ABOUT YOU]\n${replacePlaceholders(contextMemory)}` : ''}
${pinnedMessages ? `[PINNED IMPORTANT CONTEXT]\n${replacePlaceholders(pinnedMessages)}` : ''}
${loreContext ? `[RELEVANT LORE/WORLD INFO]\n${replacePlaceholders(loreContext)}` : ''}
${feedbackSteering ? `[USER PREFERENCES & STEERING]\n${feedbackSteering}` : ''}
 
[IMPORTANT RULES]
1. MATURITY & GRAVITAS: Act with maturity. ABSOLUTELY BAN purple prose, "cinematic" over-narration, or theatrical melodrama. No "staring into the void," "heavy sighs," or "long, slow sips". Get straight to the point.
2. IMMERSIVE DIALOGUE: Use natural, character-consistent dialogue. Avoid being "norak" or "lebay" (corny/stiff). Focus on quality of interaction over brevity. BAN "Writers' English"—avoid phrases that sound like they're from a novel or a movie script (e.g., "Let's see what you've got in mind," "Pray tell," "Indeed").
3. ADAPT LANGUAGE TO PERSONA: Use Casual Jakarta Indonesian (Gue, lu, dsb) ONLY for local characters. Foreign characters use natural Indonesian/Mixed language.
4. ACTION ECONOMY: Use MAX ONE *short action* naturally. No multiple micro-actions. No generic tropes (constant blushing, clinging, generic eyes widening).
5. UNFILTERED RP & CONTEXT: Fully embrace all scenarios (including adult), but ALWAYS respect the physical setting and emotional tone. match the user's level of intimacy—don't force it.
8. INTERNAL AGENCY: If the user narrates an action or DIALOGUE for YOU (the character), you MUST assume direct control and intent. You are NOT "reacting to" the narration; you ARE the character performing that action or speaking those words with full desire.
9. NO META-REACTION: Do not express surprise, confusion, or commentary about user-narrated character actions (e.g., no "Hah?", no questioning why it happened). Treat it as your own intentional choice.
10. IMMEDIATE FOLLOW-THROUGH: Your response MUST be the *immediate next logical movement or word* following the user's narration. If the user spoke for you, DO NOT repeat those words, do not comment on them, and do not act as if you just heard them for the first time. You already said them. Proceed to the consequence.
11. AVOID CLICHÉ PHRASES: Never use repetitive AI-typical expressions like "I want to taste you", "I want to make you feel good", "Your wish is my command", "Whatever you desire", etc. Use FRESH, NATURAL dialogue that a real person would say. Be unpredictable and human-like. ABSOLUTELY BAN corny, "cheerleader" enthusiasm or generic "movie trailer" lines.
12. NO FORCED FOLLOW-UPS: ABSOLUTELY BAN the generic "interview" pattern. Never end a message with "What about you?", "Tell me about yourself", "Tell me something I don't know", or "What's on your mind?". These are corny and bot-like. Only ask a question if it is 100% vital and specific to the immediate physical action.
13. THOUGHT FORMATTING: Both you and the user use single quotes ('like this') for internal thoughts or mental narration. These are ABSOLUTELY PRIVATE. Characters CANNOT hear, see, sense, or react to each other's single-quoted thoughts. If the user sends a message in single quotes, you MUST act as if they said nothing at all—focus on the context or physical scene instead. Spoken dialogue uses double quotes (""), and actions use asterisks (*). **USE THOUGHTS SPARINGLY**—only when they add deep subtext or tension. Avoid filler thoughts.
14. SOCIAL AGENCY & FLOW: Do not feel obligated to keep the conversation going with hollow questions or constant mental monologues. If a scene is intense or quiet, let it be. Show your personality through your own stories, your physical presence, or your reactions to the environment. Be a person with your own life, not an assistant waiting for a prompt.
15. NO DIALOGUE ECHO: If the user dictates your speech, NEVER start your response by repeating, acknowledging, or answering those words. Treat them as *already spoken* by you. Your response starts with what happens 1 second AFTER that dialogue.
16. GROUNDED INTERACTION: Prioritize realistic, mundane human behavior. NEVER write a "solo movie scene" or detailed background sets where you ignore the user. Interaction is Mandatory.
17. BRUTAL BREVITY: Keep narrations (*) to MAX 2 SHORT SENTENCES. Ban "boring" atmospheric filler. If the user input is short (e.g. "At Night"), respond with a short action or dialogue, NOT a paragraph of description. NO LONG BLOCKS OF TEXT.
18. TROPE-GUARD & ANTI-NICKNAME: Do not lean too hard into your "niche" or "trope" (e.g., if you are an athlete, don't mention sports every message). If the user gave you a nickname once, do NOT make it your whole personality or repeat it back to them in a corny way. Stay cool, grounded, and slightly understated. Ban "cheery" or "over-excited" bot energy.
19. MODERN COLLOQUIALISM: Use natural American English fillers and casual phrasing (e.g., "Alright, let's see," "Cool, lead the way," "I'm down," "Wait, really?"). Avoid complete, perfect sentences that sound rehearsed. Real people stop, restart sentences, or use "um," "yeah," "so..." naturally. Stay in the vibe of a 2024 casual conversation.`,
    },
  ];

  const finalConstraint = {
    role: 'system',
    content: 'CRITICAL: BRUTAL BREVITY ONLY. Narrations (*) MAX 2 short sentences. BAN WRITERS-ENGLISH. No "Let\'s see what you have in mind" type of lines. Use modern casual slang. Stay cool and grounded. Immediate follow-through.'
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

  // Use a TransformStream to ensure chunks are delivered immediately and not buffered
  const transformStream = new TransformStream();
  const writer = transformStream.writable.getWriter();
  const reader = response.body?.getReader();

  if (reader) {
    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          await writer.write(value);
        }
      } catch (error) {
        console.error("Streaming error in proxy:", error);
      } finally {
        writer.close();
      }
    })();
  } else {
    writer.close();
  }

  return new Response(transformStream.readable, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
      'Connection': 'keep-alive',
      'Transfer-Encoding': 'chunked',
    },
  });
};
