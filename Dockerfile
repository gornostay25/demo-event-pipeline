FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
FROM base AS install
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

# Build
FROM base AS release
COPY --from=install /app/node_modules ./node_modules
COPY . .

# Build the application
RUN bun run build

# Run migrations and start
CMD ["sh", "-c", "bun run migration:run && bun run start:prod"]