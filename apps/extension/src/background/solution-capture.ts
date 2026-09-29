import { z } from "zod";

import { parseProgrammersSolutionCapture } from "../shared/programmers-solution.js";
import type { ProgrammersSolutionCapture } from "../shared/programmers-solution.js";

interface CaptureProgrammersSolutionInput {
  tabId: number;
  resultSummary: string;
}

const injectionResultSchema = z.array(z.object({ result: z.unknown().optional() }).passthrough());

export const captureProgrammersSolution = async ({
  tabId,
  resultSummary,
}: CaptureProgrammersSolutionInput): Promise<ProgrammersSolutionCapture> => {
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    world: "MAIN",
    args: [resultSummary],
    func: (acceptedSummary: string): unknown => {
      const normalizeText = (value: string): string => value.replace(/\s+/g, " ").trim();
      const visibleText = (element: Element): string =>
        element instanceof HTMLElement ? element.innerText : element.textContent ?? "";
      const getSectionText = (pattern: RegExp): string => {
        const headingElements = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6"));
        const heading = headingElements.find((element) => pattern.test(normalizeText(visibleText(element))));
        if (!heading) {
          return "";
        }

        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT
        );
        const lines: string[] = [];
        let hasReachedHeading = false;
        let currentNode = walker.nextNode();
        while (currentNode) {
          if (currentNode === heading) {
            hasReachedHeading = true;
            currentNode = walker.nextNode();
            continue;
          }
          if (!hasReachedHeading) {
            currentNode = walker.nextNode();
            continue;
          }

          if (currentNode instanceof HTMLElement) {
            if (/^H[1-6]$/.test(currentNode.tagName)) {
              break;
            }
            if (heading.contains(currentNode)) {
              currentNode = walker.nextNode();
              continue;
            }

            if (["P", "DIV", "UL", "OL", "LI", "TR", "BR"].includes(currentNode.tagName)) {
              lines.push("\n");
            }
            if (currentNode.tagName === "LI") {
              lines.push("- ");
            }
            if (["TD", "TH"].includes(currentNode.tagName)) {
              lines.push(" | ");
            }
          } else if (heading.contains(currentNode)) {
            currentNode = walker.nextNode();
            continue;
          }
          if (currentNode instanceof Text) {
            const text = currentNode.textContent ?? "";
            if (text.trim()) {
              lines.push(text);
            }
          }
          currentNode = walker.nextNode();
        }
        return lines.join("").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
      };
      const getSelectedLanguageText = (): string => {
        const selectedElements = Array.from(
          document.querySelectorAll("select, [aria-selected='true'], [aria-pressed='true'], .active, .selected")
        );
        const selectedTexts = selectedElements.map((element) => {
          if (element instanceof HTMLSelectElement) {
            return element.selectedOptions.item(0)?.textContent ?? element.value;
          }
          return [visibleText(element), element.getAttribute("data-language"), element.getAttribute("value")]
            .filter((value): value is string => value !== null)
            .join(" ");
        });
        const languageChoice = selectedTexts.find((value) => /c\+\+|c#|java|javascript|python|kotlin|mysql|oracle|ruby|scala|swift|rust|\bgo\b|\bc\b/i.test(value));
        return languageChoice ?? "";
      };
      const parseLanguage = (value: string): string | null => {
        const normalized = value.toLowerCase().replace(/[\s.]/g, "");
        if (normalized.includes("c++") || normalized === "cpp") return "cpp";
        if (normalized.includes("c#") || normalized === "csharp") return "csharp";
        if (normalized.includes("javascript") || normalized === "js") return "javascript";
        if (normalized.includes("python3") || normalized.includes("python 3")) return "python3";
        if (normalized.includes("python2") || normalized.includes("python 2")) return "python2";
        if (normalized === "python") return "python3";
        if (normalized.includes("mysql")) return "mysql";
        if (normalized.includes("oracle")) return "oracle";
        if (normalized.includes("kotlin")) return "kotlin";
        if (normalized.includes("java")) return "java";
        if (normalized.includes("swift")) return "swift";
        if (normalized.includes("scala")) return "scala";
        if (normalized.includes("ruby")) return "ruby";
        if (normalized.includes("rust")) return "rust";
        if (normalized.includes("golang") || normalized === "go") return "go";
        if (normalized.includes("php")) return "php";
        if (normalized === "c" || normalized.startsWith("c언어")) return "c";
        return null;
      };
      const getEditorSource = (): string => {
        const fillEditor = document.querySelector(
          ".code-section .code-editor[id^='input_code_editor_']:not([hidden]) .rouge-code pre"
        );
        if (fillEditor) {
          const walker = document.createTreeWalker(
            fillEditor,
            NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT
          );
          const parts: string[] = [];
          let node = walker.nextNode();
          while (node) {
            if (node instanceof HTMLInputElement) {
              parts.push(node.value);
            } else if (node instanceof Text) {
              parts.push(node.textContent ?? "");
            }
            node = walker.nextNode();
          }
          const source = parts.join("");
          if (source.trim()) {
            return source;
          }
        }

        const pageWindow = window as typeof window & {
          monaco?: { editor?: { getModels?: () => Array<{ getValue?: () => string }> } };
          ace?: { edit?: (element: Element) => { getValue?: () => string } };
        };
        const models = pageWindow.monaco?.editor?.getModels?.() ?? [];
        const modelSource = models.map((model) => model.getValue?.() ?? "").find((value) => value.trim());
        if (modelSource) {
          return modelSource;
        }

        const aceEditor = document.querySelector(".ace_editor");
        const aceSource = aceEditor ? pageWindow.ace?.edit?.(aceEditor).getValue?.() : undefined;
        if (aceSource?.trim()) {
          return aceSource;
        }

        const codeMirror = document.querySelector(".CodeMirror") as (Element & {
          CodeMirror?: { getValue?: () => string };
        }) | null;
        const codeMirrorSource = codeMirror?.CodeMirror?.getValue?.();
        if (codeMirrorSource?.trim()) {
          return codeMirrorSource;
        }

        const lineSelectors = [
          ".monaco-editor .view-lines .view-line",
          ".ace_editor .ace_line",
          ".CodeMirror-code .CodeMirror-line",
          ".cm-content .cm-line",
        ];
        for (const selector of lineSelectors) {
          const lines = Array.from(document.querySelectorAll(selector));
          if (lines.length) {
            return lines.map((line) => line.textContent ?? "").join("\n");
          }
        }

        const codeTextArea = document.querySelector(
          "textarea[name='code'], textarea#code, textarea[aria-label*='code' i]"
        );
        if (codeTextArea instanceof HTMLTextAreaElement) {
          return codeTextArea.value;
        }
        return "";
      };

      const pageText = document.body.innerText;
      const pageTitle = document.title.match(/코딩테스트\s*연습\s*[-–]\s*(.+?)(?:\s*[|｜]\s*프로그래머스.*)?$/)?.[1];
      const title = normalizeText(pageTitle ?? document.querySelector("main h1, h1")?.textContent ?? "");
      const challengeLevel = document
        .querySelector(".lesson-content[data-challenge-level]")
        ?.getAttribute("data-challenge-level");
      const level = challengeLevel && /^\d+$/.test(challengeLevel)
        ? challengeLevel
        : pageText.match(/(?:Lv\.?|난이도)\s*(\d+)/i)?.[1] ?? "unknown";
      const urlLanguage = new URLSearchParams(window.location.search).get("language") ?? "";
      const language = parseLanguage(urlLanguage) ?? parseLanguage(getSelectedLanguageText());
      const code = getEditorSource();
      const performanceLines = pageText
        .split("\n")
        .map(normalizeText)
        .filter((line) => /실행\s*시간|메모리\s*(?:사용량)?|성능\s*요약/i.test(line));

      return {
        problemId: window.location.pathname.match(/\/lessons\/(\d+)/)?.[1] ?? "",
        problemName: title,
        difficulty: level === "unknown" ? level : `Lv. ${level}`,
        problemUrl: window.location.href.split("?")[0],
        language,
        sourceCode: code,
        resultSummary: normalizeText(acceptedSummary).slice(0, 200),
        performanceSummary: performanceLines.length ? performanceLines.join("; ").slice(0, 500) : null,
        description: getSectionText(/^문제\s*설명$/i).slice(0, 20_000),
        constraints: getSectionText(/^제한사항$/i).slice(0, 20_000),
        examplesMarkdown: getSectionText(/^입출력\s*예(?:시)?$/i).slice(0, 20_000),
      };
    },
  });

  const parsedResults = injectionResultSchema.parse(results);
  const rawCapture = parsedResults[0]?.result;
  if (rawCapture === undefined) {
    throw new Error("프로그래머스 풀이 정보를 읽지 못했습니다. 문제 페이지를 새로고침해 주세요.");
  }
  try {
    return parseProgrammersSolutionCapture(rawCapture);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstIssue = error.issues[0];
      if (firstIssue?.path.includes("language")) {
        throw new Error("제출 언어를 확인하지 못했거나 지원하지 않는 언어입니다.");
      }
      if (firstIssue?.path.includes("sourceCode")) {
        throw new Error("풀이 코드를 편집기에서 읽지 못했습니다.");
      }
      throw new Error("문제 정보 형식을 확인하지 못했습니다.");
    }
    throw error;
  }
};
