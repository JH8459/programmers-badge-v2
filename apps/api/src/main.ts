import "reflect-metadata";

import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";

import { setupApiHttpApplication } from "./api-http.setup";
import { AppModule } from "./app.module";
import { readApiRuntimeConfig } from "./common/runtime-config";

const bootstrap = async (): Promise<void> => {
  const runtimeConfig = readApiRuntimeConfig();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  setupApiHttpApplication({ app, runtimeConfig });
  await app.listen(runtimeConfig.port);
};

void bootstrap();
