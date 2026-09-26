import {
  HttpException,
  HttpStatus,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from "@nestjs/common";

interface SyncHttpRequest {
  readonly ip?: string;
  readonly socket?: {
    readonly remoteAddress?: string;
  };
}

interface SyncHttpResponse {
  setHeader(name: string, value: string): unknown;
}

interface CreateSyncRateLimiterOptions {
  maxRequests?: number;
  maxEntries?: number;
  windowMs?: number;
}

interface ConsumeSyncRateLimitInput {
  clientKey: string;
  currentTime: number;
}

export interface SyncRateLimiter {
  consume(input: ConsumeSyncRateLimitInput): number | null;
}

export const createSyncRateLimiter = (
  options: CreateSyncRateLimiterOptions = {}
): SyncRateLimiter => {
  const maxRequests = Math.max(1, options.maxRequests ?? 30);
  const maxEntries = Math.max(1, options.maxEntries ?? 10_000);
  const windowMs = Math.max(1, options.windowMs ?? 60_000);
  const requestsByClient = new Map<string, number[]>();

  return {
    consume({ clientKey, currentTime }) {
      const activeRequests = (requestsByClient.get(clientKey) ?? []).filter(
        (requestTime) => currentTime - requestTime < windowMs
      );

      if (activeRequests.length >= maxRequests) {
        requestsByClient.set(clientKey, activeRequests);
        // maxRequests is at least one, so this branch always has a first timestamp.
        const oldestRequestTime = activeRequests[0] as number;
        return Math.max(1, Math.ceil((oldestRequestTime + windowMs - currentTime) / 1000));
      }

      activeRequests.push(currentTime);
      requestsByClient.set(clientKey, activeRequests);

      while (requestsByClient.size > maxEntries) {
        // A map larger than maxEntries must have at least one key.
        requestsByClient.delete(requestsByClient.keys().next().value as string);
      }

      return null;
    },
  };
};

@Injectable()
export class SyncRateLimitGuard implements CanActivate {
  private readonly rateLimiter = createSyncRateLimiter();

  canActivate(context: ExecutionContext): boolean {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<SyncHttpRequest>();
    const response = httpContext.getResponse<SyncHttpResponse>();
    const clientKey = request.ip || request.socket?.remoteAddress || "unknown";
    const retryAfterSeconds = this.rateLimiter.consume({
      clientKey,
      currentTime: Date.now(),
    });

    if (retryAfterSeconds !== null) {
      response.setHeader("Retry-After", String(retryAfterSeconds));
      throw new HttpException(
        "Sync request limit exceeded. Please retry later.",
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    return true;
  }
}
