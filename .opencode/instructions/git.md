# Git Guide

## 커밋 메시지 규칙

- 기본 형식은 `type: 한국어 설명`이다.
- scope가 유용하면 `type(scope): 한국어 설명`을 사용한다.
- scope는 `api`, `extension`, `badge-core`, `shared-types`, `docs`처럼 변경 경계를 드러내는 값을 권장한다.
- 제목은 짧고 구체적으로 작성하고, 필요하면 본문에서 Why를 보강한다.

## 타입

- `feat`: 사용자 가치가 늘어나는 기능 추가
- `fix`: 버그 수정
- `refactor`: 동작 유지 구조 개선
- `docs`: 문서 변경
- `test`: 테스트 추가 또는 수정
- `chore`: 설정, 스크립트, 도구, 의존성 변경
- `perf`: 성능 개선
- `style`: 동작 영향 없는 포맷/스타일 정리

## 예시

- `feat(api): 공개 badge svg 엔드포인트 추가`
- `feat(extension): 동기화 결과 복사 액션 추가`
- `refactor(badge-core): 렌더링 옵션 계산 분리`
- `docs: opencode 작업 지침을 v2 구조에 맞게 정리`

## 분리 기준

- 서로 다른 목적의 변경은 분리 커밋한다.
- package boundary가 다른 큰 변경은 가능하면 분리한다.
- 동일 기능의 코드, 테스트, 최소 문서 보강은 함께 묶을 수 있다.

## 금지 사항

- 비밀키, 환경파일, 세션 정보 커밋 금지
- 사용자 데이터 샘플을 식별 가능한 형태로 커밋 금지
