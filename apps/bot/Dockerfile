# ── Telegram bot service (Bun) — built from the monorepo root ──
# build context in docker-compose = repository root (.)
FROM oven/bun:1.4.4-alpine@sha256:4cf82f5686b196504fe119db3fcd9185b191f82ece82c40680e597228ec6070a AS base
WORKDIR /app

# 1) Install dependencies from manifests (cacheable layer). All workspace
# manifests are copied — `bun install --frozen-lockfile` validates the whole
# workspace against bun.lock, so a missing member fails the install.
FROM base AS install
COPY package.json bun.lock ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY apps/worker/package.json ./apps/worker/
COPY apps/bot/package.json ./apps/bot/
COPY packages/db/package.json ./packages/db/
COPY packages/auth/package.json ./packages/auth/
COPY packages/agent-tools/package.json ./packages/agent-tools/
COPY packages/crypto/package.json ./packages/crypto/
COPY packages/mailer/package.json ./packages/mailer/
COPY packages/net/package.json ./packages/net/
COPY packages/storage/package.json ./packages/storage/
COPY packages/runner/package.json ./packages/runner/
COPY packages/eslint-config/package.json ./packages/eslint-config/
# --filter bot installs only the bot workspace and its dependency closure.
# INSTALL_FLAGS defaults to --production; the test gate overrides it to "".
ARG INSTALL_FLAGS="--production"
RUN bun install --frozen-lockfile --filter bot $INSTALL_FLAGS

# 2) Final image. Copy the whole install tree (manifests + every node_modules),
# then overlay the source. .dockerignore excludes node_modules, so `COPY . .`
# does not clobber the copied dependencies.
FROM base AS release
ENV NODE_ENV=production
COPY --from=install /app ./
COPY . .

RUN chmod -R a+rX /app

USER bun

# No migrations: the api owns them. The bot reads the instance bot token and writes
# account links through @repo/db, so it needs the database to be reachable.
CMD ["bun", "run", "apps/bot/src/index.ts"]
