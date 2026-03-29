# UI/Design Guide

## 기본 UX 목표

- 사용자는 적은 단계로 sync 상태를 이해하고 badge를 복사할 수 있어야 한다.
- extension UI는 작고 빠르며, 핵심 액션이 한눈에 보여야 한다.
- public badge 관련 화면은 badge 자체보다 주변 UI가 더 튀지 않게 설계한다.
- 로딩, 에러, 빈 상태에서 다음 행동을 명확히 제안한다.

## 주요 화면 기준

### extension popup / options

- 작은 viewport를 전제로 우선순위가 분명한 레이아웃을 사용한다.
- 첫 화면에서 확인할 핵심 정보는 로그인 상태, 마지막 sync 상태, primary action이다.
- 한 화면에 너무 많은 설정을 넣지 말고 단계적으로 공개한다.
- sync 성공 후 badge URL 또는 Markdown 복사 액션을 바로 제공한다.

### public badge page 또는 preview

- badge SVG와 보조 설명은 분리해 읽기 쉽게 배치한다.
- public surface에서는 민감하거나 내부적인 데이터보다 badge 결과와 사용 방법에 집중한다.
- 데스크톱과 모바일 모두에서 badge 미리보기와 복사 UI가 깨지지 않아야 한다.

## 시각 방향

- 기존 디자인 시스템이 없다면 지나치게 범용적인 템플릿보다 제품 의도가 보이는 톤을 만든다.
- 배경은 단색만 사용하기보다 은은한 gradient, texture, shape로 깊이를 만든다.
- 색상은 기능 상태를 구분하는 데 사용하고, 불필요하게 많은 포인트 컬러를 섞지 않는다.
- badge와 코드 스니펫은 시각적으로 정확하고 읽기 쉽게 유지한다.

## 상호작용 규칙

- loading state는 버튼 또는 해당 영역 범위에서 우선 표현한다.
- clipboard, sync, auth 관련 피드백은 즉시 보여준다.
- motion은 의미 있는 전환에만 사용하고 `prefers-reduced-motion`을 존중한다.
- `alert()` 대신 인라인 메시지, toast, 상태 배너를 사용한다.

## 접근성

- 키보드 접근 가능한 버튼, 링크, 폼 구조를 유지한다.
- 색상만으로 상태를 전달하지 않는다.
- 작은 popup에서도 충분한 contrast와 touch target 크기를 확보한다.
