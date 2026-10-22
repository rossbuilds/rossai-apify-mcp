#!/usr/bin/env node
import { randomUUID } from 'node:crypto';

import type { Request, Response } from 'express';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

import { createServer } from './server.js';

const httpMode = process.argv.includes('--http');

if (httpMode) {
    const port = Number(process.env.PORT ?? 8787);
    const app = createMcpExpressApp({ host: '127.0.0.1' });
    app.post('/mcp', async (req: Request, res: Response) => {
        const server = createServer();
        const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
        });
        res.on('close', () => {
            void transport.close();
            void server.close();
        });
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
    });
    app.get('/health', (_req: Request, res: Response) => {
        res.status(200).json({ ok: true });
    });
    app.listen(port, '127.0.0.1', () => {
        console.error(`Streamable HTTP MCP listening on http://127.0.0.1:${port}/mcp`);
    });
} else {
    const server = createServer();
    await server.connect(new StdioServerTransport());
}
