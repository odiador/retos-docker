# Dockerfile para Next.js (producción)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --frozen-lockfile || npm install
COPY . .
RUN npm run build

# --- Producción ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copia solo lo necesario
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/next.config.* ./
COPY --from=builder /app/postcss.config.* ./
COPY --from=builder /app/tailwind.config.* ./

EXPOSE 3000
CMD ["npm", "start"]
