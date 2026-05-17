# API Runtime Rule

## Runtime Defaults

- global prefix는 `/api`다.
- 기본 `PORT`는 `3000`이다.
- `PUBLIC_BASE_URL`이 없으면 public badge URL은 `http://localhost:${PORT}` 기준으로 생성한다.
- `PUBLIC_BADGE_PATH_PREFIX`가 없으면 public badge URL path는 `/badge`를 사용한다.
- `DATABASE_PATH`가 없으면 기본 SQLite 파일은 `data/programmers-badge.sqlite`다.
- `BADGE_OUTPUT_DIR`가 없으면 기본 SVG 출력 디렉토리는 `data/badges`다.
- Docker Compose runtime은 `/data/programmers-badge.sqlite`를 사용한다.
- Docker Compose public entrypoint는 API 단일 컨테이너 `:3000`을 사용한다.
- NAS production runtime은 root `docker-compose.yml` 파일과 `.env.deploy`를 기준으로 DockerHub 이미지를 pull한다.
- NAS host port 기본 추천값은 `5010`이다.
- runtime env는 단일 zod config로 읽고 bootstrap 전에 fail-fast 한다.

## Deploy Defaults

- API production deploy는 `API verify -> API DockerHub push -> deploy compose sync -> .env.deploy update -> NAS SSH deploy` 순서를 기본 흐름으로 두고, GitHub environment는 `production`을 사용한다.
- 현재 API deploy workflow는 root `docker-compose.yml` 파일을 NAS에 동기화하고, `.env.deploy`에 API/web image와 port env를 함께 기록한 뒤 API image만 pull하고 `api` service만 재시작한다.

## When Editing

- runtime env 규칙을 바꾸면 default 값, invalid env 실패 케이스, deploy 문서를 함께 갱신한다.
- Dockerfile, compose, deploy workflow를 바꾸면 NAS port, image tag, `.env.deploy` key 정합성을 함께 확인한다.
- health check 경로는 `/api/health` 기준으로 유지한다.
