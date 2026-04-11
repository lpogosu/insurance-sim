FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
# Бот в проде не нуждается ни в tsx, ни в vitest.
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=builder /app/dist ./dist

RUN addgroup -g 1001 -S app && adduser -S -u 1001 -G app app
USER app
CMD ["node", "dist/src/index.js"]
