const API = 'https://api.apify.com/v2';
const USERNAME = 'appreciative_duct';

export interface ActorRunResult {
    actor: string;
    runId: string;
    status: string;
    datasetId: string;
    itemCount: number;
    totalItemCount: number | null;
    consoleUrl: string;
    items: unknown[];
}

export async function runActor(
    actor: string,
    input: Record<string, unknown>,
    memoryMbytes: number,
    timeoutSecs: number,
    waitSecs: number,
    build: string,
): Promise<ActorRunResult> {
    const token = process.env.APIFY_TOKEN?.trim();
    if (!token) {
        throw new Error('Set APIFY_TOKEN to your own Apify API token. This server does not include one.');
    }
    const headers = {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
    };
    const started = await readJson(
        await fetch(`${API}/acts/${USERNAME}~${actor}/runs?memory=${memoryMbytes}&timeout=${timeoutSecs}&build=${encodeURIComponent(build)}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(input),
        }),
        token,
    );
    const data = asRecord(started.data);
    const runId = String(data.id ?? '');
    const datasetId = String(data.defaultDatasetId ?? '');
    if (!runId || !datasetId) throw new Error('Apify did not return a run id.');
    let status = String(data.status ?? 'READY');
    const deadline = Date.now() + waitSecs * 1000;
    while (!isTerminal(status)) {
        if (Date.now() > deadline) {
            throw new Error(`Run ${runId} is still ${status} after ${waitSecs}s. Open https://console.apify.com/actors/runs/${runId}`);
        }
        await delay(2000);
        const polled = await readJson(await fetch(`${API}/actor-runs/${runId}`, { headers }), token);
        status = String(asRecord(polled.data).status ?? status);
    }
    if (status !== 'SUCCEEDED') {
        throw new Error(`Run ${runId} finished with status ${status}. Open https://console.apify.com/actors/runs/${runId}`);
    }
    const itemsResponse = await fetch(`${API}/datasets/${datasetId}/items?clean=true&limit=100`, { headers });
    const totalHeader = itemsResponse.headers.get('x-apify-pagination-total');
    const items = await readJson(itemsResponse, token);
    if (!Array.isArray(items)) throw new Error('Apify dataset response was not a list.');
    return {
        actor: `${USERNAME}/${actor}`,
        runId,
        status,
        datasetId,
        itemCount: items.length,
        totalItemCount: totalHeader ? Number(totalHeader) : null,
        consoleUrl: `https://console.apify.com/actors/runs/${runId}`,
        items,
    };
}

function isTerminal(status: string): boolean {
    return status === 'SUCCEEDED' || status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT';
}

async function readJson(response: Response, token: string): Promise<any> {
    const text = await response.text();
    if (!response.ok) {
        throw new Error(`Apify request failed (${response.status}): ${redact(text, token).slice(0, 300)}`);
    }
    return JSON.parse(text) as unknown;
}

export function redact(text: string, token: string | undefined): string {
    if (!token) return text;
    let out = text;
    for (const form of new Set([token, encodeURIComponent(token)])) {
        if (form) out = out.split(form).join('[redacted]');
    }
    return out;
}

function asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
