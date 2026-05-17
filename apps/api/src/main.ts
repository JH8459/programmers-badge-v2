import "reflect-metadata";

import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";

import { AppModule } from "./app.module";
import { readApiRuntimeConfig } from "./common/runtime-config";
import { isAllowedCorsOrigin } from "./cors";

const bootstrap = async (): Promise<void> => {
  const runtimeConfig = readApiRuntimeConfig();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

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
  app.enableCors({
    origin(origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) {
      if (isAllowedCorsOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin ?? "unknown"} is not allowed by CORS.`), false);
    },
  });

  await app.listen(runtimeConfig.port);
};

void bootstrap();
