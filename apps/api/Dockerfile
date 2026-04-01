# Build from repository root:
#   docker build -f apps/api/Dockerfile .
FROM node:22-bookworm-slim

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@10.17.1 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/api ./apps/api
# Workspace member: only package.json needed for lockfile install (no mobile runtime in API image)
RUN mkdir -p apps/mobile
COPY apps/mobile/package.json ./apps/mobile/package.json

RUN pnpm install --frozen-lockfile

RUN chmod +x apps/api/entrypoint.sh

ENV NODE_ENV=production

EXPOSE 4000

ENTRYPOINT ["/app/apps/api/entrypoint.sh"]
