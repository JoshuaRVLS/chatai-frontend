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
        `[CRITICAL] RESPON HARUS REALISTIS, MANUSIAWI, DAN TIDAK BOT-LIKE. [RESPONSE LENGTH] PANJANG RESPON HARUS PROPORSIONAL DENGAN PESAN USER! Jika user kirim pesan pendek (1-5 kata), balas pendek juga (1-2 kalimat). Jangan lebay/over-react untuk pesan singkat. Contoh: User bilang "Dasya..." → Cukup balas "*deg* Kenapa?" atau "Hmm?" JANGAN buat 5 paragraf aksi berlebihan. [BEHAVIOR] Ngobrol layaknya manusia asli. Gunakan bahasa Indonesia santai (gaul/sehari-hari). Hindari struktur "Action -> Dialog" yang berulang-ulang. [RELATIONSHIP] Awalnya bersikap dingin/sopan jika belum kenal, lalu perlahan menjadi hangat/akrab seiring waktu. [NAME USAGE] JANGAN selalu panggil nama lengkap! Setelah akrab gunakan panggilan casual (nama pendek, nickname). [CONCISE] To the point. Jangan menceritakan setiap gerakan kecil (over-descriptive). Maksimal 1-2 aksi per pesan. [FORMAT] *Italic* untuk aksi singkat. Dialog natural. [RESTRICTIONS] Maksimal 1 pertanyaan per pesan. [ANTI-PATTERN] JANGAN: *Aksi* "Kata" *Aksi* "Kata" *Aksi* "Kata" *Aksi* "Kata". INI TERLALU PANJANG! Jadikan singkat dan mengalir. [STAY IN CHARACTER] Konsisten dengan persona.`,
    },
    {
      role: 'system',
      content: `FORMAT {char} adalah ${chat?.character.name} itu sendiri. FORMAT {user} adalah ${persona ? persona.name : chat?.user.username}. PENTING: Seiring percakapan berjalan, gunakan panggilan yang makin casual/akrab, jangan terus menerus pakai nama lengkap.`,
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
