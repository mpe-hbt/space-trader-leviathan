import type { Client } from "openapi-fetch";
import type { paths } from "../generated/schema";
import type { PathParams, QueryParams, RequestBody } from "./types";
import { unwrap } from "./unwrap";

type WaypointPath = PathParams<"/systems/{systemSymbol}/waypoints/{waypointSymbol}", "get">;

/** Fassade für den Tag Systems. */
export function createSystemsFacade(api: Client<paths>) {
  return {
    getSystems: (query?: QueryParams<"/systems", "get">) =>
      unwrap(api.GET("/systems", { params: { query } })),
    getSystem: (path: PathParams<"/systems/{systemSymbol}", "get">) =>
      unwrap(api.GET("/systems/{systemSymbol}", { params: { path } })),
    getSystemWaypoints: (
      path: PathParams<"/systems/{systemSymbol}/waypoints", "get">,
      query?: QueryParams<"/systems/{systemSymbol}/waypoints", "get">,
    ) => unwrap(api.GET("/systems/{systemSymbol}/waypoints", { params: { path, query } })),
    getWaypoint: (path: WaypointPath) =>
      unwrap(api.GET("/systems/{systemSymbol}/waypoints/{waypointSymbol}", { params: { path } })),
    getMarket: (path: WaypointPath) =>
      unwrap(
        api.GET("/systems/{systemSymbol}/waypoints/{waypointSymbol}/market", { params: { path } }),
      ),
    getShipyard: (path: WaypointPath) =>
      unwrap(
        api.GET("/systems/{systemSymbol}/waypoints/{waypointSymbol}/shipyard", {
          params: { path },
        }),
      ),
    getJumpGate: (path: WaypointPath) =>
      unwrap(
        api.GET("/systems/{systemSymbol}/waypoints/{waypointSymbol}/jump-gate", {
          params: { path },
        }),
      ),
    getConstruction: (path: WaypointPath) =>
      unwrap(
        api.GET("/systems/{systemSymbol}/waypoints/{waypointSymbol}/construction", {
          params: { path },
        }),
      ),
    supplyConstruction: (
      path: PathParams<
        "/systems/{systemSymbol}/waypoints/{waypointSymbol}/construction/supply",
        "post"
      >,
      body: RequestBody<
        "/systems/{systemSymbol}/waypoints/{waypointSymbol}/construction/supply",
        "post"
      >,
    ) =>
      unwrap(
        api.POST("/systems/{systemSymbol}/waypoints/{waypointSymbol}/construction/supply", {
          params: { path },
          body,
        }),
      ),
  };
}
