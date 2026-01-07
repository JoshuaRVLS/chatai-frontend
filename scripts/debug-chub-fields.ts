export { };
const CHUB_GATEWAY_API = "https://gateway.chub.ai/api";

async function main() {
    const testPath = "Anonymous/furina-5e0e2c07";
    const detailUrl = `${CHUB_GATEWAY_API}/characters/${testPath}?full=true`;

    const response = await fetch(detailUrl, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/json",
            "Referer": "https://chub.ai/"
        }
    });

    const data = await response.json();

    // Write full response to a file for inspection
    const fs = require('fs');
    fs.writeFileSync('chub-response.json', JSON.stringify(data, null, 2));
    console.log("Full response written to chub-response.json");
}

main().catch(console.error);
