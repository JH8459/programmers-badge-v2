import {
  createIdleSyncState,
  DEFAULT_EXTENSION_SETTINGS,
  type ExtensionMessage,
  type ExtensionSettings,
  type ExtensionSyncState,
} from "../shared/sync-state.js";
import { getPopupViewModel } from "./view-model.js";
import type { BadgePreviewVariant } from "./view-model.js";

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

      resolve(response);
    });
  });

let currentState = createIdleSyncState();
let currentSettings: ExtensionSettings = DEFAULT_EXTENSION_SETTINGS;
let selectedPreviewVariant: BadgePreviewVariant = "standard";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const copyToClipboard = async (text: string | undefined): Promise<void> => {
  if (!text) {
    return;
  }

  await navigator.clipboard.writeText(text);
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
      ${summaryMarkup}
      ${copyMarkup}
    </section>
  `;

  root.querySelector<HTMLButtonElement>(".primary-button")?.addEventListener("click", () => {
    void runSync();
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
  try {
    const [state, settings] = await Promise.all([
      sendMessage<ExtensionSyncState>({ type: "get-sync-state" }),
      sendMessage<ExtensionSettings>({ type: "get-extension-settings" }),
    ]);
    currentState = state;
    currentSettings = settings;
  } catch {
    currentState = createIdleSyncState();
    currentSettings = DEFAULT_EXTENSION_SETTINGS;
  }

  render();
};

void initialize();
