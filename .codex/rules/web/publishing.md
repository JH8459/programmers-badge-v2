# Web Publishing Rule

## Runtime Defaults

- 기본 stack은 Vite + React + TypeScript다.
- package manager는 repo 기본값인 `pnpm`을 사용한다.
- 기본 build output은 Vite 기본값인 `dist`를 사용한다.
- container runtime은 `apps/web/Dockerfile`에서 Vite build 결과를 Nginx 정적 파일로 서빙한다.
- `vite preview`는 local build preview 용도이며 production server로 사용하지 않는다.

## Routing Defaults

- `/`: landing page
- `/contact`: 문의하기와 support channel 안내
- `/privacy`: Chrome Web Store 제출용 개인정보처리방침
- `/terms`는 명시적 필요가 생길 때 추가한다.

## Domain Defaults

- production UI host는 `https://programmers-badge.jh8459.com`을 기본 방향으로 둔다.
- production API host는 `https://api.programmers-badge.jh8459.com`을 기본 방향으로 둔다.
- public badge URL은 `https://api.programmers-badge.jh8459.com/badge/...` 형태를 기본 방향으로 둔다.

## Publishing Guardrails

- 정적/문서성 page를 우선하고, 서버 런타임이 필요한 기능은 명시적 필요가 생길 때 API endpoint로 분리한다.
- 문의하기는 초기에는 GitHub Issues 또는 mailto link로 시작하고, 저장형 contact form은 API endpoint와 abuse 방지 기준을 먼저 정한 뒤 추가한다.
- DNS 변경은 Route 53 hosted zone record와 NAS/reverse proxy routing을 함께 확인한다.
- production compose는 API와 web service를 함께 정의하지만, web workflow는 web image만 pull하고 web service만 재시작한다.
- production host routing을 바꾸면 API/extension의 hosted API URL, CORS, Chrome `host_permissions`, `PUBLIC_BASE_URL`을 함께 검증한다.
- `/badge/*.svg` public badge URL은 `api.programmers-badge.jh8459.com` API host 기준으로 제공한다.
- `/privacy`를 web으로 이전하면 API의 임시 `/privacy` route 유지 여부를 별도로 결정한다.

## Validation

- web Dockerfile이나 compose 변경 시 가능하면 `docker compose -f docker-compose.local.yml build web`을 확인한다.
