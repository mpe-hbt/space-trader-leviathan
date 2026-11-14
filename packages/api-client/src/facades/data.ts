import type { Client } from "openapi-fetch";
import type { paths } from "../generated/schema";
import { unwrap } from "./unwrap";

/** Fassade für den Tag Data. */
export function createDataFacade(api: Client<paths>) {
  return {
    getSupplyChain: () => unwrap(api.GET("/market/supply-chain")),
  };
}
