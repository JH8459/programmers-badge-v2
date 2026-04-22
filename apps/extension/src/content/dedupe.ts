interface ContentTriggerDeduperOptions {
  cooldownMs?: number;
  now?: () => number;
}

export interface ContentTriggerDeduper {
  shouldTrigger(fingerprint: string): boolean;
}

const DEFAULT_COOLDOWN_MS = 20_000;

export const createContentTriggerDeduper = (
  options: ContentTriggerDeduperOptions = {}
): ContentTriggerDeduper => {
  const cooldownMs = options.cooldownMs ?? DEFAULT_COOLDOWN_MS;
  const now = options.now ?? (() => Date.now());
  const lastTriggeredAtByFingerprint = new Map<string, number>();

  return {
    shouldTrigger(fingerprint) {
      const currentTime = now();
      const lastTriggeredAt = lastTriggeredAtByFingerprint.get(fingerprint);

      if (typeof lastTriggeredAt === "number" && currentTime - lastTriggeredAt < cooldownMs) {
        return false;
      }

      lastTriggeredAtByFingerprint.set(fingerprint, currentTime);
      return true;
    },
  };
};
