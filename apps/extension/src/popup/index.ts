import {
  createIdleSyncState,
  type ExtensionMessage,
  type ExtensionSyncState,
} from "../shared/sync-state.js";
import { getPopupViewModel, type BadgePreviewVariant } from "./view-model.js";

const root = document.querySelector<HTMLDivElement>("#app");

if (!root) {
  throw new Error("Popup root element was not found.");
}

const sendMessage = async (message: ExtensionMessage): Promise<ExtensionSyncState> =>
  new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response: ExtensionSyncState) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve(response);
    });
  });

let currentState = createIdleSyncState();
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
          ${viewModel.summarySubtitle ? `<p class="summary-subtitle">${escapeHtml(viewModel.summarySubtitle)}</p>` : ""}
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
      ${summaryMarkup}
      ${copyMarkup}
    </section>
  `;

  root.querySelector<HTMLButtonElement>(".primary-button")?.addEventListener("click", () => {
    void runSync();
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
    currentState = await sendMessage({ type: "start-sync" });
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
    currentState = await sendMessage({ type: "get-sync-state" });
  } catch {
    currentState = createIdleSyncState();
  }

  render();
};

void initialize();
