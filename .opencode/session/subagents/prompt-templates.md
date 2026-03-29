# Subagent Prompt Templates

## 공통 컨텍스트 블록

```text
Project context:
- PROGRAMMERS-BADGE-V2 is a hosted badge product.
- `apps/api` owns API, persistence, sync orchestration, and public badge delivery.
- `apps/extension` owns Chrome UX and browser integration.
- `packages/badge-core` owns pure badge rendering/domain rules.
- `packages/shared-types` owns shared contracts only.
- MVP does not write badge files to the user's GitHub repository by default.
```

## 1) Explore Lane Template

```text
READ-ONLY 탐색만 수행하세요.
목표: 영향 package/파일/원인 후보/리스크를 정리.
반환:
- 영향 package 우선순위
- 핵심 파일 경로(우선순위)
- 원인 후보 2~3개
- 최소 변경 구현 경로
- 검증 체크리스트
```

## 2) Plan Lane Template

```text
구현 계획 문서를 작성하세요.
목표: 파일 단위 작업 분해 + 병렬/직렬 구분 + boundary 유지.
반환:
- In scope / Out of scope
- 페이즈별 실행 계획
- 병렬 가능한 작업 매트릭스
- 리스크/완화 전략
- DoD
```

## 3) Build Support Template

```text
빌드/린트 로그를 분석하세요.
반환:
- 오류 분류(타입/린트/런타임/의존성)
- 우선순위
- 즉시 수정안
- 재검증 순서
```

## 4) Review Support Template

```text
리뷰 체크리스트 기반으로 diff를 점검하세요.
반환:
- CRITICAL/WARNING/SUGGESTION
- 파일:라인 근거
- boundary/security/MVP drift 근거
- 수정 제안
```

## 5) Test Loop Template

```text
테스트 루프를 운영하세요.
반환:
- 실패 케이스 재현 여부
- 수정 후 재검증 결과
- 잔여 이슈
- 종료 가능 여부(DoD 충족 여부)
```
