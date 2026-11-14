import type { Client } from "openapi-fetch";
import type { paths } from "../generated/schema";
import type { RequestBody } from "./types";
import { unwrap } from "./unwrap";

/** Fassade für den Tag Global. */
export function createGlobalFacade(api: Client<paths>) {
  return {
    getStatus: () => unwrap(api.GET("/")),
    register: (body: RequestBody<"/register", "post">) => unwrap(api.POST("/register", { body })),
  };
}
