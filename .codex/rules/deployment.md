# Deployment Rule

이 문서는 repo의 GitHub Actions deploy/release workflow, environment, secret ownership, NAS production 운영 절차의 source-of-truth다.
app별 runtime env, domain, permission 세부값은 각 app rule을 함께 본다.

## Workflow Ownership

- `.github/workflows/verify.yml`
  - PR to `master` 검증과 수동 검증을 담당한다.
  - root `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm test:e2e`, `pnpm test:api-coverage` 조합을 기준으로 한다.
- `.github/workflows/deploy-api.yml`
  - `master` push 또는 수동 실행 시 API production deploy를 담당한다.
  - API runtime/image 영향 변경만 자동 trigger에 포함한다.
  - API image만 DockerHub에 push하고, root `docker-compose.api.yml`와 `.env.api.deploy`만 NAS에 반영한 뒤 `api` service만 재시작한다.
- `.github/workflows/deploy-web.yml`
  - `master` push 또는 수동 실행 시 web production deploy를 담당한다.
  - web runtime/image 영향 변경만 자동 trigger에 포함한다.
  - web image만 DockerHub에 push하고, root `docker-compose.web.yml`와 `.env.web.deploy`만 NAS에 반영한 뒤 `web` service만 재시작한다.
- `.github/workflows/release-extension.yml`
  - `extension-v*` tag push 또는 수동 실행 시 extension zip package release를 담당한다.
  - 현재 동작은 GitHub Release asset 게시까지다.
- `.github/workflows/release.yml`
  - `v*` tag push 또는 수동 실행 시 repo-level GitHub Release를 생성한다.

## Environments

- API와 web production deploy job은 GitHub `production` environment를 사용한다.
- Extension package release job은 GitHub `extension-release` environment를 사용한다.
- environment secret이 필요한 workflow는 repository secret보다 environment secret을 우선한다.

## Production Secrets

`production` environment 필수 secrets:

- `DOCKERHUB_USERNAME`: DockerHub username
- `DOCKERHUB_PASSWORD`: DockerHub password 또는 access token
- `NAS_HOST`: NAS 호스트 또는 도메인
- `NAS_PORT`: SSH 포트
- `NAS_USER`: SSH 로그인 사용자
- `NAS_PASSWORD`: 배포에 사용할 NAS 계정 비밀번호
- `NAS_DEPLOY_DIR`: NAS에 배포용 service별 compose와 env 파일을 둘 디렉터리
- `SWAGGER_USERNAME`: production Swagger Basic Auth username
- `SWAGGER_PASSWORD`: production Swagger Basic Auth password

`production` environment 또는 repository variables:

- `API_PORT`: NAS에서 외부에 노출할 API 포트, 기본값 `5010`
- `WEB_PORT`: NAS에서 외부에 노출할 web 포트, 기본값 `5020`
- `PUBLIC_BASE_URL`: badge URL 생성용 public API origin, 기본값 `https://api.programmers-badge.jh8459.com`
- `ALLOWED_WEB_ORIGINS`: API CORS 허용 web origin list, 기본값 `https://programmers-badge.jh8459.com`
- `ALLOW_LOCALHOST_ORIGINS`: localhost 동적 포트 CORS 허용 여부, production 기본값 `false`
- `ENABLE_SWAGGER`: Swagger UI/OpenAPI JSON 노출 여부, production 기본값 `true`

## Compose Files

- `docker-compose.api.yml`: NAS production API deploy 파일
- `docker-compose.web.yml`: NAS production web deploy 파일
- `docker-compose.local.yml`: 로컬 개발/검증용 compose 파일

`docker-compose.local.yml`은 API와 web service를 source bind mount와 dev server/watch mode로 실행한다.
host port 기본값은 NAS 기본값과 같은 `5010`/`5020`이며, 필요하면 shell env로 override한다.

## NAS Prerequisites

- `docker`
- `docker compose` 또는 `/usr/local/bin/docker-compose`
- `curl`

## First-Time Setup

1. GitHub `production` environment에 필수 secrets와 variables를 설정한다.
2. NAS에 `NAS_DEPLOY_DIR` 디렉터리를 만든다.
3. `NAS_USER`가 `NAS_DEPLOY_DIR`에 쓸 수 있게 한다.
4. `NAS_USER`가 `docker ...` 또는 `/usr/local/bin/docker-compose ...`를 직접 실행할 수 있게 한다.

password 인증은 빠르게 붙이기 쉽지만, 장기적으로는 deploy 전용 SSH key로 전환하는 편이 더 안전하다.
현재 workflow는 root 계정 또는 docker 실행 권한이 있는 계정 기준을 전제로 한다.

## Deploy Trigger Guardrails

- API test-only, docs-only, root lockfile-only 변경은 API 자동 production deploy trigger에서 제외한다.
- web test-only, API-only, docs-only, root lockfile-only 변경은 web 자동 production deploy trigger에서 제외한다.
- root `package.json`, `pnpm-lock.yaml`, `turbo.json`, docs-only 변경만으로 production image 재생성이 필요하면 해당 workflow를 `workflow_dispatch`로 수동 실행한다.
- package script를 바꾸면 local script와 관련 GitHub Actions workflow를 함께 확인한다.
- deploy workflow를 바꾸면 environment, secret/variable 이름, artifact 이름, post-deploy health check를 함께 갱신한다.

## NAS Deploy Files

API 배포 시 NAS로 동기화되는 파일:

- `docker-compose.api.yml`
- `.env.api.deploy`

Web 배포 시 NAS로 동기화되는 파일:

- `docker-compose.web.yml`
- `.env.web.deploy`

기존 공용 `docker-compose.yml`, `.env.deploy`는 service별 workflow 전환 후 사용하지 않는다.
양쪽 service가 새 workflow로 한 번 이상 배포된 뒤에는 NAS deploy 디렉터리에서 제거해도 된다.

## Synology Reverse Proxy

API reverse proxy:

- source protocol: `HTTPS`
- source host: `api.programmers-badge.jh8459.com` 또는 실제 API public domain
- source port: `443`
- destination protocol: `HTTP`
- destination host: `127.0.0.1`
- destination port: `5010`

Web reverse proxy:

- source protocol: `HTTPS`
- source host: `programmers-badge.jh8459.com` 또는 실제 web public domain
- source port: `443`
- destination protocol: `HTTP`
- destination host: `127.0.0.1`
- destination port: `5020`

배포 확인은 아래 URL 기준으로 보는 편이 안전하다.

- `https://<api-domain>/api/health`
- `https://<api-domain>/badge/<slug>.svg`
- `https://<web-domain>/`

## Post-Deploy Check

NAS 내부 확인:

```bash
cd <NAS_DEPLOY_DIR>
cat .env.api.deploy
cat .env.web.deploy
docker compose --env-file .env.api.deploy -f docker-compose.api.yml ps
docker compose --env-file .env.web.deploy -f docker-compose.web.yml ps
curl -i http://127.0.0.1:5010/api/health
curl -I http://127.0.0.1:5020/
```

외부 확인:

```bash
curl -i https://<api-domain>/api/health
curl -I https://<api-domain>/badge/<slug>.svg
curl -I -u '<swagger-user>:<swagger-password>' https://<api-domain>/api/docs
curl -I https://<web-domain>/
```

Swagger는 production 기본값으로 활성화되어 있으며 `https://<api-domain>/api/docs`와 `https://<api-domain>/api/docs-json` 모두 Basic Auth를 요구한다.

## Extension Release

- extension package는 `pnpm package:extension`으로 생성한다.
- package archive 이름은 `programmers-badge-extension-v<manifest-version>.zip` 형식을 따른다.
- `release-extension.yml`은 release tag와 `apps/extension/manifest.json` version이 일치하지 않으면 실패해야 한다.
- Chrome Web Store listing 이미지는 `apps/extension/store-assets`에 두고 extension ZIP에는 포함하지 않는다.
- Chrome Web Store 자동 게시 workflow는 아직 현재 동작이 아니다.

## Chrome Web Store Automation Guardrails

Chrome Web Store 자동 게시를 추가할 때는 아래를 따른다.

- 별도 workflow를 추가하거나 `release-extension.yml`에 명확한 publish job을 분리한다.
- upload/publish credential은 `extension-release` 또는 별도 Chrome Web Store 전용 environment secret으로 둔다.
- OAuth refresh token 방식 또는 service account 방식을 사용할 수 있으며, 어느 방식을 쓰는지 문서와 secret 이름에 명확히 드러낸다.
- `manifest.json` version이 기존 Store version보다 크지 않으면 upload 전에 실패시킨다.
- package upload 후 publish는 Store review 제출이며, workflow 성공을 Store 즉시 반영으로 해석하지 않는다.
- publish warning은 기본적으로 실패 처리하거나 명시적으로 승인된 경우에만 통과시킨다.
