# =========================
# Build stage
# =========================
FROM node:22-bookworm AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy source
COPY . .

# Install dependencies
RUN pnpm install

# Optional build step
# Uncomment if the repo has a build script
RUN pnpm build

# =========================
# Production stage
# =========================
FROM node:22-bookworm

WORKDIR /app

# Install pnpm runtime
RUN npm install -g pnpm

# Copy fully prepared app from builder
COPY --from=builder /app /app

EXPOSE 3000

CMD ["pnpm", "run", "-F", "web", "-F", "server", "dev"]