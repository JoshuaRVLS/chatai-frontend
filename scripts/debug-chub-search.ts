/**
 * Advanced Debug Script to check Chub.ai Search Response (NO /api)
 */

async function debug() {
    const query = "Furina";
    const url = `https://gateway.chub.ai/search?search=${encodeURIComponent(query)}&first=5&page=1&namespace=characters&include_forks=true&nsfw=true&nsfl=true&chub=true&sort=default`;

    console.log("Fetching:", url);
    try {
        const res = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "application/json",
                "Referer": "https://chub.ai/"
            }
        });

        console.log("Status:", res.status);

        const text = await res.text();
        console.log("Raw Response Body (first 500 chars):", text.substring(0, 500));

        if (res.ok) {
            const data = JSON.parse(text);
            console.log("Nodes Found:", data.data?.nodes?.length || 0);
        }
    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

debug();
