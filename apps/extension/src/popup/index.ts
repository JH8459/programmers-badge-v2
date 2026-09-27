import {
  createIdleSyncState,
  DEFAULT_EXTENSION_SETTINGS,
  type ExtensionMessage,
  type ExtensionSettings,
  type ExtensionSyncState,
} from "../shared/sync-state.js";
import type {
  FailedSolutionRecord,
  GitHubConnectionResponse,
  GitHubRepository,
  SolutionRecordResult,
} from "@programmers-badge/shared-types";
import { getPopupViewModel } from "./view-model.js";
import type { BadgePreviewVariant } from "./view-model.js";
import { loadPopupInitialData } from "./initialize.js";

const root = document.querySelector<HTMLDivElement>("#app");

if (!root) {
  throw new Error("Popup root element was not found.");
}

const sendMessage = async <Response>(message: ExtensionMessage): Promise<Response> =>
  new Promise<Response>((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response: Response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      if (
        typeof response === "object" &&
        response !== null &&
        "error" in response &&
        typeof response.error === "string"
      ) {
        reject(new Error(response.error));
        return;
      }

      resolve(response);
    });
  });

let currentState = createIdleSyncState();
let currentSettings: ExtensionSettings = DEFAULT_EXTENSION_SETTINGS;
let githubConnection: GitHubConnectionResponse = {
  connected: false,
  accountLogin: null,
  installationId: null,
  settings: null,
};
let githubRepositories: GitHubRepository[] = [];
let githubRepositoriesStatus: "idle" | "loading" | "loaded" | "error" = "idle";
let failedSolutions: FailedSolutionRecord[] = [];
let githubStatusMessage = "";
let selectedPreviewVariant: BadgePreviewVariant = "standard";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const getGitHubRepositoryUrl = ({ owner, name }: GitHubRepository): string =>
  `https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;

const getSafeGitHubCommitUrl = (value: string | null): string | undefined => {
  if (value === null) {
    return undefined;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "github.com" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
};

const copyToClipboard = async (text: string | undefined): Promise<void> => {
  if (!text) {
    return;
  }

  await navigator.clipboard.writeText(text);
};

const refreshGitHubData = async (): Promise<void> => {
  githubRepositoriesStatus = "loading";
  const [repositoriesResult, failedSolutionsResult] = await Promise.allSettled([
    sendMessage<GitHubRepository[]>({ type: "get-github-repositories" }),
    sendMessage<FailedSolutionRecord[]>({ type: "get-failed-github-solutions" }),
  ]);
  const errors: string[] = [];

  if (repositoriesResult.status === "fulfilled") {
    githubRepositories = repositoriesResult.value;
    githubRepositoriesStatus = "loaded";
  } else {
    githubRepositories = [];
    githubRepositoriesStatus = "error";
    errors.push(
      repositoriesResult.reason instanceof Error
        ? repositoriesResult.reason.message
        : "GitHub 저장소 목록을 읽지 못했습니다."
    );
  }

  if (failedSolutionsResult.status === "fulfilled") {
    failedSolutions = failedSolutionsResult.value;
  } else {
    errors.push(
      failedSolutionsResult.reason instanceof Error
        ? failedSolutionsResult.reason.message
        : "실패한 풀이 기록을 읽지 못했습니다."
    );
  }

  githubStatusMessage = [...new Set(errors)].join(" ");
};

const render = (): void => {
  const viewModel = getPopupViewModel(currentState);
  const extensionVersion = chrome.runtime.getManifest().version;
  const selectedPreviewOption =
    viewModel.badgePreviewOptions.find((option) => option.key === selectedPreviewVariant) ??
    viewModel.badgePreviewOptions[0];
  const selectedCopyItems = selectedPreviewOption?.copyItems ?? [];
  const lastSyncTime = currentState.lastSync
    ? new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(
        new Date(currentState.lastSync.syncedAt)
      )
    : undefined;
  const lastSyncMarkup = currentState.lastSync
    ? `<p class="last-sync">마지막 동기화: ${escapeHtml(lastSyncTime ?? "")}</p>`
    : `<p class="last-sync">마지막 동기화 기록이 없습니다.</p>`;
  const previewToggleMarkup =
    viewModel.badgePreviewOptions.length > 1
      ? `
          <div class="preview-toggle-group" role="group" aria-label="배지 미리보기 형식">
            ${viewModel.badgePreviewOptions
              .map(
                (option) => `
                  <button
                    type="button"
                    class="preview-toggle-button"
                    data-preview-variant="${option.key}"
                    aria-pressed="${option.key === selectedPreviewOption?.key}"
                  >
                    ${escapeHtml(option.label)}
                  </button>
                `
              )
              .join("")}
          </div>
        `
      : "";
  const badgePreviewMarkup = selectedPreviewOption
    ? `
          <div class="badge-preview">
            <div class="badge-preview-header">
              <span class="badge-preview-label">Badge Preview</span>
              ${previewToggleMarkup}
            </div>
            <div class="badge-preview-frame" data-variant="${selectedPreviewOption.key}">
            <img
              class="badge-preview-image"
              src="${escapeHtml(selectedPreviewOption.imageUrl)}"
              alt="${escapeHtml(selectedPreviewOption.imageAlt)}"
            />
          </div>
        </div>
      `
    : "";
  const summaryMarkup =
    viewModel.summaryItems.length || viewModel.badgePreviewOptions.length
      ? `
        <section class="panel">
          ${viewModel.summaryTitle ? `<p class="summary-title">${escapeHtml(viewModel.summaryTitle)}</p>` : ""}
          ${badgePreviewMarkup}
          <div class="summary-grid">
            ${viewModel.summaryItems
              .map(
                (item) => `
                  <div class="stat-item">
                    <span class="stat-label">${escapeHtml(item.label)}</span>
                    <strong class="stat-value">${escapeHtml(item.value)}</strong>
                  </div>
                `
              )
              .join("")}
          </div>
        </section>
      `
      : "";
  const copyMarkup = selectedCopyItems.length
    ? `
        <section class="panel">
          <div class="panel-header">
            <span class="panel-title">복사</span>
          </div>
          <div class="copy-list">
            ${selectedCopyItems
              .map(
                (item) => `
                  <div class="copy-item">
                    <div class="copy-meta">
                      <span class="copy-label">${escapeHtml(item.label)}</span>
                      <p class="copy-preview" title="${escapeHtml(item.preview)}">${escapeHtml(item.preview)}</p>
                    </div>
                    <button type="button" class="copy-button" data-copy-key="${item.key}">${escapeHtml(item.buttonLabel)}</button>
                  </div>
                `
              )
              .join("")}
          </div>
        </section>
      `
    : "";
  const githubSettings = githubConnection.settings;
  const latestCommitUrl = getSafeGitHubCommitUrl(currentState.solutionRecord?.commitUrl ?? null);
  const latestSolutionMarkup = currentState.solutionRecord
    ? `
      <div class="github-solution-result" data-tone="${currentState.solutionRecord.status}">
        <p>${escapeHtml(currentState.solutionRecord.message)}</p>
        ${latestCommitUrl ? `<a class="github-link" href="${escapeHtml(latestCommitUrl)}" target="_blank" rel="noreferrer">저장된 커밋 보기</a>` : ""}
      </div>
    `
    : "";
  const selectedRepositoryId = githubSettings?.repositoryId ?? githubRepositories[0]?.id;
  const selectedRepository =
    githubRepositories.find(({ id }) => id === selectedRepositoryId) ?? githubSettings?.repository;
  const selectedRepositoryUrl = selectedRepository ? getGitHubRepositoryUrl(selectedRepository) : undefined;
  const selectedRepositoryIsAvailable = githubRepositoriesStatus === "loaded" && githubSettings
    ? githubRepositories.some(({ id }) => id === githubSettings.repositoryId)
    : true;
  const repositoryGuidance =
    githubRepositoriesStatus === "loading"
      ? "GitHub App 접근 저장소를 불러오고 있습니다."
      : githubRepositoriesStatus === "error"
      ? "저장소 목록을 불러오지 못했습니다. 오류를 확인한 뒤 목록을 새로고침하세요."
      : githubRepositoriesStatus === "loaded" && githubSettings && !selectedRepositoryIsAvailable
      ? "현재 GitHub App에서 이 저장소에 접근할 수 없습니다. GitHub App 설정에서 저장소 권한을 확인해 주세요."
      : githubRepositoriesStatus === "loaded" && githubRepositories.length === 0
        ? "GitHub App이 접근할 수 있는 저장소가 없습니다. GitHub App 설정에서 저장소를 공유한 뒤 목록을 새로고침하세요."
        : githubSettings
          ? "정답 제출이 확인되면 이 저장소에 풀이를 자동 기록합니다."
          : "저장소를 선택해 설정을 저장하면 다음 정답 제출부터 풀이가 자동 기록됩니다.";
  const repositoryMarkup = githubRepositories
    .map(
      (repository) =>
        `<option value="${repository.id}" ${repository.id === selectedRepositoryId ? "selected" : ""}>${escapeHtml(repository.fullName)}${repository.isPrivate ? " · 비공개" : ""}</option>`
    )
    .join("");
  const repositoryPlaceholder =
    githubRepositoriesStatus === "loading"
      ? "저장소 목록을 불러오는 중입니다."
      : githubRepositoriesStatus === "error"
        ? "저장소 목록 조회에 실패했습니다."
        : "권한이 있는 저장소가 없습니다.";
  const failedSolutionMarkup = failedSolutions.length
    ? `
      <div class="failed-solutions">
        <strong>재시도할 기록 ${failedSolutions.length}건</strong>
        ${failedSolutions
          .map(
            (record) => `
              <div class="failed-solution">
                <span>${escapeHtml(`#${record.problemId} ${record.problemName}`)} · ${escapeHtml(record.language)}</span>
                <p>${escapeHtml(record.errorMessage)}</p>
                <button type="button" class="text-button github-retry" data-submission-id="${escapeHtml(record.submissionId)}">재시도</button>
              </div>
            `
          )
          .join("")}
      </div>
    `
    : "";
  const githubMarkup = githubConnection.connected
    ? `
      <section class="settings-panel github-panel" aria-label="GitHub 풀이 기록">
        <div class="github-heading">
          <div>
            <strong>GitHub 풀이 기록</strong>
            <span>@${escapeHtml(githubConnection.accountLogin ?? "")}</span>
          </div>
          <button type="button" class="text-button github-disconnect">연결 해제</button>
        </div>
        <label class="github-field">
          <span>GitHub App 접근 저장소</span>
          <select class="github-repository" ${githubRepositories.length ? "" : "disabled"}>
            ${repositoryMarkup || `<option value="">${escapeHtml(repositoryPlaceholder)}</option>`}
          </select>
        </label>
        <div class="github-repository-target">
          <span class="github-repository-target-label">${githubSettings ? "저장된 풀이 기록 대상 주소" : "선택한 저장소 주소"}</span>
          ${selectedRepositoryUrl
            ? `<a class="github-link github-repository-link" href="${escapeHtml(selectedRepositoryUrl)}" target="_blank" rel="noreferrer">${escapeHtml(selectedRepositoryUrl)}</a>`
            : `<span class="github-note">${githubRepositoriesStatus === "loading" ? "저장소 목록을 조회하고 있습니다." : githubRepositoriesStatus === "error" ? "조회 오류로 저장소 주소를 확인하지 못했습니다." : "공유된 저장소가 없습니다."}</span>`}
          <p class="github-note github-repository-notice">${escapeHtml(repositoryGuidance)}</p>
        </div>
        <button type="button" class="text-button github-refresh">저장소 목록 새로고침</button>
        <label class="github-field">
          <span>브랜치</span>
          <input class="github-branch" value="${escapeHtml(githubSettings?.branch ?? selectedRepository?.defaultBranch ?? "main")}" maxlength="255" />
        </label>
        <label class="github-field">
          <span>기록 경로</span>
          <input class="github-base-path" value="${escapeHtml(githubSettings?.basePath ?? "")}" placeholder="저장소 루트 기준, 선택 입력" maxlength="500" />
        </label>
        <button type="button" class="secondary-button github-save" ${githubRepositories.length ? "" : "disabled"}>저장소 설정 저장</button>
        ${latestSolutionMarkup}
        <p class="github-note">GitHub 연결을 해제하면 이 서비스의 실패 기록도 삭제됩니다. App 권한은 GitHub 설정에서 취소할 수 있습니다.</p>
        ${githubStatusMessage ? `<p class="github-feedback" role="status">${escapeHtml(githubStatusMessage)}</p>` : ""}
        ${failedSolutionMarkup}
      </section>
    `
    : `
      <section class="settings-panel github-panel" aria-label="GitHub 풀이 기록">
        <div class="github-heading">
          <div>
            <strong>GitHub 풀이 기록</strong>
            <span>연결 후 정답 제출을 자동으로 기록합니다.</span>
          </div>
        </div>
        <button type="button" class="secondary-button github-connect">GitHub 저장소 연결</button>
        ${githubStatusMessage ? `<p class="github-feedback" role="status">${escapeHtml(githubStatusMessage)}</p>` : ""}
      </section>
    `;

  root.innerHTML = `
    <section class="shell">
      <header class="header">
        <div class="header-top">
          <div class="brand-line">
            <div class="eyebrow">PROGRAMMERS BADGE</div>
            <span class="version-chip">v${escapeHtml(extensionVersion)}</span>
          </div>
          <span class="status-chip" data-tone="${viewModel.statusTone}">${escapeHtml(viewModel.statusLabel)}</span>
        </div>
        <h1>${escapeHtml(viewModel.title)}</h1>
        <p class="description">${escapeHtml(viewModel.description)}</p>
      </header>
      <button type="button" class="primary-button" ${viewModel.actionDisabled ? "disabled" : ""}>${escapeHtml(viewModel.actionLabel)}</button>
      <section class="settings-panel" aria-label="동기화 설정">
        <label class="auto-sync-setting">
          <span class="auto-sync-copy">
            <strong>자동 동기화</strong>
            <span>문제를 푼 뒤 배지를 자동으로 갱신합니다.</span>
          </span>
          <input
            type="checkbox"
            class="auto-sync-toggle"
            ${currentSettings.autoSyncEnabled ? "checked" : ""}
          />
        </label>
        ${lastSyncMarkup}
      </section>
      ${githubMarkup}
      ${summaryMarkup}
      ${copyMarkup}
    </section>
  `;

  root.querySelector<HTMLButtonElement>(".primary-button")?.addEventListener("click", () => {
    void runSync();
  });

  root.querySelector<HTMLButtonElement>(".github-connect")?.addEventListener("click", () => {
    githubStatusMessage = "GitHub App 설치 화면을 열었습니다. 권한 승인 후 popup으로 돌아오세요.";
    render();
    void sendMessage({ type: "connect-github" }).catch((error) => {
      githubStatusMessage = error instanceof Error ? error.message : "GitHub 연결을 시작하지 못했습니다.";
      render();
    });
  });

  root.querySelector<HTMLSelectElement>(".github-repository")?.addEventListener("change", (event) => {
    const repositoryId = Number((event.currentTarget as HTMLSelectElement).value);
    const repository = githubRepositories.find(({ id }) => id === repositoryId);
    const branchElement = root.querySelector<HTMLInputElement>(".github-branch");
    const repositoryLink = root.querySelector<HTMLAnchorElement>(".github-repository-link");
    const repositoryLabel = root.querySelector<HTMLSpanElement>(".github-repository-target-label");
    const repositoryNotice = root.querySelector<HTMLParagraphElement>(".github-repository-notice");
    if (repository && branchElement) {
      branchElement.value = repository.defaultBranch;
    }
    if (repository && repositoryLink) {
      const repositoryUrl = getGitHubRepositoryUrl(repository);
      repositoryLink.href = repositoryUrl;
      repositoryLink.textContent = repositoryUrl;
    }
    if (repositoryLabel) {
      repositoryLabel.textContent = "선택한 저장소 주소";
    }
    if (repositoryNotice) {
      repositoryNotice.textContent = "저장소 설정을 저장하면 다음 정답 제출부터 풀이가 자동 기록됩니다.";
    }
  });

  root.querySelectorAll<HTMLInputElement>(".github-branch, .github-base-path").forEach((inputElement) => {
    inputElement.addEventListener("input", () => {
      const repositoryLabel = root.querySelector<HTMLSpanElement>(".github-repository-target-label");
      const repositoryNotice = root.querySelector<HTMLParagraphElement>(".github-repository-notice");
      if (repositoryLabel) {
        repositoryLabel.textContent = "선택한 저장소 주소";
      }
      if (repositoryNotice) {
        repositoryNotice.textContent = "저장소 설정을 저장하면 다음 정답 제출부터 풀이가 자동 기록됩니다.";
      }
    });
  });

  root.querySelector<HTMLButtonElement>(".github-refresh")?.addEventListener("click", () => {
    githubRepositoriesStatus = "loading";
    githubStatusMessage = "GitHub App 접근 저장소를 새로 조회하고 있습니다.";
    render();
    void refreshGitHubData().then(render);
  });

  root.querySelector<HTMLButtonElement>(".github-save")?.addEventListener("click", () => {
    const repositoryId = Number(root.querySelector<HTMLSelectElement>(".github-repository")?.value);
    const branch = root.querySelector<HTMLInputElement>(".github-branch")?.value.trim() ?? "";
    const basePath = root.querySelector<HTMLInputElement>(".github-base-path")?.value.trim() ?? "";
    if (!Number.isInteger(repositoryId) || !branch) {
      githubStatusMessage = "저장소와 브랜치를 입력해 주세요.";
      render();
      return;
    }

    githubStatusMessage = "저장소 설정을 확인하고 있습니다.";
    render();
    void sendMessage<GitHubConnectionResponse>({
      type: "save-github-settings",
      settings: { repositoryId, branch, basePath },
    })
      .then((nextConnection) => {
        githubConnection = nextConnection;
        githubStatusMessage = "저장소 설정을 저장했습니다.";
        render();
      })
      .catch((error) => {
        githubStatusMessage = error instanceof Error ? error.message : "저장소 설정을 저장하지 못했습니다.";
        render();
      });
  });

  root.querySelector<HTMLButtonElement>(".github-disconnect")?.addEventListener("click", () => {
    void sendMessage<GitHubConnectionResponse>({ type: "disconnect-github" })
      .then((nextConnection) => {
        githubConnection = nextConnection;
        githubRepositories = [];
        githubRepositoriesStatus = "idle";
        failedSolutions = [];
        githubStatusMessage = "이 서비스의 연결과 실패 기록을 삭제했습니다.";
        render();
      })
      .catch((error) => {
        githubStatusMessage = error instanceof Error ? error.message : "GitHub 연결을 해제하지 못했습니다.";
        render();
      });
  });

  root.querySelectorAll<HTMLButtonElement>(".github-retry").forEach((buttonElement) => {
    buttonElement.addEventListener("click", () => {
      const submissionId = buttonElement.dataset.submissionId;
      if (!submissionId) {
        return;
      }
      void sendMessage<SolutionRecordResult>({ type: "retry-github-solution", submissionId })
        .then(async (result) => {
          await refreshGitHubData();
          currentState = { ...currentState, solutionRecord: result };
          githubStatusMessage = result.message;
          render();
        })
        .catch((error) => {
          githubStatusMessage = error instanceof Error ? error.message : "풀이 기록을 재시도하지 못했습니다.";
          render();
        });
    });
  });

  root.querySelector<HTMLInputElement>(".auto-sync-toggle")?.addEventListener("change", (event) => {
    const enabled = (event.currentTarget as HTMLInputElement).checked;
    currentSettings = { autoSyncEnabled: enabled };
    render();
    void sendMessage<ExtensionSettings>({ type: "set-auto-sync-enabled", enabled }).catch(() => {
      currentSettings = { autoSyncEnabled: !enabled };
      render();
    });
  });

  root.querySelectorAll<HTMLButtonElement>("[data-copy-key]").forEach((buttonElement) => {
    buttonElement.addEventListener("click", () => {
      const copyItem = selectedCopyItems.find((item) => item.key === buttonElement.dataset.copyKey);
      void copyToClipboard(copyItem?.value);
    });
  });

  root.querySelectorAll<HTMLButtonElement>("[data-preview-variant]").forEach((buttonElement) => {
    buttonElement.addEventListener("click", () => {
      const nextPreviewVariant = buttonElement.dataset.previewVariant;

      if (nextPreviewVariant !== "standard" && nextPreviewVariant !== "mini") {
        return;
      }

      selectedPreviewVariant = nextPreviewVariant;
      render();
    });
  });
};

const runSync = async (): Promise<void> => {
  currentState = {
    ...currentState,
    status: "syncing",
    message: "Programmers 데이터를 수집하고 있습니다.",
  };
  render();

  try {
    currentState = await sendMessage<ExtensionSyncState>({ type: "start-sync" });
    selectedPreviewVariant = "standard";
  } catch (error) {
    currentState = {
      status: "error",
      message: error instanceof Error ? error.message : "Extension sync를 실행하지 못했습니다.",
      lastSync: currentState.lastSync,
    };
  }

  render();
};

const initialize = async (): Promise<void> => {
  const initialData = await loadPopupInitialData({
    initialSyncState: currentState,
    initialSettings: currentSettings,
    initialGitHubConnection: githubConnection,
    getSyncState: () => sendMessage<ExtensionSyncState>({ type: "get-sync-state" }),
    getSettings: () => sendMessage<ExtensionSettings>({ type: "get-extension-settings" }),
    getGitHubConnection: () => sendMessage<GitHubConnectionResponse>({ type: "get-github-connection" }),
  });
  currentState = initialData.syncState;
  currentSettings = initialData.settings;
  githubConnection = initialData.githubConnection;
  githubStatusMessage = initialData.githubStatusMessage;
  if (githubConnection.connected) {
    await refreshGitHubData();
  }

  render();
};

void initialize();
