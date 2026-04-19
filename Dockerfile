# ---------- Stage 1: Build ----------
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# ---------- Stage 2: Runtime ----------
FROM node:20-alpine

WORKDIR /app

ARG PORT=8319
ARG CLICKUP_TOKEN=token

ENV PORT=$PORT
ENV CLICKUP_TOKEN=$CLICKUP_TOKEN

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE $PORT

CMD ["node", "dist/index.js"]