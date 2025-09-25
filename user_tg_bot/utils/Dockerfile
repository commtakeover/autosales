FROM oven/bun:1.1.13-slim AS base
WORKDIR /app
COPY package.json tsconfig.json ./
RUN bun install
COPY . .
# CMD ["bun", "run", "--watch", "bot.ts"]
CMD ["bun", "run", "bot.ts"]