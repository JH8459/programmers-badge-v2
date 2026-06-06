import { timingSafeEqual } from "node:crypto";
import type { IncomingHttpHeaders } from "node:http";

import type { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import type { SwaggerAuthConfig } from "./common/runtime-config";

const API_VERSION = "0.1.0";
const BASIC_AUTH_SCHEME_PREFIX = "Basic ";
const SWAGGER_AUTH_REALM = "PROGRAMMERS-BADGE-V2 API Docs";

interface SetupSwaggerDocumentationProps {
  readonly app: NestExpressApplication;
  readonly auth: SwaggerAuthConfig;
}

interface BasicAuthCredentials {
  readonly username: string;
  readonly password: string;
}

interface BasicAuthRequest {
  readonly headers: IncomingHttpHeaders;
}

interface BasicAuthResponse {
  setHeader(name: string, value: string): void;
  status(statusCode: number): BasicAuthResponse;
  send(body: string): void;
}

type BasicAuthNext = () => void;

const parseBasicAuthCredentials = (
  authorizationHeader: string | undefined
): BasicAuthCredentials | null => {
  if (authorizationHeader === undefined || !authorizationHeader.startsWith(BASIC_AUTH_SCHEME_PREFIX)) {
    return null;
  }

  const decodedCredentials = Buffer.from(
    authorizationHeader.slice(BASIC_AUTH_SCHEME_PREFIX.length),
    "base64"
  ).toString("utf8");
  const separatorIndex = decodedCredentials.indexOf(":");

  if (separatorIndex < 0) {
    return null;
  }

  return {
    username: decodedCredentials.slice(0, separatorIndex),
    password: decodedCredentials.slice(separatorIndex + 1),
  };
};

const timingSafeStringEquals = (actualValue: string, expectedValue: string): boolean => {
  const actualBuffer = Buffer.from(actualValue);
  const expectedBuffer = Buffer.from(expectedValue);

  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
};

const isAuthorizedForSwagger = ({
  credentials,
  auth,
}: {
  readonly credentials: BasicAuthCredentials | null;
  readonly auth: SwaggerAuthConfig;
}): boolean =>
  credentials !== null &&
  timingSafeStringEquals(credentials.username, auth.username) &&
  timingSafeStringEquals(credentials.password, auth.password);

const createSwaggerBasicAuthMiddleware =
  (auth: SwaggerAuthConfig) =>
  (request: BasicAuthRequest, response: BasicAuthResponse, next: BasicAuthNext): void => {
    const credentials = parseBasicAuthCredentials(request.headers.authorization);

    if (isAuthorizedForSwagger({ credentials, auth })) {
      next();
      return;
    }

    response.setHeader("WWW-Authenticate", `Basic realm="${SWAGGER_AUTH_REALM}"`);
    response.status(401).send("Swagger authentication required.");
  };

export const setupSwaggerDocumentation = ({
  app,
  auth,
}: SetupSwaggerDocumentationProps): void => {
  const config = new DocumentBuilder()
    .setTitle("PROGRAMMERS-BADGE-V2 API")
    .setDescription("Programmers badge sync and public badge delivery API.")
    .setVersion(API_VERSION)
    .build();

  const document = SwaggerModule.createDocument(app, config);

  const authMiddleware = createSwaggerBasicAuthMiddleware(auth);

  app.use(/^\/api\/docs(?:\/.*)?$/, authMiddleware);
  app.use("/api/docs-json", authMiddleware);

  SwaggerModule.setup("docs", app, document, {
    useGlobalPrefix: true,
    customSiteTitle: "PROGRAMMERS-BADGE-V2 API Docs",
    raw: ["json"],
  });
};
