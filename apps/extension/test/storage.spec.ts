import { afterEach, describe, expect, it, vi } from "vitest";

import { getExtensionSettings, setAutoSyncEnabled } from "../src/background/storage";

const originalChrome = globalThis.chrome;

describe("extension settings storage", () => {
  afterEach(() => {
    vi.restoreAllMocks();

    if (originalChrome) {
      Object.defineProperty(globalThis, "chrome", {
        configurable: true,
        value: originalChrome,
      });
    } else {
      // @ts-expect-error 테스트용 shim 제거
      delete globalThis.chrome;
    }
  });

  it("defaults auto-sync to enabled and persists a user change", async () => {
    const values = new Map<string, unknown>();
    Object.defineProperty(globalThis, "chrome", {
      configurable: true,
      value: {
        storage: {
          local: {
            get: vi.fn(async (key: string) => ({ [key]: values.get(key) })),
            set: vi.fn(async (entries: Record<string, unknown>) => {
              for (const [key, value] of Object.entries(entries)) {
                values.set(key, value);
              }
            }),
          },
        },
      },
    });

    await expect(getExtensionSettings()).resolves.toEqual({ autoSyncEnabled: true });
    await expect(setAutoSyncEnabled({ enabled: false })).resolves.toEqual({
      autoSyncEnabled: false,
    });
    await expect(getExtensionSettings()).resolves.toEqual({ autoSyncEnabled: false });
  });

  it("falls back to defaults when persisted settings are malformed", async () => {
    Object.defineProperty(globalThis, "chrome", {
      configurable: true,
      value: {
        storage: {
          local: {
            get: vi.fn(async (key: string) => ({ [key]: { autoSyncEnabled: "false" } })),
          },
        },
      },
    });

    await expect(getExtensionSettings()).resolves.toEqual({ autoSyncEnabled: true });
  });
});
