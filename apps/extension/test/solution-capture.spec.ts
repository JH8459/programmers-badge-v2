import { afterEach, describe, expect, it, vi } from "vitest";

import { captureProgrammersSolution } from "../src/background/solution-capture";

const stubProblemPage = ({
  languageQuery,
  selectedLanguage,
}: {
  languageQuery: string;
  selectedLanguage?: string;
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
  const selectedElement = selectedLanguage ? new FakeHTMLElement(selectedLanguage) : null;

  vi.stubGlobal("HTMLElement", FakeHTMLElement);
  vi.stubGlobal("HTMLSelectElement", FakeHTMLSelectElement);
  vi.stubGlobal("window", {
    location: url,
    monaco: {
      editor: { getModels: () => [{ getValue: () => "int solution(void) { return 1; }" }] },
    },
  });
  vi.stubGlobal("document", {
    title: "코딩테스트 연습 - 특이한 정렬 | 프로그래머스 스쿨",
    body: { innerText: "Lv. 0" },
    querySelectorAll: (selector: string) =>
      selector.startsWith("select,") && selectedElement ? [selectedElement] : [],
    querySelector: () => null,
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
});
