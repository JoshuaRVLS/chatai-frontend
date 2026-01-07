/**
 * Quick test script to debug ChubAI API response
 */

export { };
const CHUB_GATEWAY_API = "https://gateway.chub.ai/api";

async function test() {
    const lorebookPath = "lorebooks/statuotw/the-fantasy-world-of-adolion-1a189c34";
    const url = `${CHUB_GATEWAY_API}/${lorebookPath}?full=true`;

    console.log(`Fetching: ${url}\n`);

    const response = await fetch(url);
    const data = await response.json();

    console.log('Keys in response:', Object.keys(data));
    console.log('Keys in data.node:', Object.keys(data.node || {}));
    console.log('\nDefinition keys:', Object.keys(data.node?.definition || {}));

    console.log('\nChecking for entries:');
    console.log('- definition.entries exists:', !!data.node?.definition?.entries);
    console.log('- definition.entries length:', data.node?.definition?.entries?.length || 0);

    if (data.node?.definition?.entries?.[0]) {
        const entry = data.node.definition.entries[0];
        console.log('\nFirst entry structure:');
        console.log(JSON.stringify(entry, null, 2).substring(0, 500));
    }
}

test().catch(console.error);
