---
name: git-commit
description: PROGRAMMERS-BADGE-V2용 커밋 메시지 생성과 안전한 커밋 절차를 제공한다.
---

## 언제 사용하나

- "커밋", "commit" 요청 시

## 기준 문서

- `.opencode/instructions/git.md`

## 워크플로우

1. `git status`
2. `git diff`
3. `git log -5`
4. 타입 분류 및 메시지 작성
5. `git add` + `git commit`

## 메시지 규칙

- `type: 한국어 설명`
- `type(scope): 한국어 설명` (scope 선택)
- scope는 `api`, `extension`, `badge-core`, `shared-types`, `docs` 등을 권장
- Why 중심, What은 코드로

## 분리 기준

- 서로 다른 타입은 분리
- 독립 기능은 분리

## 안전 장치

- 비밀키/환경파일 커밋 금지
- 민감한 사용자 데이터 샘플 커밋 금지
- 명시적 요청 없으면 커밋하지 않는다.
