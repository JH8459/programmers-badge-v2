const ALLOWED_WEB_ORIGINS = new Set([
  "https://programmers-badge.jh8459.com",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5020",
  "http://127.0.0.1:5020",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

export const isAllowedCorsOrigin = (origin: string | undefined): boolean => {
  if (!origin) {
    return true;
  }

  if (ALLOWED_WEB_ORIGINS.has(origin)) {
    return true;
  }

  return origin.startsWith("chrome-extension://");
};
