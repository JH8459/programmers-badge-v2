---
name: pr-workflow
description: Use when preparing this repository's changes for pull request review, including validating slash-free short kebab-case branch names, splitting commits by work unit, writing Korean commit messages without emojis, pushing a branch, drafting a PR from the repository template, and enforcing no-emoji PR titles. Trigger when the user asks in Korean or English for PR prep, commit/push/PR workflow, PR title/body drafting, branch naming, or reviewable commit organization, including requests like "PR 작성해줘", "PR 만들어줘", "커밋 분리하고 PR 올려줘", "push 하고 PR 작성해줘", or "PR 제목/본문 작성해줘".
---

# PR Workflow

이 skill은 PR 작성 직전의 변경 묶음, 커밋 메시지, push, PR 제목과 본문 작성 절차를 고정한다.

## Required Context

작업 전에 아래 문서를 기준으로 본다.

- `.codex/instructions/git.md`
- `.codex/instructions/workflow.md`
- `.agents/skills/commit/SKILL.md`
- `.github/PULL_REQUEST_TEMPLATE.md`가 있으면 PR 본문 기준으로 사용한다.

현재 상태는 아래 순서로 확인한다.

- `git status --short`
- `git diff --stat`
- `git diff --name-only`
- staged change가 있으면 `git diff --cached --name-only`
- 현재 브랜치: `git branch --show-current`

## Branch Naming

브랜치명은 PR에 올라갈 작업 내용을 예측해서 짧은 kebab-case로 만든다.

규칙:

- lowercase letter, number, hyphen만 사용한다.
- `JH8459`와 `/`는 브랜치명 어디에도 쓰지 않는다.
- 권장 길이는 2-4개 단어다.
- 브랜치명이 현재 작업 내용을 설명하지 못하면 더 짧고 구체적인 이름을 사용한다.

예시:

```text
branch-rules
pr-workflow
api-cors
web-guide
badge-sync
```

금지:

```text
JH8459-branch-rules
JH8459/branch-rules
feature/api-cors
fix/web-guide
```

push 또는 PR 생성 전에 현재 브랜치가 규칙을 어기면 current branch를 rename하지 않고, 작업 내용을 설명하는 compliant 새 브랜치를 생성해 진행한다.
단, 사용자가 브랜치 변경 금지나 특정 브랜치 유지 조건을 명시했으면 진행하지 않고 이유를 보고한다.
이미 같은 이름의 브랜치가 있거나 새 브랜치 생성이 충돌하면 진행하지 않고 사용자에게 해결 옵션을 보고한다.

## Work Unit Split

커밋은 작업 목적과 repo boundary 기준으로 나눈다. 한 커밋에 여러 boundary가 섞일 수 있지만, 같은 목적을 설명할 수 있어야 한다.

기본 분리 단위:

- `API`: `apps/api`, API 테스트, API CQRS 구조, runtime/config/CORS/persistence
- `Web`: `apps/web`, Vite/React/web Dockerfile, public web env
- `Extension`: `apps/extension`, extension runtime, release asset
- `Packages`: `packages/*`, shared contracts, badge-core, config package
- `CI`: `.github/workflows/*`, deploy pipeline, release workflow
- `Docs`: `README.md`, `.codex/rules/*`, 사용자 문서
- `AI`: `.agents/skills/*`, `.codex/*`, `AGENTS.md`, Conductor/Codex workflow config
- `Dev`: local compose, `conductor.json`, package manager setup, local tooling

분리 기준:

- 서로 다른 목적이면 분리한다.
- deploy/workflow 변경은 product code와 분리하는 편을 기본값으로 둔다.
- docs가 코드 변경을 이해하는 데 필요한 최소 보강이면 같은 커밋에 포함할 수 있다.
- `.codex`나 `.agents/skills` 변경은 가능하면 `AI` 또는 `Docs` 성격의 별도 커밋으로 둔다.
- lockfile 변경은 dependency를 추가한 app/package 커밋에 포함한다.

## Commit Messages

커밋 메시지는 한글 요약을 사용하고 이모지를 쓰지 않는다.

기본 형식:

```text
type(scope): 한글 요약
```

scope가 불필요하면:

```text
type: 한글 요약
```

권장 type:

- `feat`
- `fix`
- `refactor`
- `docs`
- `test`
- `chore`
- `ci`

예시:

```text
fix(api): CORS 런타임 환경 설정을 env 기반으로 정리
chore(web): API base URL 설정을 Vite env로 분리
ci(deploy): 배포 compose 환경 변수 주입을 정리
docs: 로컬 Docker 실행 방법을 갱신
chore(ai): PR 작성 워크플로우 skill 추가
chore(dev): Conductor 실행 설정을 local compose로 연결
```

금지:

- 커밋 제목의 이모지
- 영어만 있는 모호한 제목
- `wip`, `update`, `fix stuff` 같은 목적 불명 제목
- unrelated change를 한 커밋에 같이 stage

## Pre-PR Workflow

1. 변경 파일을 work unit으로 분류한다.
2. 커밋 계획을 먼저 사용자에게 제안한다.
3. 한 커밋 단위로만 stage한다.
4. 각 커밋에 맞는 검증을 실행한다.
5. commit message는 한글 요약과 no-emoji 규칙을 적용한다.
6. push 전에 최종 `git status --short`와 브랜치를 확인하고, 브랜치명 규칙 위반이 있으면 current branch를 rename하지 않고 compliant 새 브랜치를 만들어 진행한다.
7. 사용자가 push를 요청했을 때만 push한다.
8. PR 작성 전에 `.github/PULL_REQUEST_TEMPLATE.md`를 읽고 본문을 그 양식으로 채운다.

검증 기본값:

- cross-project 변경: `pnpm verify`
- API 변경: `pnpm --filter @programmers-badge/api test` 또는 영향 범위별 lint/typecheck/test
- Web 변경: `pnpm --filter @programmers-badge/web build`
- CI/compose 변경: workflow YAML 확인과 `docker compose ... config`
- Docs/AI-only 변경: 파일 내용, 링크, 경로 정합성 확인

## PR Drafting

PR 제목도 이모지를 쓰지 않는다. 제목은 대표 변경 목적 하나를 한글로 요약한다.

PR 제목 예시:

```text
chore: 로컬 개발 환경과 PR 워크플로우 정리
fix(api): CORS 런타임 환경 설정 오류 수정
ci: 배포 환경 변수 주입 방식 정리
```

PR 본문 작성 절차:

1. `.github/PULL_REQUEST_TEMPLATE.md`를 읽는다.
2. 템플릿의 섹션 이름과 체크리스트 구조를 유지한다.
3. `요약`에는 PR의 대표 목적을 1-2줄로 쓴다.
4. `변경 사항`에는 work unit별 핵심 변경만 적는다.
5. `영향 범위`는 실제 변경 범위만 체크한다.
6. `검증`에는 실행한 명령과 결과를 적는다.
7. `배포 영향`에는 env, secret, Docker, compose, NAS, extension release 영향을 명확히 표시한다.
8. 실행하지 못한 검증은 이유와 다음 확인 명령을 적는다.

`gh pr create`를 사용할 때는 제목과 body를 명시한다.

```sh
gh pr create --base master --title "chore: 로컬 개발 환경과 PR 워크플로우 정리" --body-file .context/pr-body.md
```

## Reporting

최종 보고에는 아래를 포함한다.

- 실제 커밋 목록과 각 커밋의 목적
- push 대상 브랜치
- PR 제목
- PR 생성 여부와 URL
- 실행한 검증
- 남은 수동 확인 사항
