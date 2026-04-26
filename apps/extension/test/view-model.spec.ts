import { describe, expect, it } from "vitest";

import { createIdleSyncState } from "../src/shared/sync-state";
import { getPopupViewModel } from "../src/popup/view-model";

describe("getPopupViewModel", () => {
  it("returns the idle state content by default", () => {
    expect(getPopupViewModel(createIdleSyncState())).toEqual({
      statusLabel: "준비",
      statusTone: "neutral",
      title: "배지 동기화",
      description: "현재 탭의 배지 데이터를 가져옵니다.",
      actionLabel: "지금 동기화",
      actionDisabled: false,
      summaryItems: [],
      copyItems: [],
    });
  });

  it("returns a success summary when sync data is present", () => {
    const viewModel = getPopupViewModel({
      status: "success",
      message: "동기화가 완료되었습니다.",
      lastSync: {
        slug: "abc123def456",
        badgeUrl: "http://localhost:3000/badge/abc123def456.svg",
        markdownSnippet: "![Programmers Badge](http://localhost:3000/badge/abc123def456.svg)",
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
    expect(viewModel.badgeImageUrl).toBe("http://localhost:3000/badge/abc123def456.svg");
    expect(viewModel.badgeImageAlt).toBe("Programmers User 배지 미리보기");
    expect(viewModel.summaryItems).toEqual([
      { label: "점수", value: "9,999점" },
      { label: "레벨", value: "Skill 3" },
      { label: "풀이", value: "100/300" },
      { label: "순위", value: "42위" },
    ]);
    expect(viewModel.copyItems).toHaveLength(2);
    expect(viewModel.copyItems[0]?.value).toContain("localhost:3000");
    expect(viewModel.copyItems.map((item) => item.buttonLabel)).toEqual(["복사", "복사"]);
  });

  it("hides the summary subtitle when the handle matches the display name", () => {
    const viewModel = getPopupViewModel({
      status: "success",
      message: "동기화가 완료되었습니다.",
      lastSync: {
        slug: "abc123def456",
        badgeUrl: "http://localhost:3000/badge/abc123def456.svg",
        markdownSnippet: "![Programmers Badge](http://localhost:3000/badge/abc123def456.svg)",
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
