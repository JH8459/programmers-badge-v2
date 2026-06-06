import type { ApiRuntimeConfig } from "./common/runtime-config";

interface IsAllowedCorsOriginInput {
  origin: string | undefined;
  runtimeConfig: Pick<ApiRuntimeConfig, "allowedWebOrigins" | "allowLocalhostOrigins">;
}

const isLocalDevelopmentOrigin = (origin: string): boolean => {
  try {
    const { hostname, port, protocol } = new URL(origin);
    const isLoopbackHostname = hostname === "localhost" || hostname === "127.0.0.1";

    return protocol === "http:" && port.length > 0 && isLoopbackHostname;
  } catch {
    return false;
  }
};

export const isAllowedCorsOrigin = ({
  origin,
  runtimeConfig,
}: IsAllowedCorsOriginInput): boolean => {
  if (!origin) {
    return true;
  }

  if (runtimeConfig.allowedWebOrigins.includes(origin)) {
    return true;
  }

  if (runtimeConfig.allowLocalhostOrigins && isLocalDevelopmentOrigin(origin)) {
    return true;
  }

  return origin.startsWith("chrome-extension://");
};
