import type { ExtensionSyncState } from "../shared/sync-state.js";

type AutoSyncToastTone = "success" | "error";

interface AutoSyncToastViewModel {
  tone: AutoSyncToastTone;
  title: string;
  message: string;
}

export interface AutoSyncToastPresenter {
  show(state: ExtensionSyncState): void;
}

const TOAST_HOST_ID = "programmers-badge-v2-auto-sync-toast-root";
const TOAST_HIDE_DELAY_MS = 4_200;

export const getAutoSyncToastViewModel = (
  state: ExtensionSyncState
): AutoSyncToastViewModel | null => {
  switch (state.status) {
    case "success":
      return {
        tone: "success",
        title: "자동 동기화 완료",
        message: state.message,
      };
    case "not-logged-in":
      return {
        tone: "error",
        title: "Programmers 세션 확인 필요",
        message: state.message,
      };
    case "needs-programmers-page":
      return {
        tone: "error",
        title: "Programmers 페이지 확인 필요",
        message: state.message,
      };
    case "error":
      return {
        tone: "error",
        title: "자동 동기화 실패",
        message: state.message,
      };
    default:
      return null;
  }
};

const createToastStyleElement = (document: Document): HTMLStyleElement => {
  const styleElement = document.createElement("style");
  styleElement.textContent = `
    :host {
      all: initial;
      --pb-toast-font-family: "Verdana", sans-serif;
      --pb-toast-width: min(320px, calc(100vw - 24px));
      --pb-toast-space-1: 6px;
      --pb-toast-space-2: 8px;
      --pb-toast-space-3: 12px;
      --pb-toast-space-4: 14px;
      --pb-toast-radius: 14px;
      --pb-toast-text-primary: #0f172a;
      --pb-toast-text-secondary: #334155;
      --pb-toast-border: rgba(148, 163, 184, 0.28);
      --pb-toast-shadow: 0 14px 32px rgba(15, 23, 42, 0.18);
      --pb-toast-success-accent: #2563eb;
      --pb-toast-success-ring: rgba(37, 99, 235, 0.12);
      --pb-toast-success-border: rgba(37, 99, 235, 0.24);
      --pb-toast-success-background:
        radial-gradient(circle at top left, rgba(59, 130, 246, 0.16), transparent 42%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%);
      --pb-toast-error-accent: #dc2626;
      --pb-toast-error-ring: rgba(220, 38, 38, 0.12);
      --pb-toast-error-border: rgba(239, 68, 68, 0.24);
      --pb-toast-error-background:
        radial-gradient(circle at top left, rgba(248, 113, 113, 0.16), transparent 42%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(254, 242, 242, 0.98) 100%);
    }

    .toast-stack {
      font-family: var(--pb-toast-font-family);
      width: var(--pb-toast-width);
      pointer-events: none;
    }

    .toast {
      display: grid;
      gap: var(--pb-toast-space-1);
      box-sizing: border-box;
      border: 1px solid var(--pb-toast-border);
      border-radius: var(--pb-toast-radius);
      padding: var(--pb-toast-space-3) var(--pb-toast-space-4);
      background: var(--pb-toast-success-background);
      color: var(--pb-toast-text-primary);
      box-shadow: var(--pb-toast-shadow);
      backdrop-filter: blur(10px);
    }

    .toast[data-tone='success'] {
      border-color: var(--pb-toast-success-border);
    }

    .toast[data-tone='error'] {
      border-color: var(--pb-toast-error-border);
      background: var(--pb-toast-error-background);
    }

    .toast-header {
      display: flex;
      align-items: center;
      gap: var(--pb-toast-space-2);
      min-width: 0;
    }

    .toast-indicator {
      width: 9px;
      height: 9px;
      border-radius: 999px;
      flex-shrink: 0;
      background: var(--pb-toast-success-accent);
      box-shadow: 0 0 0 4px var(--pb-toast-success-ring);
    }

    .toast[data-tone='error'] .toast-indicator {
      background: var(--pb-toast-error-accent);
      box-shadow: 0 0 0 4px var(--pb-toast-error-ring);
    }

    .toast-title {
      font-size: 13px;
      font-weight: 700;
      line-height: 1.3;
      letter-spacing: 0.01em;
    }

    .toast-message {
      margin: 0;
      font-size: 12px;
      line-height: 1.45;
      color: var(--pb-toast-text-secondary);
      word-break: keep-all;
    }
  `;
  return styleElement;
};

const createToastElements = (document: Document) => {
  const toastStackElement = document.createElement("div");
  toastStackElement.className = "toast-stack";

  const toastElement = document.createElement("section");
  toastElement.className = "toast";
  toastElement.setAttribute("role", "status");
  toastElement.setAttribute("aria-live", "polite");

  const toastHeaderElement = document.createElement("div");
  toastHeaderElement.className = "toast-header";

  const toastIndicatorElement = document.createElement("span");
  toastIndicatorElement.className = "toast-indicator";
  toastIndicatorElement.setAttribute("aria-hidden", "true");

  const toastTitleElement = document.createElement("strong");
  toastTitleElement.className = "toast-title";

  toastHeaderElement.append(toastIndicatorElement, toastTitleElement);

  const toastMessageElement = document.createElement("p");
  toastMessageElement.className = "toast-message";

  toastElement.append(toastHeaderElement, toastMessageElement);
  toastStackElement.append(toastElement);

  return {
    toastStackElement,
    toastElement,
    toastTitleElement,
    toastMessageElement,
  };
};

export const createAutoSyncToastPresenter = (
  documentRef: Document = document
): AutoSyncToastPresenter => {
  let hostElement: HTMLDivElement | null = null;
  let toastElements: ReturnType<typeof createToastElements> | null = null;
  let hideTimer: number | null = null;

  const ensureToastElements = () => {
    if (hostElement && toastElements) {
      return { hostElement, toastElements };
    }

    const existingHostElement = documentRef.getElementById(TOAST_HOST_ID) as HTMLDivElement | null;
    hostElement = existingHostElement ?? documentRef.createElement("div");

    if (!existingHostElement) {
      hostElement.id = TOAST_HOST_ID;
      hostElement.style.position = "fixed";
      hostElement.style.top = "16px";
      hostElement.style.right = "16px";
      hostElement.style.zIndex = "2147483647";
      hostElement.style.pointerEvents = "none";
      documentRef.documentElement.append(hostElement);
    }

    const shadowRoot = hostElement.shadowRoot ?? hostElement.attachShadow({ mode: "open" });

    if (!toastElements) {
      shadowRoot.replaceChildren();
      shadowRoot.append(createToastStyleElement(documentRef));

      toastElements = createToastElements(documentRef);
      shadowRoot.append(toastElements.toastStackElement);
    }

    return { hostElement, toastElements };
  };

  return {
    show(state) {
      const viewModel = getAutoSyncToastViewModel(state);
      if (!viewModel) {
        return;
      }

      const { toastElements: ensuredToastElements } = ensureToastElements();

      ensuredToastElements.toastElement.dataset.tone = viewModel.tone;
      ensuredToastElements.toastTitleElement.textContent = viewModel.title;
      ensuredToastElements.toastMessageElement.textContent = viewModel.message;
      ensuredToastElements.toastStackElement.hidden = false;

      if (hideTimer !== null) {
        window.clearTimeout(hideTimer);
      }

      hideTimer = window.setTimeout(() => {
        ensuredToastElements.toastStackElement.hidden = true;
      }, TOAST_HIDE_DELAY_MS);
    },
  };
};
