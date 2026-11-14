import type { Client } from "openapi-fetch";
import type { paths } from "../generated/schema";
import type { PathParams, QueryParams } from "./types";
import { unwrap } from "./unwrap";

/** Fassade für den Tag Agents. */
export function createAgentsFacade(api: Client<paths>) {
  return {
    getMyAgent: () => unwrap(api.GET("/my/agent")),
    getAgents: (query?: QueryParams<"/agents", "get">) =>
      unwrap(api.GET("/agents", { params: { query } })),
    getAgent: (path: PathParams<"/agents/{agentSymbol}", "get">) =>
      unwrap(api.GET("/agents/{agentSymbol}", { params: { path } })),
  };
}
