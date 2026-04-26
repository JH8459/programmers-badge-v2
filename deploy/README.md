# Deployment

이 디렉토리는 NAS production 배포 기준 파일을 둔다.
로컬 개발용 `docker-compose.yml`은 이미지를 로컬에서 build해서 띄우고, NAS 배포용 `deploy/docker-compose.deploy.yml`은 GHCR에서 이미지를 pull해 실행한다.

## Workflow Split

- `.github/workflows/verify.yml`
  - PR 검증용
  - `pnpm verify`를 실행한다.
- `.github/workflows/deploy-api.yml`
  - `master` push 시 API 관련 변경만 골라서 실행한다.
  - `pnpm verify` 후 GHCR push, NAS SSH deploy를 수행한다.
- `.github/workflows/release.yml`
  - `v*` tag push 또는 수동 실행 시 GitHub Release를 생성한다.

## Required Secrets

필수 secrets:

- `NAS_HOST`: NAS 호스트 또는 도메인
- `NAS_PORT`: SSH 포트
- `NAS_USER`: SSH 로그인 사용자
- `NAS_PASSWORD`: 배포에 사용할 NAS 계정 비밀번호
- `NAS_REPO_DIR`: NAS 내부 저장소 경로
- `NAS_API_PORT`: NAS에서 외부에 노출할 API 포트, 기본 추천값은 `5010`
- `PUBLIC_BASE_URL`: badge URL 생성에 사용할 public base URL

선택 secrets:

- `GHCR_PULL_USERNAME`: NAS가 GHCR에서 private image를 pull할 때 사용할 GitHub username
- `GHCR_PULL_TOKEN`: NAS가 GHCR에서 private image를 pull할 때 사용할 token

## Secret Guidance

- `GHCR_PULL_TOKEN`은 가능하면 `read:packages`만 가진 token을 사용한다.
- GHCR package를 public으로 운영하면 `GHCR_PULL_USERNAME`, `GHCR_PULL_TOKEN` 없이도 pull할 수 있다.
- `deploy-api.yml`의 `deploy` job은 `production` environment를 사용하므로, 위 secrets를 repository secrets 대신 environment secrets로 두는 편이 안전하다.
- password 인증은 빠르게 붙이기 쉽지만, 장기적으로는 deploy 전용 SSH key로 전환하는 편이 더 안전하다.

## NAS Prerequisites

- `git`
- `docker`
- `docker compose` 또는 `/usr/local/bin/docker-compose`
- `curl`

## First-Time Setup

1. NAS에 저장소를 한 번 clone한다.
2. `NAS_USER`가 해당 저장소에서 `git fetch origin master`를 수행할 수 있게 만든다.
3. GHCR image가 private이면 `docker login ghcr.io`가 가능하도록 token 전략을 정한다.

## Deploy Artifact

배포는 `latest`가 아니라 `sha-<commit>` tag 이미지를 기준으로 수행한다.
즉, NAS는 workflow가 방금 push한 정확한 이미지를 pull해서 실행한다.
