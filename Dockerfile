FROM node:22.13-bookworm-slim AS build

RUN npm install -g pnpm@10.28.2

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/badge-core/package.json packages/badge-core/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY packages/config/package.json packages/config/package.json

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter @programmers-badge/shared-types build \
  && pnpm --filter @programmers-badge/badge-core build \
  && pnpm --filter @programmers-badge/api build

FROM node:22.13-bookworm-slim AS runtime

ENV NODE_ENV=production
RUN npm install -g pnpm@10.28.2

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY packages/badge-core/package.json packages/badge-core/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY packages/config/package.json packages/config/package.json

RUN pnpm install --prod --frozen-lockfile

COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/packages/badge-core/dist packages/badge-core/dist
COPY --from=build /app/packages/shared-types/dist packages/shared-types/dist

ENV PORT=3000
ENV DATABASE_PATH=/data/programmers-badge.sqlite

EXPOSE 3000

CMD ["pnpm", "--filter", "@programmers-badge/api", "start"]
