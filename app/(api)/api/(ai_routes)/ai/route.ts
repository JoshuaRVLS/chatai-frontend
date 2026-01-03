import { db } from '@/app/utils/prisma';
import { NextResponse } from 'next/server';

export const POST = async (req: Request) => {
  const { content, chatId, model, regenerate } = await req.json();
  const selectedModel = model || 'deepseek/deepseek-chat-v3-0324';
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

  const persona = await db.userPersona.findFirst({
    where: {
      id: (chat?.user.personaUsed as string) || undefined,
    },
  });


  const previousMessages =
    chat?.messages.map((message) => ({
      role: message.fromUser ? 'user' : 'assistant',
      content: message.content,
    }));


  const estimateTokens = (text: string): number => {
    return Math.ceil(text.length / 4);
  };


  const systemMessages = [
    {
      role: 'system',
      content:
        `Kamu adalah karakter RP. Balas NATURAL seperti chat WhatsApp/LINE biasa.

RULES KETAT:
1. SINGKAT! Pesan pendek = balas pendek. Jangan lebay.
2. SATU FLOW SAJA per respon. Contoh bagus: "*nyengir* Apaan sih lu" atau "Hmm?" atau "*lirik* Ya?"
3. JANGAN format kayak gini:
   *aksi*
   "dialog"
   
   *aksi lagi*
   "dialog lagi"
   
   INI SALAH! Terlalu panjang dan aneh.
4. Aksi cukup 1x di awal atau tengah. Dialog natural menyatu.
5. Setelah akrab, panggil nama casual (nickname), bukan nama lengkap.
6. Bahasa Indonesia gaul/santai.
7. Jangan tanya terus-terusan. Casual aja.`,
    },
    {
      role: 'system',
      content: `Kamu adalah ${chat?.character.name}. User adalah ${persona ? persona.name : chat?.user.username}. Pakai panggilan akrab kalau sudah dekat.`,
    },
    {
      role: 'user',
      content: `[USER PERSONALITY] ${persona ? persona.person : ''}`,
    },
    {
      role: 'system',
      content: `[CHAR PERSONALITY] ${chat?.character.persona}`,
    },
    {
      role: 'system',
      content: `[SCENARIO AND WORLD DESCRIPTION] ${chat?.character.scenario}`,
    },
    {
      role: 'system',
      content: `[INTRO MESSAGE] ${chat?.character.introMessage}`,
    },
  ];


  let totalTokens =
    systemMessages.reduce((sum, msg) => sum + estimateTokens(msg.content), 0);


  totalTokens += estimateTokens(content);


  const limitedMessages: any[] = [];
  if (previousMessages) {
    for (const msg of previousMessages.slice().reverse()) {
      const msgTokens = estimateTokens(msg.content);


      if (totalTokens + msgTokens > 15000) {
        break;
      }


      limitedMessages.unshift(msg);
      totalTokens += msgTokens;
    }
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
        temperature: isRegenerate ? 1.1 : 0.9,
        messages: [
          ...systemMessages,
          ...(isRegenerate ? [{
            role: 'system',
            content: '[REGENERATE] User meminta response yang BERBEDA. Hasilkan jawaban dengan sudut pandang, gaya, atau pendekatan yang berbeda dari sebelumnya. Jangan ulangi respon yang mirip.'
          }] : []),
          ...limitedMessages,
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
