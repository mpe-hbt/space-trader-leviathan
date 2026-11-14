import {
  createSpaceTradersClient,
  SPACETRADERS_API_BASE_URL,
  type SpaceTradersClient,
  type SpaceTradersClientOptions,
} from "@leviathan/api-client";
import type { RequestPriority, RequestQueue } from "./request-queue";

/**
 * Access to the SpaceTraders API. Clients are only handed out with the Request-Queue,
 * so every request keeps to the rate limit and its priority.
 */
export class SpaceTradersService {
  readonly baseUrl = SPACETRADERS_API_BASE_URL;

  constructor(private readonly queue: RequestQueue) {}

  /** Creates a client whose requests go through the Request-Queue with the given priority. */
  client(
    priority: RequestPriority,
    options: Omit<SpaceTradersClientOptions, "fetch"> = {},
  ): SpaceTradersClient {
    return createSpaceTradersClient({ ...options, fetch: this.queue.fetchFor(priority) });
  }
}
