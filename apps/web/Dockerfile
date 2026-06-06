FROM node:22.13-bookworm-slim AS build

RUN npm install -g pnpm@10.28.2

WORKDIR /app

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/config/package.json packages/config/package.json

RUN pnpm install --frozen-lockfile

COPY apps/web apps/web
COPY apps/extension/store-assets apps/extension/store-assets
COPY packages/config/tsconfig packages/config/tsconfig

RUN test -n "${VITE_API_BASE_URL}" && pnpm --filter @programmers-badge/web build

FROM nginx:1.27-alpine AS runtime

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80
