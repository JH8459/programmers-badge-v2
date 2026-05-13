import { describe, expect, it } from "vitest";

import { LegalController } from "../src/legal/legal.controller";

describe("LegalController", () => {
  it("returns the public privacy policy page", () => {
    const controller = new LegalController();

    expect(controller.getPrivacyPolicy()).toContain("<html lang=\"ko\">");
    expect(controller.getPrivacyPolicy()).toContain("PROGRAMMERS-BADGE-V2 개인정보처리방침");
    expect(controller.getPrivacyPolicy()).toContain("Programmers 비밀번호, 세션 토큰, 쿠키");
    expect(controller.getPrivacyPolicy()).toContain("GitHub Issues");
  });
});
