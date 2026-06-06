import type { NestExpressApplication } from "@nestjs/platform-express";

import type { ApiRuntimeConfig } from "./common/runtime-config";
import { isAllowedCorsOrigin } from "./cors";
import { setupSwaggerDocumentation } from "./swagger.setup";

interface SetupApiHttpApplicationProps {
  readonly app: NestExpressApplication;
  readonly runtimeConfig: ApiRuntimeConfig;
}

export const setupApiHttpApplication = ({
  app,
  runtimeConfig,
}: SetupApiHttpApplicationProps): void => {
  app.useStaticAssets(runtimeConfig.badgeOutputDirectory, {
    prefix: `${runtimeConfig.publicBadgePathPrefix}/`,
    etag: true,
    lastModified: true,
    maxAge: "5m",
    setHeaders(response, filePath) {
      if (filePath.endsWith(".svg")) {
        response.setHeader("Content-Type", "image/svg+xml");
      }

      response.setHeader("Cache-Control", "public, no-cache, must-revalidate");
    },
  });
  app.setGlobalPrefix("api");

  if (runtimeConfig.swaggerEnabled && runtimeConfig.swaggerAuth !== null) {
    setupSwaggerDocumentation({ app, auth: runtimeConfig.swaggerAuth });
  }

  app.enableCors({
    origin(origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) {
      if (origin === undefined || isAllowedCorsOrigin({ origin, runtimeConfig })) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS.`), false);
    },
  });
};
