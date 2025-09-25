FROM oven/bun:1.1.13-slim AS base
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
# CMD ["bun", "run", "--watch", "bot.ts"]
CMD ["bun", "run", "bot.ts"]