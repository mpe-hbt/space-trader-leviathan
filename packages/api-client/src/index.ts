export const SPACETRADERS_API_BASE_URL = "https://api.spacetraders.io/v2";

/** Version der gepinnten Spezifikation unter `spec/SpaceTraders.json`. */
export const SPACETRADERS_SPEC_VERSION = "2.3.0";

export { createSpaceTradersClient } from "./client";
export type { SpaceTradersClient, SpaceTradersClientOptions } from "./client";
export { SpaceTradersError, toSpaceTradersError } from "./errors";
export type { components, operations, paths } from "./generated/schema";
