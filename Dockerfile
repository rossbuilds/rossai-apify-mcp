# Minimal image for running this MCP server over stdio.
# No secrets are baked in: pass APIFY_TOKEN at runtime, e.g.
#   docker run -i --rm -e APIFY_TOKEN rossai-apify-mcp

FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY src ./src
RUN npm run build && npm prune --omit=dev --ignore-scripts

FROM node:22-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /app/package.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
USER node
ENTRYPOINT ["node", "dist/index.js"]
