import { SPACETRADERS_API_BASE_URL, createSpaceTradersClient } from "@leviathan/api-client";
import type { FetchFunction } from "./ports";

/**
 * Access to the SpaceTraders API. Every request goes through the `fetch` port,
 * where the Request-Queue hooks in later (#6).
 */
export class SpaceTradersService {
  readonly baseUrl = SPACETRADERS_API_BASE_URL;
  readonly client;

  constructor(fetch: FetchFunction) {
    // Always pass the port; without it openapi-fetch would use globalThis.fetch.
    this.client = createSpaceTradersClient({ fetch });
  }
}
