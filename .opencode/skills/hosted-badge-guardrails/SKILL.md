---
name: hosted-badge-guardrails
description: hosted badge product 방향, 보안, package boundary 가드레일을 빠르게 점검한다.
---

## 언제 사용하나

- auth, sync, public badge, extension 권한, badge delivery 관련 작업을 다룰 때
- 작업이 GitHub export, raw credential 저장, 과한 인프라 확장으로 번질 위험이 있을 때
- 구현 전에 현재 작업이 MVP 범위를 지키는지 점검하고 싶을 때

## 기준 문서

- `.opencode/instructions/project-context.md`
- `.opencode/instructions/architecture.md`
- `.opencode/instructions/database.md`
- `.opencode/instructions/review.md`

## 빠른 체크리스트

1. 이 작업이 hosted badge delivery를 강화하는가, 아니면 범위를 넓히는가?
2. `apps/api`, `apps/extension`, `packages/badge-core`, `packages/shared-types` 책임이 분리되어 있는가?
3. raw credential 저장이나 민감 정보 공개가 기본값으로 들어가지는 않았는가?
4. GitHub repository write, PAT, workflow automation이 명시적 요청 없이 섞이지 않았는가?
5. privacy/data retention 이슈를 새로 만들면 보고했는가?

## 기본 판단 규칙

- badge rendering은 `packages/badge-core`
- browser/session integration은 `apps/extension`
- persistence/public endpoint는 `apps/api`
- shared payload와 contract는 `packages/shared-types`

## 금지 패턴

- API와 extension이 같은 normalization 규칙을 각자 따로 구현
- public badge endpoint에 내부용 식별자나 민감 데이터 노출
- 필요가 입증되지 않은 queue, Redis, analytics, admin dashboard 선행 도입
