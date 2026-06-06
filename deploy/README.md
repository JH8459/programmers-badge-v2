# Deployment

이 디렉토리는 NAS production 배포 문서를 둔다.
compose 파일은 repo root의 `docker-compose.yml`, `docker-compose.local.yml` 두 개를 기준으로 관리한다.
- `docker-compose.yml`: NAS production deploy 기본 파일
- `docker-compose.local.yml`: 로컬 개발/검증용 파일. API와 web service는 source bind mount와 dev server/watch mode로 실행하며 host port 기본값은 NAS 기본값과 같은 `5010`/`5020`이다. 필요하면 shell env로 `API_PORT`, `WEB_PORT`, `PUBLIC_BASE_URL`, `VITE_API_BASE_URL`, `ALLOWED_WEB_ORIGINS`, `ALLOW_LOCALHOST_ORIGINS`, `COMPOSE_PROJECT_NAME`을 override한다.

## Workflow Split

- `.github/workflows/verify.yml`
  - PR 검증용
  - `pnpm verify`를 실행한다.
- `.github/workflows/deploy-api.yml`
  - `master` push 시 API/deploy 관련 변경을 골라서 실행한다.
  - API package 검증 후 API DockerHub push, deploy compose sync, `.env.deploy` 갱신, NAS SSH deploy를 수행한다.
  - restart 대상은 `api` service만이다.
  - GitHub environment는 `production`을 사용한다.
- `.github/workflows/deploy-web.yml`
  - `master` push 시 web/store-assets/deploy 관련 변경을 골라서 실행한다.
  - web package 검증 후 web DockerHub push, deploy compose sync, `.env.deploy` 갱신, NAS SSH deploy를 수행한다.
  - restart 대상은 `web` service만이다.
  - GitHub environment는 `production`을 사용한다.
- `.github/workflows/release-extension.yml`
  - `extension-v*` tag push 또는 수동 실행 시 extension zip 패키지를 GitHub Release asset으로 게시한다.
  - GitHub environment는 `extension-release`를 사용한다.
- `.github/workflows/release.yml`
  - `v*` tag push 또는 수동 실행 시 GitHub Release를 생성한다.

## Required Secrets

필수 secrets:

- `DOCKERHUB_USERNAME`: DockerHub username
- `DOCKERHUB_PASSWORD`: DockerHub password 또는 access token
- `NAS_HOST`: NAS 호스트 또는 도메인
- `NAS_PORT`: SSH 포트
- `NAS_USER`: SSH 로그인 사용자
- `NAS_PASSWORD`: 배포에 사용할 NAS 계정 비밀번호
- `NAS_DEPLOY_DIR`: NAS에 배포용 `docker-compose.yml`, `.env.deploy`를 둘 디렉터리

## Optional Variables

아래 값은 GitHub Actions variables로 둘 수 있으며, 없으면 workflow 기본값을 사용한다.

- `API_PORT`: NAS에서 외부에 노출할 API 포트, 기본값 `5010`
- `WEB_PORT`: NAS에서 외부에 노출할 web 포트, 기본값 `5020`
- `PUBLIC_BASE_URL`: badge URL 생성용 public API origin, 기본값 `https://api.programmers-badge.jh8459.com`
- `ALLOWED_WEB_ORIGINS`: API CORS 허용 web origin list, 기본값 `https://programmers-badge.jh8459.com`
- `ALLOW_LOCALHOST_ORIGINS`: localhost 동적 포트 CORS 허용 여부, production 기본값 `false`

Production workflow는 GitHub Actions variables와 workflow 기본값을 조합해 `.env.deploy`를 생성한다.

## Secret Guidance

- `deploy-api.yml`과 `deploy-web.yml`의 `deploy` job은 `production` environment를 사용하므로, 위 secrets를 repository secrets 대신 environment secrets로 두는 편이 안전하다.
- `API_PORT`, `WEB_PORT`, `PUBLIC_BASE_URL`, `ALLOWED_WEB_ORIGINS`, `ALLOW_LOCALHOST_ORIGINS`는 secret이 아니므로 GitHub Actions variables로 관리한다.
- password 인증은 빠르게 붙이기 쉽지만, 장기적으로는 deploy 전용 SSH key로 전환하는 편이 더 안전하다.
- 현재 workflow는 root 계정 또는 docker 실행 권한이 있는 계정 기준을 전제로 한다.
- `release-extension.yml`은 현재 GitHub Release asset 게시까지만 자동화한다. Chrome Web Store 게시 자동화는 별도 OAuth/API secret 구성이 필요하다.

## NAS Prerequisites

- `docker`
- `docker compose` 또는 `/usr/local/bin/docker-compose`
- `curl`

## First-Time Setup

1. `NAS_DEPLOY_DIR` 디렉터리를 만든다.
2. `NAS_USER`가 해당 디렉터리에 쓸 수 있게 한다.
3. `NAS_USER`가 `docker ...` 또는 `/usr/local/bin/docker-compose ...`를 직접 실행할 수 있게 한다.

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

## Deploy Artifact

배포는 DockerHub `latest` API/web 이미지를 기준으로 수행한다.
API workflow는 API image만, web workflow는 web image만 `latest`와 `sha-<commit>`로 push한다.
NAS는 `docker-compose.yml`에서 참조하는 `latest`만 pull하고, 변경된 service만 `up -d --no-deps`로 갱신한다.
`sha-<commit>`는 추적과 수동 롤백용 보조 tag로만 유지한다.

배포 시 NAS로 동기화되는 파일은 아래 두 파일이다.

- `docker-compose.yml`
- `.env.deploy`

## Post-Deploy Check

NAS 내부 확인:

```bash
cd <NAS_DEPLOY_DIR>
cat .env.deploy
docker compose --env-file .env.deploy -f docker-compose.yml ps
curl -i http://127.0.0.1:5010/api/health
curl -I http://127.0.0.1:5020/
```

외부 확인:

```bash
curl -i https://<api-domain>/api/health
curl -I https://<api-domain>/badge/<slug>.svg
curl -I https://<web-domain>/
```
