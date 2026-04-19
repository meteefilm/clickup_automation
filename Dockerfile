# 0.1.0
#docker build --no-cache -t clickup-automation:0.1.0 .
#docker save --output clickup-automation.tar clickup-automation:0.1.0
#docker load --input clickup-automation.tar
#docker run -d -p 8319:8319 --name clickup-automation clickup-automation:0.1.0
#docker run -d -p 8319:8319 --name clickup-automationuat clickup-automationuat:uat-0.1.0

#  docker build --no-cache --build-arg PORT=8319 --build-arg CLICKUP_TOKEN=pk_90839349_AXWWHLFL68EE9KRGQXIPR3FTX6509U6T -t clickup-automation:0.1.0 .
#docker tag clickup-automation:0.1.0 199.168.50.160:5000/clickup-automation:0.1.0
#docker push 199.168.50.160:5000/clickup-automation:0.1.0
#docker build --no-cache -t clickup-automation:0.1.0 . && docker tag clickup-automation:0.1.0 199.168.50.160:5000/clickup-automation:0.1.0 && docker push 199.168.50.160:5000/clickup-automation:0.1.0


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