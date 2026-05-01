import { describe, expect, it } from "vitest";

import { createContentTriggerDeduper } from "../src/content/dedupe";
import {
  createSolveAttemptFingerprint,
  containsLikelySolveSuccessText,
  getProblemIdFromUrl,
  isLikelySubmissionActionText,
  isProgrammersProblemPageUrl,
} from "../src/content/detection";
import { getAutoSyncToastViewModel } from "../src/content/toast";

describe("content auto-sync helpers", () => {
  it("recognizes Programmers lesson URLs and extracts the problem id", () => {
    const problemUrl =
      "https://school.programmers.co.kr/learn/courses/30/lessons/42586?language=javascript";

    expect(isProgrammersProblemPageUrl(problemUrl)).toBe(true);
    expect(getProblemIdFromUrl(problemUrl)).toBe("42586");
    expect(isProgrammersProblemPageUrl("https://school.programmers.co.kr/learn/courses/30")).toBe(
      false
    );
  });

  it("matches likely submit actions and solve-success messages", () => {
    expect(isLikelySubmissionActionText("코드 제출하기")).toBe(true);
    expect(isLikelySubmissionActionText("다음 문제")).toBe(false);
    expect(
      containsLikelySolveSuccessText("제출 결과 정답입니다. 모든 테스트를 통과했습니다.")
    ).toBe(true);
    expect(containsLikelySolveSuccessText("제출 결과 오답입니다.")).toBe(false);
  });

  it("dedupes the same success fingerprint during the local cooldown window", () => {
    let now = 2_000;
    const deduper = createContentTriggerDeduper({ cooldownMs: 5_000, now: () => now });
    const fingerprint = createSolveAttemptFingerprint(
      "https://school.programmers.co.kr/learn/courses/30/lessons/42586",
      123456
    );

    expect(deduper.shouldTrigger(fingerprint)).toBe(true);
    expect(deduper.shouldTrigger(fingerprint)).toBe(false);

    now += 5_001;

    expect(deduper.shouldTrigger(fingerprint)).toBe(true);
  });

  it("uses a stable fingerprint for the same solve attempt regardless of success copy", () => {
    const problemUrl = "https://school.programmers.co.kr/learn/courses/30/lessons/42586";

    expect(createSolveAttemptFingerprint(problemUrl, 5000)).toBe(
      createSolveAttemptFingerprint(problemUrl, 5000)
    );
    expect(createSolveAttemptFingerprint(problemUrl, 5000)).not.toBe(
      createSolveAttemptFingerprint(problemUrl, 6000)
    );
  });

  it("maps sync states into compact toast view models", () => {
    expect(
      getAutoSyncToastViewModel({
        status: "success",
        message: "Programmers User 데이터가 programmers-badge.jh8459.com으로 동기화되었습니다.",
        lastSync: null,
      })
    ).toEqual({
      tone: "success",
      title: "자동 동기화 완료",
      message: "Programmers User 데이터가 programmers-badge.jh8459.com으로 동기화되었습니다.",
    });

    expect(
      getAutoSyncToastViewModel({
        status: "error",
        message: "programmers-badge.jh8459.com API로 동기화하지 못했습니다.",
        lastSync: null,
      })
    ).toEqual({
      tone: "error",
      title: "자동 동기화 실패",
      message: "programmers-badge.jh8459.com API로 동기화하지 못했습니다.",
    });
  });
});
