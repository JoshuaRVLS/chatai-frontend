import { PrismaClient } from '../app/generated/prisma';

const prisma = new PrismaClient();

const CONFIG = {
    userId: "cmk70q7xb0000cmlrwm9l86gz",
    api: "https://gateway.chub.ai/api",
    search: "https://gateway.chub.ai/search",
    headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
        "Referer": "https://chub.ai/"
    }
};

const sanitize = (str: string): string => {
    if (!str) return "";
    return str
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
};

const fetchJson = async (url: string) => {
    const res = await fetch(url, { headers: CONFIG.headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return res.json();
};

const upsertTags = async (topics: string[]) => {
    return Promise.all(topics.map(name =>
        prisma.characterTag.upsert({
            where: { name },
            create: { name },
            update: {}
        })
    ));
};

const saveImage = async (charId: string, name: string, url: string) => {
    if (!url) return;
    try {
        const res = await fetch(url);
        if (!res.ok) return;

        const buffer = Buffer.from(await res.arrayBuffer());
        await prisma.characterImage.create({
            data: {
                charId,
                name: `${name}_avatar`,
                mimetype: res.headers.get("content-type") || "image/png",
                data: buffer
            }
        });
    } catch (e) {
        console.warn(`Failed to save image for ${name}`);
    }
};

const importCharacter = async (path: string) => {
    try {
        const existing = await prisma.character.findFirst({ where: { chubId: path } });
        if (existing) return { status: 'skipped' };

        const { node: detail } = await fetchJson(`${CONFIG.api}/characters/${path}?full=true`);
        const def = detail.definition;
        const topics = detail.topics || [];

        const tags = await upsertTags(topics);
        const isNsfw = topics.some((t: string) => ['nsfw', 'mature'].includes(t.toLowerCase()));

        const char = await prisma.character.create({
            data: {
                name: detail.name,
                chubId: path,
                bio: sanitize(detail.description || detail.tagline),
                persona: sanitize(def.personality || def.description),
                scenario: sanitize(def.scenario),
                introMessage: sanitize(def.first_message || def.first_mes),
                exampleConversations: sanitize(def.example_dialogs || def.mes_example),
                isNsfw,
                authorId: CONFIG.userId,
                tags: { connect: tags.map(t => ({ id: t.id })) }
            }
        });

        await saveImage(char.id, detail.name, detail.max_res_url || def.avatar);

        return { status: 'success', name: detail.name, isNsfw };
    } catch (e: any) {
        return { status: 'error', error: e.message };
    }
};

const parseArgs = () => {
    const args = process.argv.slice(2);
    const getArg = (flag: string) => {
        const idx = args.indexOf(flag);
        return idx !== -1 ? args[idx + 1] : null;
    };

    return {
        query: getArg('--search') || '',
        pages: parseInt(getArg('--pages') || '1'),
        tags: getArg('--tags') || '',
        sort: getArg('--sort') || 'default',
        concurrency: parseInt(getArg('--concurrency') || '5'),
        id: getArg('--id')
    };
};

async function main() {
    const opts = parseArgs();

    if (opts.id) {
        const res = await importCharacter(opts.id);
        console.log(res);
        return;
    }

    console.log(`Starting sync: ${opts.pages} pages, ${opts.concurrency} threads`);

    const stats = { total: 0, nsfw: 0, errors: 0 };
    const startTime = Date.now();

    for (let i = 1; i <= opts.pages; i++) {
        console.log(`Processing page ${i}...`);

        try {
            const params = new URLSearchParams({
                page: i.toString(),
                first: '20',
                sort: opts.sort,
                ...(opts.query && { search: opts.query }),
                ...(opts.tags && { topics: opts.tags }),
                namespace: 'characters',
                include_forks: 'true',
                nsfw: 'true'
            });

            const data = await fetchJson(`${CONFIG.search}?${params}`);
            const nodes = data.data?.nodes || [];

            if (!nodes.length) break;

            const queue = [...nodes];
            const workers = Array(opts.concurrency).fill(null).map(async () => {
                while (queue.length) {
                    const node = queue.shift();
                    if (!node) break;

                    const res = await importCharacter(node.fullPath);
                    if (res.status === 'success') {
                        stats.total++;
                        if (res.isNsfw) stats.nsfw++;
                        process.stdout.write('.');
                    } else if (res.status === 'error') {
                        stats.errors++;
                        process.stdout.write('x');
                    }
                }
            });

            await Promise.all(workers);
            console.log(''); // Newline after progress dots

        } catch (e) {
            console.error(`Page ${i} failed`);
        }
    }

    const seconds = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\nDone in ${seconds}s`);
    console.log(`Imported: ${stats.total} (${stats.nsfw} NSFW)`);
    console.log(`Errors: ${stats.errors}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
