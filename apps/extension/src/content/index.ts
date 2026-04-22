import type { ExtensionMessage, ExtensionSyncState } from "../shared/sync-state.js";
import { createContentTriggerDeduper } from "./dedupe.js";
import {
  detectSolveSuccessSignal,
  isLikelySubmissionActionText,
  isProgrammersProblemPageUrl,
} from "./detection.js";
import { createAutoSyncToastPresenter } from "./toast.js";

const SUBMISSION_SIGNAL_WINDOW_MS = 45_000;
const SCAN_DEBOUNCE_MS = 250;

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

const toastPresenter = createAutoSyncToastPresenter();
const triggerDeduper = createContentTriggerDeduper();
const pendingScanRoots = new Set<Element>();

let scanTimer: number | null = null;
let lastSubmissionAt = 0;
let isTriggerInFlight = false;
let lastObservedHref = window.location.href;

const markSubmissionAttempt = (): void => {
  lastSubmissionAt = Date.now();
};

const getControlText = (element: Element | null): string => {
  if (!element) {
    return "";
  }

  const htmlElement = element as HTMLElement;
  const textContent = [
    htmlElement.innerText,
    htmlElement.textContent,
    htmlElement.getAttribute("aria-label"),
    htmlElement.getAttribute("title"),
    element instanceof HTMLInputElement ? element.value : "",
  ]
    .filter(Boolean)
    .join(" ");

  return textContent;
};

const enqueueRootsForScan = (elements: Iterable<Element>): void => {
  for (const element of elements) {
    pendingScanRoots.add(element);
  }

  if (scanTimer !== null) {
    return;
  }

  scanTimer = window.setTimeout(() => {
    scanTimer = null;
    void scanPendingRoots();
  }, SCAN_DEBOUNCE_MS);
};

const collectMutationRoots = (records: MutationRecord[]): Element[] => {
  const elements = new Set<Element>();

  for (const record of records) {
    if (record.target instanceof Element) {
      elements.add(record.target);
    }

    for (const node of record.addedNodes) {
      if (node instanceof Element) {
        elements.add(node);
        continue;
      }

      if (node.parentElement) {
        elements.add(node.parentElement);
      }
    }
  }

  return Array.from(elements);
};

const triggerAutoSync = async (fingerprint: string): Promise<void> => {
  if (isTriggerInFlight) {
    return;
  }

  isTriggerInFlight = true;

  try {
    const nextState = await sendMessage({
      type: "trigger-auto-sync",
      fingerprint,
    });

    toastPresenter.show(nextState);
  } catch (error) {
    toastPresenter.show({
      status: "error",
      message: error instanceof Error ? error.message : "자동 동기화를 실행하지 못했습니다.",
      lastSync: null,
    });
  } finally {
    isTriggerInFlight = false;
  }
};

const scanPendingRoots = async (): Promise<void> => {
  if (!isProgrammersProblemPageUrl(window.location.href)) {
    pendingScanRoots.clear();
    return;
  }

  if (Date.now() - lastSubmissionAt > SUBMISSION_SIGNAL_WINDOW_MS) {
    pendingScanRoots.clear();
    return;
  }

  const roots = Array.from(pendingScanRoots);
  pendingScanRoots.clear();

  for (const root of roots) {
    const signal = detectSolveSuccessSignal(root, window.location.href, lastSubmissionAt);

    if (!signal || !triggerDeduper.shouldTrigger(signal.fingerprint)) {
      continue;
    }

    await triggerAutoSync(signal.fingerprint);
    lastSubmissionAt = 0;
    return;
  }
};

document.addEventListener(
  "click",
  (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const control = target?.closest(
      "button, [role='button'], input[type='submit'], input[type='button']"
    );

    if (isLikelySubmissionActionText(getControlText(control ?? null))) {
      markSubmissionAttempt();
    }
  },
  { capture: true, passive: true }
);

document.addEventListener(
  "submit",
  () => {
    markSubmissionAttempt();
  },
  { capture: true, passive: true }
);

const mutationObserver = new MutationObserver((records) => {
  if (window.location.href !== lastObservedHref) {
    lastObservedHref = window.location.href;
    pendingScanRoots.clear();
    lastSubmissionAt = 0;
  }

  enqueueRootsForScan(collectMutationRoots(records));
});

mutationObserver.observe(document.documentElement, {
  childList: true,
  subtree: true,
  characterData: true,
});
