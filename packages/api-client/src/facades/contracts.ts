import type { Client } from "openapi-fetch";
import type { paths } from "../generated/schema";
import type { PathParams, QueryParams, RequestBody } from "./types";
import { unwrap } from "./unwrap";

type ContractPath = PathParams<"/my/contracts/{contractId}", "get">;

/** Fassade für den Tag Contracts. */
export function createContractsFacade(api: Client<paths>) {
  return {
    getContracts: (query?: QueryParams<"/my/contracts", "get">) =>
      unwrap(api.GET("/my/contracts", { params: { query } })),
    getContract: (path: ContractPath) =>
      unwrap(api.GET("/my/contracts/{contractId}", { params: { path } })),
    acceptContract: (path: PathParams<"/my/contracts/{contractId}/accept", "post">) =>
      unwrap(api.POST("/my/contracts/{contractId}/accept", { params: { path } })),
    deliverContract: (
      path: PathParams<"/my/contracts/{contractId}/deliver", "post">,
      body: RequestBody<"/my/contracts/{contractId}/deliver", "post">,
    ) => unwrap(api.POST("/my/contracts/{contractId}/deliver", { params: { path }, body })),
    fulfillContract: (path: PathParams<"/my/contracts/{contractId}/fulfill", "post">) =>
      unwrap(api.POST("/my/contracts/{contractId}/fulfill", { params: { path } })),
  };
}
