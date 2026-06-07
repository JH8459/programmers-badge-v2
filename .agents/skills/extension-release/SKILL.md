---
name: extension-release
description: Use when preparing or executing this repository's Chrome extension release to GitHub Release and Chrome Web Store, including version checks, release notes, package validation, commit/push, and extension-v* tag push. Trigger for extension deploy/release requests such as "extension 배포", "Chrome Web Store 배포", "extension-v tag push", or "버전 올리고 배포해줘".
---

# Extension Release

이 skill은 `apps/extension` 릴리스를 GitHub Release와 Chrome Web Store publish workflow까지 연결하는 절차를 고정한다.

## Required Context

작업 전에 아래 문서를 기준으로 본다.

- `.codex/rules/extension.md`
- `.codex/rules/extension/release-assets.md`
- `.codex/rules/deployment.md`
- `.codex/instructions/git.md`
- `.agents/skills/commit/SKILL.md`
- `.github/workflows/release-extension.yml`

현재 상태는 아래 순서로 확인한다.

- `git status --short --branch`
- `git diff --stat`
- `git diff --name-only`
- `apps/extension/manifest.json`의 `version`
- `apps/extension/package.json`의 `version`
- `apps/extension/release-notes/<version>.md` 존재 여부
- `git tag --list "extension-v<version>"`

## Workflow

1. 릴리스 버전을 결정한다.
   - `apps/extension/manifest.json` version을 source-of-truth로 본다.
   - `apps/extension/package.json` version과 반드시 일치시킨다.
   - tag 이름은 `extension-v<manifest-version>` 형식만 사용한다.
2. 패치 노트를 확인한다.
   - GitHub Release notes는 `apps/extension/release-notes/<manifest-version>.md`에 둔다.
   - Chrome Web Store V2 `publish` 요청에는 release notes 필드가 없으므로 Store listing 문구는 Dashboard에서 별도로 관리한다.
3. 릴리스 전 검증을 실행한다.
   - `pnpm --filter @programmers-badge/shared-types build`
   - `pnpm --filter @programmers-badge/extension lint`
   - `pnpm --filter @programmers-badge/extension typecheck`
   - `pnpm --filter @programmers-badge/extension test`
   - `pnpm package:extension`
   - `CWS_PUBLISHER_ID=test-publisher CWS_EXTENSION_ID=abcdefghijklmnopabcdefghijklmnop pnpm --filter @programmers-badge/extension publish:chrome-web-store -- --archive programmers-badge-extension-v<version>.zip --dry-run`
4. commit을 만든다.
   - workflow, extension code, release notes, docs가 하나의 extension release 목적이면 한 커밋으로 묶을 수 있다.
   - 커밋 메시지는 `chore(extension): <version> 릴리스 준비` 형식을 기본값으로 둔다.
5. branch를 push한다.
   - current branch를 rename하지 않는다.
   - force push는 사용자가 명시하지 않으면 하지 않는다.
6. tag를 만든 뒤 push한다.
   - 기존 `extension-v<version>` tag가 있으면 중단하고 사용자에게 보고한다.
   - lightweight tag를 기본값으로 사용한다. 현재 workflow는 tag push의 commit SHA를 checkout target으로 사용한다.
   - 순서:

```bash
git push origin HEAD
git tag extension-v<version>
git push origin extension-v<version>
```

7. 배포 상태를 보고한다.
   - tag push가 `.github/workflows/release-extension.yml`을 트리거한다.
   - workflow 성공은 Chrome Web Store review 제출 완료이며, Store 즉시 반영 완료가 아니다.

## Guardrails

- `manifest.json` version과 release tag가 다르면 배포하지 않는다.
- Store에 이미 published/submitted된 version보다 크지 않으면 publish script가 실패해야 한다.
- secret 값은 출력하거나 커밋하지 않는다.
- generated ZIP은 release artifact이며 git commit 대상이 아니다.
- `extension-v*` tag를 삭제하거나 덮어쓰지 않는다.

## Reporting

최종 보고에는 아래를 포함한다.

1. 릴리스 버전과 tag
2. 생성한 commit hash
3. push한 branch와 tag
4. 실행한 검증
5. GitHub Actions에서 확인할 workflow 이름
6. 남은 수동 확인 사항
