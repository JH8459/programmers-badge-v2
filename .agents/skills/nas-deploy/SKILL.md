---
name: nas-deploy
description: Use when the user wants to prepare, validate, or update this repository's API production deployment flow that goes from local changes to DockerHub, GitHub Actions, and a NAS host. Use for deploy-impact review, workflow edits, compose or env changes, post-deploy verification, and rollback guidance. Do not use for extension-only release tasks or unrelated feature implementation.
---

# NAS Deploy

이 skill은 현재 repo의 API production deploy 절차를 기준으로 배포 영향 분석과 운영 체크를 고정한다.

기본 배포 모델:

- local validation
- API DockerHub image build and push
- GitHub Actions API `production` deploy job
- NAS에 `docker-compose.yml`, `.env.deploy` 동기화
- API container restart
- `/api/health` 확인

## Required context

작업 전에 아래 문서를 우선 기준으로 본다.

- `.codex/rules/common.md`
- `.codex/rules/architecture.md`
- `.codex/rules/api.md`
- `.codex/rules/api/runtime.md`
- `.codex/instructions/workflow.md`
- `deploy/README.md`
- `.github/workflows/deploy-api.yml`
- `docker-compose.yml`
- `Dockerfile`

## When To Use

- API runtime env, Dockerfile, compose, deploy workflow를 수정할 때
- 현재 diff가 production deploy를 트리거하는지 판단할 때
- NAS deploy 실패 원인을 좁힐 때
- 배포 전 preflight checklist나 배포 후 확인 절차가 필요할 때
- `latest`와 `sha-<commit>` image tag 운영 기준을 점검할 때

## Workflow

1. diff를 먼저 분류한다.
   - API code change인지, image build change인지, compose or env change인지, workflow change인지 나눈다.
   - `apps/api/**`, `packages/badge-core/**`, `packages/shared-types/**`, `Dockerfile`, `docker-compose.yml`, `deploy/**`, `.github/workflows/deploy-api.yml` 영향 여부를 본다.
   - web-only 변경은 `deploy-web.yml`과 web-publish 기준으로 분리하고, API deploy로 묶지 않는다.
2. 현재 deploy chain과의 정합성을 확인한다.
   - API Docker image name, `DOCKER_IMAGE`, `API_PORT`, `PUBLIC_BASE_URL`가 서로 맞는지 본다.
   - shared production compose를 쓰므로 `.env.deploy`의 `WEB_DOCKER_IMAGE`, `WEB_PORT`를 깨뜨리지 않는지 본다.
   - `docker-compose.yml`의 env key와 workflow가 NAS에 쓰는 `.env.deploy` key가 같은지 본다.
   - health check 경로가 `/api/health` 기준으로 유지되는지 본다.
3. preflight validation 범위를 정한다.
   - 기본값은 `pnpm verify`다.
   - `Dockerfile`, `docker-compose.yml`, runtime env가 바뀌면 가능하면 local container build 또는 compose smoke test까지 본다.
   - 실행하지 못한 검증은 이유를 남긴다.
4. GitHub Actions deploy workflow를 점검한다.
   - path filters가 현재 변경 범위를 놓치지 않는지 본다.
   - DockerHub push tag가 `latest`, `sha-${github.sha}` 둘 다 유지되는지 본다.
   - API workflow는 `api` service만 pull/restart하고, web service를 같이 재시작하지 않는지 본다.
   - `production` environment와 secret 가정이 현재 문서와 맞는지 본다.
5. NAS 운영 가정을 점검한다.
   - NAS에 필요한 바이너리 `docker`, `docker compose` 또는 `/usr/local/bin/docker-compose`, `curl` 가정을 유지하는지 본다.
   - deploy 디렉터리에 `docker-compose.yml`, `.env.deploy`만 동기화된다는 현재 모델을 유지하는지 본다.
6. 배포 후 확인 절차를 정리한다.
   - NAS 내부 `curl http://127.0.0.1:<API_PORT>/api/health`
   - 외부 `https://<domain>/api/health`
   - 필요하면 `https://<domain>/badge/<slug>.svg`
7. 실패 시 rollback guidance를 남긴다.
   - 현재 모델에서는 `sha-<commit>` tag가 수동 추적과 rollback용 보조 tag다.
   - 새 인프라를 지어내지 말고 현재 image tag와 compose 모델 안에서 복구 절차를 설명한다.

## Guardrails

- 현재 deploy 모델을 기본값으로 유지한다.
- extension release workflow와 섞지 않는다. extension-only 작업이면 이 skill을 쓰지 않는다.
- GitHub secret이나 NAS 접근 권한이 실제로 있다고 가정하지 않는다.
- 문서에 없는 NAS side effect나 새 운영 절차를 임의로 추가하지 않는다.
- 자동 배포 실행은 사용자가 명시적으로 요청한 경우에만 한다.

## Reporting

최종 보고에는 아래를 포함한다.

1. 어떤 배포 surface가 바뀌었는지
2. 어떤 validation을 했는지
3. 배포 전에 사람이 확인할 항목이 무엇인지
4. 배포 후 health check와 rollback 포인트가 무엇인지

## Prompt examples

```text
Use $nas-deploy to review this API diff for production deploy impact.
Check DockerHub, GitHub Actions, compose env alignment, and post-deploy verification.
```

```text
Use $nas-deploy to update the NAS deploy workflow after changing Dockerfile and PUBLIC_BASE_URL handling.
Run the right preflight checks and list any remaining operator steps.
```
