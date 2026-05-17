# Web Rule

## Ownership

`apps/web`은 React public web UI로서 아래를 소유한다.

- landing page와 product positioning
- 사용 방법 안내, 설치 안내, badge URL/Markdown 사용 안내
- 문의하기 page와 support entrypoint
- 개인정보처리방침 같은 public legal page
- Chrome Web Store 제출과 연결되는 public documentation surface

## Runtime Defaults

- 기본 stack은 Vite + React + TypeScript다.
- package manager는 repo 기본값인 `pnpm`을 사용한다.
- 기본 build output은 Vite 기본값인 `dist`를 사용한다.
- container runtime은 `apps/web/Dockerfile`에서 Vite build 결과를 Nginx 정적 파일로 서빙한다.
- production UI host는 `https://programmers-badge.jh8459.com`을 기본 방향으로 둔다.
- production API host는 `https://api.programmers-badge.jh8459.com`을 기본 방향으로 둔다.
- public badge URL은 초기 운영 단순성을 위해 `https://api.programmers-badge.jh8459.com/badge/...` 형태를 기본 방향으로 둔다.

## Routing Defaults

- `/`: landing page
- `/guide`: extension 설치, sync, badge 복사 사용 방법
- `/contact`: 문의하기와 support channel 안내
- `/privacy`: Chrome Web Store 제출용 개인정보처리방침
- `/terms`는 명시적 필요가 생길 때 추가한다.

## UI And Publishing Defaults

- UI 톤은 extension/store assets와 맞춰 dark, navy/cyan, badge/productivity visual language를 유지한다.
- 프로젝트 전역 accent는 favicon 계열 navy/blue를 기본으로 사용하고, green은 명시적인 success/status 의미가 있을 때만 제한적으로 사용한다.
- public UI는 반복적인 AI template, 의미 없는 장식 문구, 과한 shadow/glow를 피한다.
- header/navigation은 과한 pill shape나 organic blob button을 피하고, 낮은 radius와 명확한 edge를 가진 product topbar로 구성한다.
- landing overview hero는 description과 product preview를 하나의 section 안에 묶고, preview가 copy보다 과하게 커지지 않도록 보조 visual 비중으로 둔다.
- landing 전용 bitmap asset은 `apps/web/src/assets/landing` 아래에 의미가 드러나는 ASCII 파일명으로 둔다.
- 문구는 한국어를 기본으로 두고, Chrome Web Store 제출에 필요한 legal/policy copy는 명확하고 과장 없이 작성한다.
- 정적/문서성 page를 우선하고, 서버 런타임이 필요한 기능은 명시적 필요가 생길 때 API endpoint로 분리한다.
- 문의하기는 초기에는 GitHub Issues 또는 mailto link로 시작하고, 저장형 contact form은 API endpoint와 abuse 방지 기준을 먼저 정한 뒤 추가한다.
- `vite preview`는 local build preview 용도이며 production server로 사용하지 않는다.

## Boundary Rules

- `apps/web`은 `apps/api`를 import하지 않고 HTTP contract만 사용한다.
- `apps/web`은 Chrome API를 직접 사용하지 않는다.
- API request/response validation이 필요하면 `packages/shared-types` zod schema를 우선한다.
- web-specific UI state는 web app 안에 두고, extension storage/background state와 공유하지 않는다.
- public page에 민감한 사용자 정보나 운영 secret을 노출하지 않는다.

## Deployment And Domain Guardrails

- DNS 변경은 Route 53 hosted zone record와 NAS/reverse proxy routing을 함께 확인한다.
- production compose는 API와 web service를 함께 정의하지만, web workflow는 web image만 pull하고 web service만 재시작한다.
- production host routing을 바꾸면 API/extension의 hosted API URL, CORS, Chrome `host_permissions`, `PUBLIC_BASE_URL`을 함께 검증한다.
- `/badge/*.svg` public badge URL은 `api.programmers-badge.jh8459.com` API host 기준으로 제공한다.
- `/privacy`를 web으로 이전하면 API의 임시 `/privacy` route 유지 여부를 별도로 결정한다.

## Validation

- web code 변경 시 최소 `pnpm --filter @programmers-badge/web lint`, `typecheck`, `build`를 확인한다.
- web Dockerfile이나 compose 변경 시 가능하면 `docker compose -f docker-compose.local.yml build web`을 확인한다.
- route나 copy 변경 시 작은 viewport에서 primary action, readability, link target을 확인한다.
- API origin 변경이 포함되면 API, extension, deploy docs를 함께 검증한다.
