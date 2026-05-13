# UI Quality Reference

## Hard No

- 모든 page를 같은 hero + card grid + CTA template으로 만들지 않는다.
- decorative eyebrow badge가 headline을 반복하면 제거한다.
- 의미 없는 장식 문구 대신 실제 기능, 상태, route, 날짜, badge URL 예시 같은 정보를 쓴다.
- card에 과한 shadow, blur, glow를 남발하지 않는다.
- radius scale을 page마다 임의로 섞지 않는다. 한 화면에서 2-3개 수준으로 제한한다.
- header를 `border-radius: 999px` pill bar로 만들지 않는다. 제품형 topbar는 낮은 radius와 선명한 grid/edge를 우선한다.
- mobile menu button은 organic blob/jelly 형태보다 기능이 드러나는 compact control 형태를 우선한다.
- Unicode 문자를 icon처럼 쓰지 않는다. 필요하면 SVG 또는 icon library를 쓴다.
- 전체 app을 한 파일에 몰아넣지 않는다. route, component, data/theme을 분리한다.

## Layout Selection

- Landing page: 짧은 hero, product mockup 또는 badge preview, 3-step flow, install CTA, privacy/contact footer.
- Guide page: 단계별 instruction, screenshot/mock panel, copyable example, troubleshooting section.
- Contact page: support channel, expected response scope, GitHub Issues/mail link, FAQ.
- Privacy page: 장식보다 readability, collection/use/storage/delete/contact 섹션 명확성.
- Dashboard 성격 화면이 생기면 sidebar/topbar/stat/list 구조를 쓰고 landing template을 재사용하지 않는다.

## Project Tone

- Dark base, navy/cyan accent, badge/dashboard/productivity visual language를 유지한다.
- Project-wide accent는 favicon 계열 navy/blue를 기본으로 사용한다. Green은 success/status 의미가 명확한 경우에만 제한적으로 쓴다.
- color는 CTA, selected state, status highlight에 집중한다.
- text는 off-white와 muted blue-gray 계열을 사용하고 pure black/pure white 대비를 피한다.
- code block, badge preview, extension popup mockup처럼 실제 product object가 있는 경우에만 어두운 panel을 강조한다.
- header와 navigation은 dashboard chrome처럼 단단하게 보이도록 얇은 border, 낮은 radius, restrained active state를 사용한다.

## Component Chrome Pattern

- Header, segmented control, tab, toolbar처럼 navigation 성격의 component는 favicon 계열 navy를 주 색상으로 사용한다.
- Green은 global accent, CTA, header/navigation 배경으로 사용하지 않는다. 필요하면 success/status 의미가 명확한 작은 상태 표시에만 제한한다.
- Radius는 낮게 유지한다. Topbar는 14-16px, nav item은 8px, icon tile은 12px 수준을 기본값으로 본다.
- Active state는 각 item 배경을 직접 바꾸기보다 부모 내부의 single indicator layer를 움직이는 방식을 우선한다.
- Indicator는 `transform` 기반 transition을 사용하고, easing은 `cubic-bezier(0.22, 1, 0.36, 1)`처럼 빠르게 정착되는 값을 사용한다.
- Hover/focus는 navy overlay와 subtle blue border inset을 사용한다. 과한 glow, blur, scale-up은 피한다.
- Mobile에서는 header를 2-column grid로 바꾸고 navigation은 접는다. Toggle button은 organic shape가 아니라 compact rectangular control로 만든다.
- Mobile toggle active/hover도 navy/blue 계열을 쓰고, green accent bar를 넣지 않는다.

## Pre-Output Checklist

- headline은 desktop에서 2줄 안에 들어가는지 확인한다.
- subtitle은 1-2문장으로 제한한다.
- primary CTA와 secondary CTA 역할이 다른지 확인한다.
- mobile에서 첫 화면에 핵심 가치와 CTA가 보이는지 확인한다.
- 반복 section skeleton이 3번 이상 나오면 layout variation을 만든다.
- list item은 title만 두지 말고 metadata나 status를 포함한다.
- legal page는 visual flourish보다 정확한 문구와 링크를 우선한다.
