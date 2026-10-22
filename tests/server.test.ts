import assert from 'node:assert/strict';
import test from 'node:test';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

import { ZERO_INSTALL_ACTORS } from '../src/actors.ts';
import { createServer } from '../src/server.ts';

test('lists one tool per shipped actor and refuses a run without a token', async () => {
    const previous = process.env.APIFY_TOKEN;
    delete process.env.APIFY_TOKEN;
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: 'test', version: '1.0.0' });
    const server = createServer();
    await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);
    const listed = await client.listTools();
    const names = listed.tools.map((tool) => tool.name).sort();
    assert.deepEqual(names, [
        'app-reviews-ios-android',
        'google-trends-batch-scraper',
        'seo-audit-ai-search-readiness',
        'sitemap-url-extractor',
        'url-pdf-to-markdown',
        'website-screenshot-batch',
    ]);
    const result = await client.callTool({
        name: 'google-trends-batch-scraper',
        arguments: { keywords: ['coffee'] },
    });
    assert.equal(result.isError, true);
    const text = JSON.stringify(result);
    assert.match(text, /APIFY_TOKEN/);
    assert.equal(text.includes('apify_api_'), false);
    assert.equal(ZERO_INSTALL_ACTORS.length, 6);
    if (previous === undefined) delete process.env.APIFY_TOKEN;
    else process.env.APIFY_TOKEN = previous;
    await client.close();
    await server.close();
});

test('redacts the token (raw and URL-encoded) from successful tool results and pins builds', async () => {
    const previous = process.env.APIFY_TOKEN;
    const token = 'test_tok+en/with=chars';
    process.env.APIFY_TOKEN = token;
    const realFetch = globalThis.fetch;
    const urls: string[] = [];
    globalThis.fetch = (async (url: string | URL) => {
        const u = String(url);
        urls.push(u);
        if (u.includes('/runs?')) {
            return new Response(JSON.stringify({ data: { id: 'run1', defaultDatasetId: 'ds1', status: 'SUCCEEDED' } }));
        }
        return new Response(JSON.stringify([{ raw: `x ${token} y`, encoded: `?token=${encodeURIComponent(token)}` }]));
    }) as typeof fetch;
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: 'test', version: '1.0.0' });
    const server = createServer();
    try {
        await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);
        const result = await client.callTool({ name: 'google-trends-batch-scraper', arguments: { keywords: ['coffee'] } });
        assert.notEqual(result.isError, true);
        const text = JSON.stringify(result);
        assert.equal(text.includes(token), false);
        assert.equal(text.includes(encodeURIComponent(token)), false);
        assert.match(text, /\[redacted\]/);
        const runUrl = urls.find((u) => u.includes('/runs?')) ?? '';
        assert.match(runUrl, /build=1\.0\.2/);
        assert.equal(runUrl.includes('latest'), false);
    } finally {
        globalThis.fetch = realFetch;
        if (previous === undefined) delete process.env.APIFY_TOKEN;
        else process.env.APIFY_TOKEN = previous;
        await client.close();
        await server.close();
    }
});
