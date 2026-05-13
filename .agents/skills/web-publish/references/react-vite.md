# React/Vite Reference

## 기준 선택

- `apps/web`은 Vite + React + TypeScript를 기본값으로 둔다.
- 현재 목적은 landing, guide, contact, privacy 같은 public UI이므로 SSR framework를 기본값으로 두지 않는다.
- server runtime이 필요한 기능이 생기면 API endpoint를 추가하고 web은 HTTP contract만 사용한다.

## 공식 레퍼런스

- React 새 앱 가이드: https://react.dev/learn/start-a-new-react-project
- React 설치/gradual adoption: https://react.dev/learn/installation
- Vite 시작 가이드: https://vite.dev/guide/
- Vite 정적 배포 가이드: https://vite.dev/guide/static-deploy
- React Router docs: https://reactrouter.com/

## 권장 scaffold

```text
apps/web/
  index.html
  package.json
  tsconfig.json
  vite.config.ts
  src/
    main.tsx
    App.tsx
    routes/
      LandingPage.tsx
      GuidePage.tsx
      ContactPage.tsx
      PrivacyPage.tsx
    styles/
      theme.css
```

## 기본 scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -p tsconfig.json --noEmit && vite build",
    "preview": "vite preview",
    "lint": "eslint src --max-warnings 0",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "vitest run"
  }
}
```

## UI 기준

- dark background, navy/cyan accent, badge/dashboard visual language를 유지한다.
- 페이지별 primary action을 하나 이상 명확히 둔다.
- mobile width에서 headline, CTA, copy block이 먼저 읽히게 한다.
- legal copy는 장식보다 가독성과 정확성을 우선한다.
