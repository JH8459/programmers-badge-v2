# Web UI Rule

## UI And Copy Defaults

- UI 톤은 extension/store assets와 맞춰 dark, navy/cyan, badge/productivity visual language를 유지한다.
- 프로젝트 전역 accent는 favicon 계열 navy/blue를 기본으로 사용하고, green은 명시적인 success/status 의미가 있을 때만 제한적으로 사용한다.
- public UI는 반복적인 AI template, 의미 없는 장식 문구, 과한 shadow/glow를 피한다.
- header/navigation은 과한 pill shape나 organic blob button을 피하고, 낮은 radius와 명확한 edge를 가진 product topbar로 구성한다.
- landing overview hero는 description과 product preview를 하나의 section 안에 묶고, preview가 copy보다 과하게 커지지 않도록 보조 visual 비중으로 둔다.
- 문구는 한국어를 기본으로 두고, Chrome Web Store 제출에 필요한 legal/policy copy는 명확하고 과장 없이 작성한다.
- route나 copy 변경 시 작은 viewport에서 primary action, readability, link target을 확인한다.

## Guardrails

- UI를 generic SaaS template처럼 만들지 말고 extension/store assets와 이어지는 badge/productivity 톤을 유지한다.
- decorative label, 과한 그림자, 불필요한 pill badge, Unicode icon 같은 AI-generated UI 냄새가 강한 패턴을 피한다.
- public page에 secret, token, raw session, 식별 가능한 사용자 샘플 데이터를 넣지 않는다.
