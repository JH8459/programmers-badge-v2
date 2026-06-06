# Extension Release Asset Rule

## Asset And Release Defaults

- extension runtime icon은 `apps/extension/assets/icons`에 두고 build 시 `dist/assets/icons`로 복사한다.
- Chrome Web Store listing 이미지는 `apps/extension/store-assets`에 두며 extension ZIP에는 포함하지 않는다.
- local extension package는 `pnpm package:extension`으로 만들고 root에 `programmers-badge-extension-v*.zip`을 생성한다.
- extension package release workflow, environment, secret ownership은 `.codex/rules/deployment.md`를 따른다.

## When Editing

- extension release artifact를 바꾸면 build output, zip packaging, release workflow를 함께 갱신한다.
- icon을 바꾸면 `manifest.json`, `copy-assets.mjs`, `dist` 포함 여부를 함께 확인한다.
- package script를 바꾸면 local `pnpm package:extension`, GitHub Actions `release-extension` workflow, `.codex/rules/deployment.md`를 함께 확인한다.
- store listing 이미지는 원본 `*-source.png`와 제출 규격 파일을 분리해 관리한다.
