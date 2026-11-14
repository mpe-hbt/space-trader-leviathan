import type { Client } from "openapi-fetch";
import type { paths } from "../generated/schema";
import type { PathParams, QueryParams } from "./types";
import { unwrap } from "./unwrap";

/** Fassade für den Tag Factions. */
export function createFactionsFacade(api: Client<paths>) {
  return {
    getFactions: (query?: QueryParams<"/factions", "get">) =>
      unwrap(api.GET("/factions", { params: { query } })),
    getFaction: (path: PathParams<"/factions/{factionSymbol}", "get">) =>
      unwrap(api.GET("/factions/{factionSymbol}", { params: { path } })),
  };
}
