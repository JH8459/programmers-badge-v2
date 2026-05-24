# Web Asset Rule

## Asset Defaults

- landing 전용 bitmap asset은 `apps/web/src/assets/landing` 아래에 의미가 드러나는 ASCII 파일명으로 둔다.
- extension store listing asset은 `apps/extension/store-assets`에 두고 web landing 전용 asset과 섞지 않는다.
- app icon 같은 shared web runtime asset은 `apps/web/src/assets` 루트에 둘 수 있다.
- favicon, `apple-touch-icon`, web manifest처럼 브라우저가 고정 URL로 직접 찾는 정적 runtime asset은 `apps/web/public`에 둔다.
- `apps/web/public` 파일은 Vite build 시 `dist` 루트로 그대로 복사되므로, 실제 배포할 파일만 둔다.
- 생성 이미지나 screenshot asset은 사용 목적이 드러나는 이름을 사용한다.
  - 예: `hero-extension-preview.png`, `flow-install-extension.png`

## Usage Guardrails

- `apps/web/index.html`에서 참조하는 favicon 파일은 `apps/web/public`에 실제로 존재해야 한다.
- 레거시 favicon 호환이 필요하면 `favicon.ico`를 기본 fallback으로 두고, 필요한 PNG 크기는 `sizes`를 명시해 추가한다.
- primary image는 실제 product, extension popup, badge state, 사용 흐름을 드러내는 visual을 우선한다.
- landing overview preview 이미지는 copy보다 과하게 커지지 않도록 보조 visual 비중으로 둔다.
- 큰 bitmap asset을 추가하면 build output 크기를 확인하고, 필요하면 압축 또는 대체 asset을 검토한다.
- asset 파일명에는 공백, 날짜, 한글, 자동 생성 tool prefix를 남기지 않는다.
