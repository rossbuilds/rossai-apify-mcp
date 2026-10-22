import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { redact, runActor } from './apify.js';
import { ACTORS } from './actors.js';

const wait = z.number().int().min(10).max(300).optional().describe('Seconds to wait for the Apify run. Default 180.');

export function createServer(): McpServer {
    const server = new McpServer({
        name: 'rossai-apify-mcp',
        version: '1.0.0',
    });

    server.registerTool(
        'sitemap-url-extractor',
        {
            title: 'Sitemap URL Extractor',
            description: ACTORS[0]?.description,
            inputSchema: {
                startUrls: z.array(z.string()).min(1).max(20).describe('Website or sitemap URLs.'),
                maxUrls: z.number().int().min(1).max(5000).optional().describe('Stop after this many URLs. Default on the actor is high; pass a small number for a sample.'),
                waitSeconds: wait,
            },
        },
        async ({ startUrls, maxUrls, waitSeconds }) => call('sitemap-url-extractor', {
            startUrls: startUrls.map((url) => ({ url })),
            ...(maxUrls ? { maxUrls } : {}),
        }, waitSeconds),
    );

    server.registerTool(
        'seo-audit-ai-search-readiness',
        {
            title: 'SEO Audit and AI Search Readiness',
            description: ACTORS[1]?.description,
            inputSchema: {
                startUrls: z.array(z.string()).min(1).max(20).describe('Page URLs, a homepage, or a sitemap URL.'),
                maxPages: z.number().int().min(1).max(50).optional().describe('Pages to audit. Default 25 on the actor.'),
                waitSeconds: wait,
            },
        },
        async ({ startUrls, maxPages, waitSeconds }) => call('seo-audit-ai-search-readiness', {
            startUrls: startUrls.map((url) => ({ url })),
            ...(maxPages ? { maxPages } : {}),
        }, waitSeconds),
    );

    server.registerTool(
        'google-trends-batch-scraper',
        {
            title: 'Google Trends Scraper',
            description: ACTORS[2]?.description,
            inputSchema: {
                keywords: z.array(z.string()).min(1).max(100),
                geo: z.string().optional().describe('Country or region code, such as US. Empty is worldwide.'),
                timeframe: z.string().optional().describe('For example today 12-m, now 7-d, or 2024-01-01 2024-12-31.'),
                category: z.number().int().min(0).max(2000).optional(),
                gprop: z.enum(['web', 'news', 'youtube', 'images', 'froogle']).optional(),
                comparisonMode: z.enum(['chunk', 'anchor']).optional(),
                anchorKeyword: z.string().optional(),
                waitSeconds: wait,
            },
        },
        async ({ waitSeconds, ...input }) => call('google-trends-batch-scraper', stripEmpty(input), waitSeconds),
    );

    server.registerTool(
        'website-screenshot-batch',
        {
            title: 'Website Screenshot Batch',
            description: ACTORS[3]?.description,
            inputSchema: {
                urls: z.array(z.string()).min(1).max(50),
                format: z.enum(['png', 'jpeg', 'pdf']).optional(),
                fullPage: z.boolean().optional(),
                device: z.enum(['desktop', 'laptop', 'tablet', 'mobile']).optional(),
                waitForSelector: z.string().optional(),
                hideCookieBanners: z.boolean().optional(),
                waitSeconds: wait,
            },
        },
        async ({ waitSeconds, ...input }) => call('website-screenshot-batch', stripEmpty(input), waitSeconds),
    );

    server.registerTool(
        'app-reviews-ios-android',
        {
            title: 'App Reviews for iOS and Android',
            description: ACTORS[4]?.description,
            inputSchema: {
                apps: z.array(z.string()).min(1).max(40).describe('App Store ids, Play package names, or store URLs.'),
                country: z.string().optional(),
                language: z.string().optional(),
                maxReviewsPerApp: z.number().int().min(1).max(50).optional(),
                waitSeconds: wait,
            },
        },
        async ({ waitSeconds, ...input }) => call('app-reviews-ios-android', stripEmpty(input), waitSeconds),
    );

    server.registerTool(
        'url-pdf-to-markdown',
        {
            title: 'URL and PDF to Markdown',
            description: ACTORS[5]?.description,
            inputSchema: {
                urls: z.array(z.string()).min(1).max(30),
                waitSeconds: wait,
            },
        },
        async ({ urls, waitSeconds }) => call('url-pdf-to-markdown', { urls }, waitSeconds),
    );

    return server;
}

async function call(actor: string, input: Record<string, unknown>, waitSeconds: number | undefined) {
    const spec = ACTORS.find((item) => item.name === actor);
    if (!spec) throw new Error(`Unknown actor ${actor}.`);
    try {
        const result = await runActor(actor, input, spec.memoryMbytes, spec.timeoutSecs, waitSeconds ?? 180, spec.build);
        return {
            content: [{ type: 'text' as const, text: redact(JSON.stringify(result, null, 2), process.env.APIFY_TOKEN?.trim()) }],
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Actor run failed.';
        return {
            isError: true,
            content: [{ type: 'text' as const, text: redact(message, process.env.APIFY_TOKEN?.trim()) }],
        };
    }
}

function stripEmpty(input: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined && value !== ''));
}
