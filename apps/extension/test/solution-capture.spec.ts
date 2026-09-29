import { afterEach, describe, expect, it, vi } from "vitest";

import { captureProgrammersSolution } from "../src/background/solution-capture";

const stubProblemPage = ({
  languageQuery,
  selectedLanguage,
  fillCodeParts,
  challengeLevel,
  pageText = "Lv. 0",
}: {
  languageQuery: string;
  selectedLanguage?: string;
  fillCodeParts?: Array<{ text: string } | { input: string }>;
  challengeLevel?: string;
  pageText?: string;
}) => {
  const url = new URL(
    `https://school.programmers.co.kr/learn/courses/30/lessons/120880${languageQuery}`
  );
  class FakeHTMLElement {
    constructor(readonly innerText: string) {}

    getAttribute(): null {
      return null;
    }
  }
  class FakeHTMLSelectElement extends FakeHTMLElement {}
  class FakeHTMLInputElement extends FakeHTMLElement {
    constructor(readonly value: string) {
      super("");
    }
  }
  class FakeText {
    constructor(readonly textContent: string) {}
  }
  const selectedElement = selectedLanguage ? new FakeHTMLElement(selectedLanguage) : null;
  const levelElement = challengeLevel === undefined ? null : {
    getAttribute: (name: string) => name === "data-challenge-level" ? challengeLevel : null,
  };
  const fillEditor = fillCodeParts ? new FakeHTMLElement("") : null;
  const fillNodes = fillCodeParts?.map((part) =>
    "input" in part ? new FakeHTMLInputElement(part.input) : new FakeText(part.text)
  );
  let fillNodeIndex = 0;

  vi.stubGlobal("HTMLElement", FakeHTMLElement);
  vi.stubGlobal("HTMLSelectElement", FakeHTMLSelectElement);
  vi.stubGlobal("HTMLInputElement", FakeHTMLInputElement);
  vi.stubGlobal("Text", FakeText);
  vi.stubGlobal("NodeFilter", { SHOW_ELEMENT: 1, SHOW_TEXT: 4 });
  vi.stubGlobal("window", {
    location: url,
    monaco: {
      editor: {
        getModels: () => fillEditor ? [] : [{ getValue: () => "int solution(void) { return 1; }" }],
      },
    },
  });
  vi.stubGlobal("document", {
    title: "코딩테스트 연습 - 특이한 정렬 | 프로그래머스 스쿨",
    body: { innerText: pageText },
    querySelectorAll: (selector: string) =>
      selector.startsWith("select,") && selectedElement ? [selectedElement] : [],
    querySelector: (selector: string) =>
      selector.includes("input_code_editor_")
        ? fillEditor
        : selector.includes("data-challenge-level") ? levelElement : null,
    createTreeWalker: () => ({ nextNode: () => fillNodes?.[fillNodeIndex++] ?? null }),
  });
  vi.stubGlobal("chrome", {
    scripting: {
      executeScript: vi.fn(
        async ({ func, args }: { func: (resultSummary: string) => unknown; args: [string] }) => [
          { result: func(args[0]) },
        ]
      ),
    },
  });
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("captureProgrammersSolution language", () => {
  it.each([
    ["?language=c", "c"],
    ["?language=cpp", "cpp"],
  ])(
    "reads %s from the problem URL without a selected DOM element",
    async (languageQuery, expected) => {
      stubProblemPage({ languageQuery });

      await expect(
        captureProgrammersSolution({ tabId: 1, resultSummary: "정답" })
      ).resolves.toMatchObject({
        language: expected,
        sourceCode: "int solution(void) { return 1; }",
      });
    }
  );

  it("uses the selected language when the URL has no language parameter", async () => {
    stubProblemPage({ languageQuery: "", selectedLanguage: "C" });

    await expect(
      captureProgrammersSolution({ tabId: 1, resultSummary: "정답" })
    ).resolves.toMatchObject({
      language: "c",
    });
  });

  it("reads a fill-in-the-blank solution with the entered code in order", async () => {
    stubProblemPage({
      languageQuery: "?language=java",
      fillCodeParts: [
        { text: "class Solution { int north = 0; north" },
        { input: "--" },
        { text: "; return north; }" },
      ],
    });

    await expect(
      captureProgrammersSolution({ tabId: 1, resultSummary: "정답" })
    ).resolves.toMatchObject({
      language: "java",
      sourceCode: "class Solution { int north = 0; north--; return north; }",
    });
  });

  it("reads level zero from the lesson metadata when no level is visible", async () => {
    stubProblemPage({
      languageQuery: "?language=java",
      challengeLevel: "0",
      pageText: "문제 설명",
    });

    await expect(
      captureProgrammersSolution({ tabId: 1, resultSummary: "정답" })
    ).resolves.toMatchObject({ difficulty: "Lv. 0" });
  });
});
