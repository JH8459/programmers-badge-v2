const PROGRAMMERS_SCHOOL_HOST = "school.programmers.co.kr";
const PROBLEM_PATH_PATTERN = /^\/learn\/courses\/\d+\/lessons\/\d+(?:\/|$)/;
const SUBMISSION_ACTION_PATTERN = /(제출|채점)/;
const SUCCESS_TEXT_PATTERNS = [
  /정답입니다/,
  /정답이에요/,
  /맞았습니다/,
  /통과했습니다/,
  /통과하였습니다/,
  /모든 테스트를 통과/,
  /제출 결과[^.!?\n]*정답/,
  /채점 결과[^.!?\n]*정답/,
];
const FAILURE_TEXT_PATTERN = /(오답|실패|컴파일 에러|런타임 에러|시간 초과|메모리 초과)/;
const CANDIDATE_SELECTORS = [
  "[role='dialog']",
  "[aria-live='assertive']",
  "[aria-live='polite']",
  "[class*='modal']",
  "[class*='Modal']",
  "[class*='result']",
  "[class*='Result']",
  "[class*='toast']",
  "[class*='Toast']",
  "[class*='alert']",
  "[class*='Alert']",
  "[class*='submission']",
  "[class*='Submission']",
  "[class*='judge']",
  "[class*='Judge']",
].join(", ");

export interface SolveSuccessSignal {
  fingerprint: string;
  summary: string;
}

const normalizeText = (value: string | null | undefined): string =>
  value?.replace(/\s+/g, " ").trim() ?? "";

const isVisibleElement = (element: Element): boolean => {
  if (!(element instanceof HTMLElement)) {
    return true;
  }

  if (element.hidden || element.getAttribute("aria-hidden") === "true") {
    return false;
  }

  if (typeof window === "undefined" || typeof window.getComputedStyle !== "function") {
    return true;
  }

  const computedStyle = window.getComputedStyle(element);
  return computedStyle.display !== "none" && computedStyle.visibility !== "hidden";
};

const truncateSummary = (value: string): string => value.slice(0, 120);

export const getProblemIdFromUrl = (url: string): string | null => {
  try {
    const parsedUrl = new URL(url);
    const match = parsedUrl.pathname.match(/\/lessons\/(\d+)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
};

export const isProgrammersProblemPageUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    return (
      parsedUrl.hostname === PROGRAMMERS_SCHOOL_HOST &&
      PROBLEM_PATH_PATTERN.test(parsedUrl.pathname)
    );
  } catch {
    return false;
  }
};

export const isLikelySubmissionActionText = (text: string): boolean =>
  SUBMISSION_ACTION_PATTERN.test(normalizeText(text));

export const containsLikelySolveSuccessText = (text: string): boolean => {
  const normalizedText = normalizeText(text);

  if (!normalizedText || FAILURE_TEXT_PATTERN.test(normalizedText)) {
    return false;
  }

  return SUCCESS_TEXT_PATTERNS.some((pattern) => pattern.test(normalizedText));
};

export const createSolveAttemptFingerprint = (url: string, submissionAt: number): string => {
  const problemId = getProblemIdFromUrl(url) ?? "unknown";
  return `solve-success:${problemId}:${submissionAt}`;
};

const getCandidateElements = (root: Element): Element[] => {
  const candidateElements = new Set<Element>();

  const closestCandidateElement = root.closest(CANDIDATE_SELECTORS);
  if (closestCandidateElement) {
    candidateElements.add(closestCandidateElement);
  }

  if (root.matches(CANDIDATE_SELECTORS)) {
    candidateElements.add(root);
  }

  for (const element of root.querySelectorAll(CANDIDATE_SELECTORS)) {
    candidateElements.add(element);
  }

  if (candidateElements.size === 0 && normalizeText(root.textContent).length <= 160) {
    candidateElements.add(root);
  }

  return Array.from(candidateElements);
};

export const detectSolveSuccessSignal = (
  root: Element,
  currentUrl: string,
  submissionAt: number
): SolveSuccessSignal | null => {
  for (const candidateElement of getCandidateElements(root)) {
    if (!isVisibleElement(candidateElement)) {
      continue;
    }

    const candidateText = normalizeText(candidateElement.textContent);
    if (!containsLikelySolveSuccessText(candidateText)) {
      continue;
    }

    return {
      fingerprint: createSolveAttemptFingerprint(currentUrl, submissionAt),
      summary: truncateSummary(candidateText),
    };
  }

  return null;
};
