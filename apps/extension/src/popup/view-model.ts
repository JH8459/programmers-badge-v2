import type { ExtensionSyncState } from "../shared/sync-state.js";

type PopupStatusTone = "neutral" | "info" | "success" | "danger";

interface PopupSummaryItem {
  label: string;
  value: string;
}

interface PopupCopyItem {
  key: "badge-url" | "markdown-snippet";
  label: string;
  buttonLabel: string;
  value: string;
  preview: string;
}

export interface PopupViewModel {
  statusLabel: string;
  statusTone: PopupStatusTone;
  title: string;
  description: string;
  actionLabel: string;
  actionDisabled: boolean;
  summaryTitle?: string;
  summarySubtitle?: string;
  badgeImageUrl?: string;
  badgeImageAlt?: string;
  summaryItems: PopupSummaryItem[];
  copyItems: PopupCopyItem[];
}

const normalizeSummaryIdentity = (value: string | undefined): string | undefined => {
  const normalizedValue = value?.trim().replace(/^@+/, "").toLocaleLowerCase();

  return normalizedValue || undefined;
};

const getSummarySubtitle = (
  summaryTitle: string | undefined,
  programmerHandle: string | undefined
): string | undefined => {
  if (!programmerHandle) {
    return undefined;
  }

  if (normalizeSummaryIdentity(summaryTitle) === normalizeSummaryIdentity(programmerHandle)) {
    return undefined;
  }

  return `@${programmerHandle}`;
};

export const getPopupViewModel = (state: ExtensionSyncState): PopupViewModel => {
  switch (state.status) {
    case "syncing":
      return {
        statusLabel: "진행 중",
        statusTone: "info",
        title: "동기화 중",
        description: state.message,
        actionLabel: "동기화 중...",
        actionDisabled: true,
        summaryItems: [],
        copyItems: [],
      };
    case "success":
      return {
        statusLabel: "완료",
        statusTone: "success",
        title: "배지 반영 완료",
        description: "필요한 형식을 복사해 바로 사용하세요.",
        actionLabel: "다시 동기화",
        actionDisabled: false,
        summaryTitle: state.lastSync?.displayName,
        summarySubtitle: getSummarySubtitle(
          state.lastSync?.displayName,
          state.lastSync?.programmerHandle
        ),
        badgeImageUrl: state.lastSync?.badgeUrl,
        badgeImageAlt: state.lastSync?.displayName
          ? `${state.lastSync.displayName} 배지 미리보기`
          : "배지 미리보기",
        summaryItems: state.lastSync
          ? [
              {
                label: "점수",
                value: `${state.lastSync.rankingScore.toLocaleString()}점`,
              },
              {
                label: "레벨",
                value: `Skill ${state.lastSync.skillLevel}`,
              },
              {
                label: "풀이",
                value: `${state.lastSync.solvedCount.toLocaleString()}/${state.lastSync.solvedTotal.toLocaleString()}`,
              },
              {
                label: "순위",
                value: `${state.lastSync.rankingRank.toLocaleString()}위`,
              },
            ]
          : [],
        copyItems: [
          state.lastSync?.badgeUrl
            ? {
                key: "badge-url",
                label: "Badge URL",
                buttonLabel: "복사",
                value: state.lastSync.badgeUrl,
                preview: state.lastSync.badgeUrl,
              }
            : null,
          state.lastSync?.markdownSnippet
            ? {
                key: "markdown-snippet",
                label: "Markdown",
                buttonLabel: "복사",
                value: state.lastSync.markdownSnippet,
                preview: state.lastSync.markdownSnippet,
              }
            : null,
        ].filter((item): item is PopupCopyItem => item !== null),
      };
    case "needs-programmers-page":
      return {
        statusLabel: "탭 확인",
        statusTone: "danger",
        title: "탭 확인 필요",
        description: state.message,
        actionLabel: "다시 확인",
        actionDisabled: false,
        summaryItems: [],
        copyItems: [],
      };
    case "not-logged-in":
      return {
        statusLabel: "세션 확인",
        statusTone: "danger",
        title: "세션 확인 필요",
        description: state.message,
        actionLabel: "다시 확인",
        actionDisabled: false,
        summaryItems: [],
        copyItems: [],
      };
    case "error":
      return {
        statusLabel: "오류",
        statusTone: "danger",
        title: "동기화 실패",
        description: state.message,
        actionLabel: "다시 시도",
        actionDisabled: false,
        summaryItems: [],
        copyItems: [],
      };
    default:
      return {
        statusLabel: "준비",
        statusTone: "neutral",
        title: "배지 동기화",
        description: "현재 탭의 배지 데이터를 가져옵니다.",
        actionLabel: "지금 동기화",
        actionDisabled: false,
        summaryItems: [],
        copyItems: [],
      };
  }
};
