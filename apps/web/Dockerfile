FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/contracts/package.json packages/contracts/package.json

RUN npm install

FROM node:20-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG VITE_API_BASE_URL=https://tickets.midominio.com/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build --workspace @ticket-v2/web

FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
