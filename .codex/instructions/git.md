# Git Instruction

## Commit Message Default

- 기본 형식은 `type: 한국어 설명`이다.
- scope가 유용하면 `type(scope): 한국어 설명`을 사용한다.
- scope는 `api`, `extension`, `badge-core`, `shared-types`, `docs`처럼 변경 경계를 드러내는 값을 권장한다.
- 제목은 짧게 쓰고, 필요하면 본문에서 Why를 보강한다.

## Recommended Types

- `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `style`

## Commit Splitting Rule

- 서로 다른 목적의 변경은 분리한다.
- 큰 cross-project 변경은 가능하면 boundary별로 나눈다.
- 동일 기능의 코드, 테스트, 최소 문서 보강은 함께 묶을 수 있다.

## Never Commit

- 비밀키, 환경파일, 세션 정보
- 식별 가능한 사용자 데이터 샘플
