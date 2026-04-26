# Deployment

이 디렉토리는 NAS production 배포 문서를 둔다.
compose 파일은 repo root의 `docker-compose.yml`, `docker-compose.local.yml` 두 개를 기준으로 관리한다.
- `docker-compose.yml`: NAS production deploy 기본 파일
- `docker-compose.local.yml`: 로컬 개발/검증용 파일

## Workflow Split

- `.github/workflows/verify.yml`
  - PR 검증용
  - `pnpm verify`를 실행한다.
- `.github/workflows/deploy-api.yml`
  - `master` push 시 API 관련 변경만 골라서 실행한다.
  - `pnpm verify` 후 DockerHub push, deploy compose sync, `.env.deploy` 갱신, NAS SSH deploy를 수행한다.
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
- `NAS_API_PORT`: NAS에서 외부에 노출할 API 포트, 기본 추천값은 `5010`
- `PUBLIC_BASE_URL`: badge URL 생성에 사용할 public base URL

## Secret Guidance

- `deploy-api.yml`의 `deploy` job은 `production` environment를 사용하므로, 위 secrets를 repository secrets 대신 environment secrets로 두는 편이 안전하다.
- password 인증은 빠르게 붙이기 쉽지만, 장기적으로는 deploy 전용 SSH key로 전환하는 편이 더 안전하다.
- 현재 workflow는 root 계정 또는 docker 실행 권한이 있는 계정 기준을 전제로 한다.

## NAS Prerequisites

- `docker`
- `docker compose` 또는 `/usr/local/bin/docker-compose`
- `curl`

## First-Time Setup

1. `NAS_DEPLOY_DIR` 디렉터리를 만든다.
2. `NAS_USER`가 해당 디렉터리에 쓸 수 있게 한다.
3. `NAS_USER`가 `docker ...` 또는 `/usr/local/bin/docker-compose ...`를 직접 실행할 수 있게 한다.

## Deploy Artifact

배포는 DockerHub `latest` 이미지를 기준으로 수행한다.
workflow는 `latest`와 `sha-<commit>`를 함께 push하지만, NAS는 `docker-compose.yml`에서 참조하는 `latest`만 pull한다.
`sha-<commit>`는 추적과 수동 롤백용 보조 tag로만 유지한다.

배포 시 NAS로 동기화되는 파일은 아래 두 파일이다.

- `docker-compose.yml`
- `.env.deploy`
