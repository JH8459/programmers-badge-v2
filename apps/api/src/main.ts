import "reflect-metadata";

import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";

import { setupApiHttpApplication } from "./api-http.setup";
import { AppModule } from "./app.module";
import { readApiRuntimeConfig } from "./common/runtime-config";

const bootstrap = async (): Promise<void> => {
  const runtimeConfig = readApiRuntimeConfig();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
  app.useBodyParser("json", { limit: "2mb" });

  // Production traffic reaches the API through the single Synology reverse-proxy hop.
  app.set("trust proxy", 1);
  setupApiHttpApplication({ app, runtimeConfig });
  await app.listen(runtimeConfig.port);
};

void bootstrap();
