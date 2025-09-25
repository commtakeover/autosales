FROM oven/bun:1.1.13-slim

WORKDIR /app

COPY package.json ./
RUN bun install

COPY . .

# CMD ["bun", "run", "migrate.ts"]