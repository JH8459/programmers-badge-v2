# Recurring Mistakes

## Runtime Path Confusion

- Mistake:
  repo-local skill까지 `.codex/*` 아래에 두려고 가정하는 것
- Prevention:
  repo-local skill은 `.agents/skills/*`, project-scoped custom subagent는 `.codex/agents/*`에 둔다.
- Checkpoint:
  skill, subagent, plugin, rule 문서를 추가할 때 먼저 Codex의 runtime-discovered path와 source-of-truth 문서 경로를 구분한다.

## Folder Symmetry Over Runtime Conventions

- Mistake:
  디렉터리 대칭성을 이유로 공식 runtime 경로를 무시하고 구조를 바꾸는 것
- Prevention:
  폴더를 새로 만들기 전에 "Codex가 실제로 이 파일을 어디서 읽는가"를 먼저 확인한다.
- Checkpoint:
  `.agents`, `.codex`, `plugins` 같은 런타임 경로를 건드릴 때 공식 경로 규칙을 먼저 검토한다.

## Over-Translating Runtime Identifiers

- Mistake:
  agent/skill의 `name`, 파일명, 호출 키까지 한글로 바꾸려는 것
- Prevention:
  runtime identifier는 English/ASCII로 유지하고, `description`, `developer_instructions`, 문서 텍스트만 한국어로 바꾼다.
- Checkpoint:
  `.toml`, `SKILL.md`, `openai.yaml`의 identifier 필드를 편집할 때 호출 키와 설명 텍스트를 분리해서 본다.
