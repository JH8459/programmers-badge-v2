import "reflect-metadata";

import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";

import { AppModule } from "./app.module";
import { getBadgeOutputDirectory, getPublicBadgePathPrefix } from "./badge/badge-runtime";
import { isAllowedCorsOrigin } from "./cors";

const bootstrap = async (): Promise<void> => {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(getBadgeOutputDirectory(), {
    prefix: `${getPublicBadgePathPrefix()}/`,
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
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: false,
    })
  );

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
};

void bootstrap();
