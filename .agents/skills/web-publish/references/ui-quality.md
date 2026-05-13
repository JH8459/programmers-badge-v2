# UI Quality Reference

## Hard No

- 모든 page를 같은 hero + card grid + CTA template으로 만들지 않는다.
- decorative eyebrow badge가 headline을 반복하면 제거한다.
- 의미 없는 장식 문구 대신 실제 기능, 상태, route, 날짜, badge URL 예시 같은 정보를 쓴다.
- card에 과한 shadow, blur, glow를 남발하지 않는다.
- radius scale을 page마다 임의로 섞지 않는다. 한 화면에서 2-3개 수준으로 제한한다.
- Unicode 문자를 icon처럼 쓰지 않는다. 필요하면 SVG 또는 icon library를 쓴다.
- 전체 app을 한 파일에 몰아넣지 않는다. route, component, data/theme을 분리한다.

## Layout Selection

- Landing page: 짧은 hero, product mockup 또는 badge preview, 3-step flow, install CTA, privacy/contact footer.
- Guide page: 단계별 instruction, screenshot/mock panel, copyable example, troubleshooting section.
- Contact page: support channel, expected response scope, GitHub Issues/mail link, FAQ.
- Privacy page: 장식보다 readability, collection/use/storage/delete/contact 섹션 명확성.
- Dashboard 성격 화면이 생기면 sidebar/topbar/stat/list 구조를 쓰고 landing template을 재사용하지 않는다.

## Project Tone

- Dark base, neon green/cyan accent, badge/dashboard/productivity visual language를 유지한다.
- color는 CTA, selected state, status highlight에 집중한다.
- text는 off-white와 muted gray-green 계열을 사용하고 pure black/pure white 대비를 피한다.
- code block, badge preview, extension popup mockup처럼 실제 product object가 있는 경우에만 어두운 panel을 강조한다.

## Pre-Output Checklist

- headline은 desktop에서 2줄 안에 들어가는지 확인한다.
- subtitle은 1-2문장으로 제한한다.
- primary CTA와 secondary CTA 역할이 다른지 확인한다.
- mobile에서 첫 화면에 핵심 가치와 CTA가 보이는지 확인한다.
- 반복 section skeleton이 3번 이상 나오면 layout variation을 만든다.
- list item은 title만 두지 말고 metadata나 status를 포함한다.
- legal page는 visual flourish보다 정확한 문구와 링크를 우선한다.
