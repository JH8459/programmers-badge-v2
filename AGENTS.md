# AGENTS.md

이 문서는 `PROGRAMMERS-BADGE-V2` 작업의 진입 문서다.
상세 정책은 `.opencode/rules/*`, 작업 절차는 `.opencode/instructions/*`를 source-of-truth로 사용한다.

## Read Order

1. `AGENTS.md`
2. `.opencode/rules/product.md`
3. `.opencode/rules/architecture.md`
4. 관련 task에 맞는 `.opencode/instructions/*.md`
5. 필요 시 `.opencode/rules/roadmap.md`, `.opencode/rules/adrs/README.md`

## Repository Defaults

- `PROGRAMMERS-BADGE-V2`는 hosted badge product다.
- MVP 기본 결과물은 public badge URL과 Markdown snippet이다.
- 설명은 한국어로 작성하고, 경로/명령어/식별자는 English 그대로 둔다.
- 변경은 작고 검증 가능한 단위로 유지한다.

## Hard Guardrails

- GitHub repository write, GitHub Actions, PAT, admin dashboard, queue/Redis/WebSocket은 명시적 요청 없이는 다루지 않는다.
- raw credential 저장을 기본값으로 두지 않는다.
- public surface에 민감한 사용자 정보를 노출하지 않는다.
- `packages/*`는 `apps/*`를 import하지 않는다.
- `packages/badge-core`에는 framework, network, filesystem, Chrome API를 넣지 않는다.
- `apps/api`는 rendering 규칙을 중복 구현하지 않는다.
- `apps/extension`은 backend persistence 로직을 복제하지 않는다.

## Directory Index

- `.opencode/rules/product.md`: 제품 목표, MVP 범위, auth 기본값
- `.opencode/rules/architecture.md`: 시스템 구조, 책임, boundary
- `.opencode/rules/roadmap.md`: 다음 단계와 deferred scope
- `.opencode/rules/adrs/README.md`: 장기 결정 기록 위치
- `.opencode/instructions/workflow.md`: planning/execution/validation/reporting 기본값
- `.opencode/instructions/review.md`: 리뷰 체크리스트와 severity
- `.opencode/instructions/git.md`: commit message와 분리 규칙

## Working Rule

- 설계만 요청받았으면 파일을 수정하지 않는다.
- 구현 시에는 영향 범위에 맞는 `lint`, `typecheck`, `test`, `build`를 수행한다.
- 최종 보고에는 변경 내용, 이유, 파일, 검증, 후속 작업을 포함한다.
- 애매하면 범위를 넓히기보다 hosted badge MVP와 package boundary를 다시 확인한다.
