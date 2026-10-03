FROM node:22-bookworm-slim AS base
WORKDIR /workspace
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

FROM base AS dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM dependencies AS build
COPY . .
RUN pnpm build

FROM build AS runner
ENV NODE_ENV=production
CMD ["pnpm", "start"]

FROM node:22-bookworm-slim AS production
WORKDIR /workspace
ENV NODE_ENV=production
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate && pnpm install --prod --frozen-lockfile
COPY --from=build /workspace/dist ./dist
COPY --from=build /workspace/crm ./crm
COPY --from=build /workspace/drizzle ./drizzle
COPY --from=build /workspace/drizzle.config.ts ./drizzle.config.ts
COPY --from=build /workspace/server ./server
CMD ["node", "dist/index.js"]
