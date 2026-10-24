# rossai-apify-mcp

[![Listed on mcpservers.org](https://mcpservers.org/badge.svg)](https://mcpservers.org/servers/rossbuilds/rossai-apify-mcp)


MCP server for the public Apify actors published by [appreciative_duct](https://apify.com/appreciative_duct). Each tool starts an Actor run with the Apify API and returns the dataset items.

The server reads `APIFY_TOKEN` from the environment. That token has to be yours. Nothing in this package embeds one.

## Tools

| Tool | Actor |
| --- | --- |
| `sitemap-url-extractor` | Sitemap URL Extractor |
| `seo-audit-ai-search-readiness` | SEO Audit & AI Search Readiness |
| `google-trends-batch-scraper` | Google Trends Scraper (Batch, Reliable) |
| `website-screenshot-batch` | Website Screenshot Batch |
| `app-reviews-ios-android` | App Reviews for iOS and Android |
| `url-pdf-to-markdown` | URL and PDF to Markdown |

A tool waits up to `waitSeconds` (default 180, maximum 300) and returns at most 100 dataset items. The response includes the run id and the Console URL when there is more to open.

## stdio

```bash
npm install
npm run build
APIFY_TOKEN=your_token node dist/index.js
```

Claude Desktop and other stdio clients can use:

```json
{
  "mcpServers": {
    "rossai-apify": {
      "command": "node",
      "args": ["/absolute/path/to/rossai-apify-mcp/dist/index.js"],
      "env": { "APIFY_TOKEN": "your_token" }
    }
  }
}
```

## Streamable HTTP

```bash
npm run build
APIFY_TOKEN=your_token node dist/index.js --http
```

The server listens on `http://127.0.0.1:8787/mcp`. Set `PORT` to change it. `GET /health` returns `{ "ok": true }`.

## Zero-install Apify MCP

Apify hosts an MCP endpoint that can call these actors without this package. Your Apify token is still required by that host:

https://mcp.apify.com/?actors=appreciative_duct/sitemap-url-extractor,appreciative_duct/seo-audit-ai-search-readiness,appreciative_duct/google-trends-batch-scraper,appreciative_duct/website-screenshot-batch,appreciative_duct/app-reviews-ios-android,appreciative_duct/url-pdf-to-markdown

## Registry files

`server.json` names the server `io.github.rossbuilds/rossai-apify-mcp` in the official MCP registry and points at the `.mcpb` bundle attached to the GitHub release v1.0.0. `glama.json` lists the maintainer. `mcpb/manifest.json` is the bundle manifest. The bundle asks for your token at install time. `youtube-transcript-batch` is not a tool here because that actor stayed private.

## Source

https://github.com/rossbuilds/rossai-apify-mcp

## Docker

```bash
docker build -t rossai-apify-mcp .
docker run -i --rm -e APIFY_TOKEN rossai-apify-mcp
```

The image runs the stdio server as the non-root `node` user. No token is baked in; pass `APIFY_TOKEN` at runtime.
