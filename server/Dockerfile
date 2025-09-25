# FROM oven/bun:1.1.13-slim AS base
FROM  oven/bun:1.1.13-slim AS base
WORKDIR /app
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
EXPOSE 3001
# ENV 
# CMD ["bun", "run", "--watch", "server.ts"]
CMD ["bun", "run", "server.ts"]