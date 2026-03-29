---
name: code-reviewer
description: PROGRAMMERS-BADGE-V2 아키텍처와 MVP 가드레일 기준으로 리뷰를 수행한다.
---

## 언제 사용하나

- "코드 리뷰", "리뷰해줘", "검토해줘"

## 기준 문서

- `.opencode/instructions/project-context.md`
- `.opencode/instructions/review.md`
- `.opencode/instructions/architecture.md`
- `.opencode/instructions/design.md`
- `.opencode/instructions/database.md`
- `.opencode/instructions/coding.md`

## 워크플로우

1. `git diff --name-only`
2. `git diff`
3. package boundary / security / MVP 범위 대조
4. 등급 분류 (CRITICAL/WARNING/SUGGESTION)

## 출력 형식

```
[CRITICAL] 이슈 제목
파일: path:line
문제: ...
수정: ...
```

## 필수 체크

- `badge-core` purity 위반
- API/extension/shared-types 경계 위반
- raw credential 저장 또는 민감 정보 노출
- hosted badge MVP 범위 이탈
- 로딩/에러/빈 상태 또는 검증 누락
