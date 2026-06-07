import { describe, expect, it } from "vitest";

import { createIdleSyncState } from "../src/shared/sync-state";
import { getPopupViewModel } from "../src/popup/view-model";

describe("getPopupViewModel", () => {
  it("returns the idle state content by default", () => {
    expect(getPopupViewModel(createIdleSyncState())).toEqual({
      statusLabel: "준비",
      statusTone: "neutral",
      title: "배지 동기화",
      description: "현재 탭에서 Programmers 배지 데이터를 가져옵니다.",
      actionLabel: "지금 동기화",
      actionDisabled: false,
      badgePreviewOptions: [],
      summaryItems: [],
    });
  });

  it("returns a success summary when sync data is present", () => {
    const viewModel = getPopupViewModel({
      status: "success",
      message: "동기화가 완료되었습니다.",
      lastSync: {
        slug: "abc123def456",
        badgeUrl: "https://api.programmers-badge.jh8459.com/badge/abc123def456.svg",
        miniBadgeUrl: "https://api.programmers-badge.jh8459.com/badge/abc123def456-mini.svg",
        markdownSnippet:
          "![Programmers Badge](https://api.programmers-badge.jh8459.com/badge/abc123def456.svg)",
        miniMarkdownSnippet:
          "![Programmers Mini Badge](https://api.programmers-badge.jh8459.com/badge/abc123def456-mini.svg)",
        programmerHandle: "programmers-user",
        displayName: "Programmers User",
        solvedCount: 100,
        solvedTotal: 300,
        skillLevel: 3,
        rankingScore: 9999,
        rankingRank: 42,
        badgeTier: "intermediate",
        syncedAt: "2026-04-19T10:00:00.000Z",
      },
    });

    expect(viewModel.statusTone).toBe("success");
    expect(viewModel.title).toBe("배지 반영 완료");
    expect(viewModel.summaryTitle).toBe("Programmers User");
    expect(viewModel.summarySubtitle).toBe("@programmers-user");
    expect(viewModel.badgePreviewOptions).toEqual([
      {
        key: "standard",
        label: "standard",
        imageUrl: "https://api.programmers-badge.jh8459.com/badge/abc123def456.svg",
        imageAlt: "Programmers User standard 배지 미리보기",
        copyItems: [
          {
            key: "badge-url",
            label: "Badge URL",
            buttonLabel: "복사",
            value: "https://api.programmers-badge.jh8459.com/badge/abc123def456.svg",
            preview: "https://api.programmers-badge.jh8459.com/badge/abc123def456.svg",
          },
          {
            key: "markdown-snippet",
            label: "Markdown",
            buttonLabel: "복사",
            value:
              "![Programmers Badge](https://api.programmers-badge.jh8459.com/badge/abc123def456.svg)",
            preview:
              "![Programmers Badge](https://api.programmers-badge.jh8459.com/badge/abc123def456.svg)",
          },
        ],
      },
      {
        key: "mini",
        label: "mini",
        imageUrl: "https://api.programmers-badge.jh8459.com/badge/abc123def456-mini.svg",
        imageAlt: "Programmers User mini 배지 미리보기",
        copyItems: [
          {
            key: "badge-url",
            label: "Badge URL",
            buttonLabel: "복사",
            value: "https://api.programmers-badge.jh8459.com/badge/abc123def456-mini.svg",
            preview: "https://api.programmers-badge.jh8459.com/badge/abc123def456-mini.svg",
          },
          {
            key: "markdown-snippet",
            label: "Markdown",
            buttonLabel: "복사",
            value:
              "![Programmers Mini Badge](https://api.programmers-badge.jh8459.com/badge/abc123def456-mini.svg)",
            preview:
              "![Programmers Mini Badge](https://api.programmers-badge.jh8459.com/badge/abc123def456-mini.svg)",
          },
        ],
      },
    ]);
    expect(viewModel.summaryItems).toEqual([
      { label: "점수", value: "9,999점" },
      { label: "레벨", value: "Skill 3" },
      { label: "풀이", value: "100/300" },
      { label: "순위", value: "42위" },
    ]);
    expect(viewModel.badgePreviewOptions[0]?.copyItems).toHaveLength(2);
    expect(viewModel.badgePreviewOptions[0]?.copyItems[0]?.value).toContain(
      "api.programmers-badge.jh8459.com"
    );
    expect(viewModel.badgePreviewOptions[0]?.copyItems.map((item) => item.label)).toEqual([
      "Badge URL",
      "Markdown",
    ]);
    expect(viewModel.badgePreviewOptions[1]?.copyItems.map((item) => item.label)).toEqual([
      "Badge URL",
      "Markdown",
    ]);
  });

  it("hides the summary subtitle when the handle matches the display name", () => {
    const viewModel = getPopupViewModel({
      status: "success",
      message: "동기화가 완료되었습니다.",
      lastSync: {
        slug: "abc123def456",
        badgeUrl: "https://api.programmers-badge.jh8459.com/badge/abc123def456.svg",
        miniBadgeUrl: "https://api.programmers-badge.jh8459.com/badge/abc123def456-mini.svg",
        markdownSnippet:
          "![Programmers Badge](https://api.programmers-badge.jh8459.com/badge/abc123def456.svg)",
        miniMarkdownSnippet:
          "![Programmers Mini Badge](https://api.programmers-badge.jh8459.com/badge/abc123def456-mini.svg)",
        programmerHandle: "JH8459",
        displayName: "JH8459",
        solvedCount: 100,
        solvedTotal: 300,
        skillLevel: 3,
        rankingScore: 9999,
        rankingRank: 42,
        badgeTier: "intermediate",
        syncedAt: "2026-04-19T10:00:00.000Z",
      },
    });

    expect(viewModel.summaryTitle).toBe("JH8459");
    expect(viewModel.summarySubtitle).toBeUndefined();
    expect(viewModel.summaryItems).toHaveLength(4);
  });

  it("shortens the programmers-page-required title", () => {
    const viewModel = getPopupViewModel({
      status: "needs-programmers-page",
      message: "Programmers 문제 페이지를 열어 주세요.",
      lastSync: null,
    });

    expect(viewModel.statusLabel).toBe("탭 확인");
    expect(viewModel.title).toBe("탭 확인 필요");
    expect(viewModel.actionLabel).toBe("다시 확인");
  });
});
