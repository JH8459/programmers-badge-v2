# User Preferences

## Documentation And Source Of Truth

- `AGENTS.md`는 경로 안내만 두고, 세부 정책의 source-of-truth는 `.codex/*`에 둔다.
- 공통 규칙과 프로젝트별 규칙을 분리한 구조를 선호한다.
- repo-level memory는 `.codex/memory/*`에 둔다.

## Language

- 설명, 지침, 문서성 텍스트는 가능한 한 한국어로 작성한다.
- 경로, 명령어, 식별자, config key는 English 그대로 유지한다.
- custom agent와 skill의 runtime identifier는 English/ASCII를 유지하고, 설명과 instructions는 한국어로 둘 수 있다.

## Workflow

- reviewer 호출 시점은 하드코딩보다 skill에서 조절 가능하게 두는 방식을 선호한다.
- API와 extension은 하나의 repo 안에 있지만, 규칙과 reviewer는 분리해 관리하는 방식을 선호한다.
