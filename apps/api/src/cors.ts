const LOCALHOST_ORIGINS = new Set(["http://localhost:3000", "http://127.0.0.1:3000"]);

export const isAllowedCorsOrigin = (origin: string | undefined): boolean => {
  if (!origin) {
    return true;
  }

  if (LOCALHOST_ORIGINS.has(origin)) {
    return true;
  }

  return origin.startsWith("chrome-extension://");
};
