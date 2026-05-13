import { Controller, Get, Header } from "@nestjs/common";

import { PRIVACY_POLICY_HTML } from "./privacy-policy-page";

@Controller()
export class LegalController {
  @Get("privacy")
  @Header("Content-Type", "text/html; charset=utf-8")
  @Header("Cache-Control", "public, max-age=300")
  getPrivacyPolicy(): string {
    return PRIVACY_POLICY_HTML;
  }
}
