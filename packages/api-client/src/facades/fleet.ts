import type { Client } from "openapi-fetch";
import type { paths } from "../generated/schema";
import type { PathParams, QueryParams, RequestBody } from "./types";
import { unwrap } from "./unwrap";

type ShipPath = PathParams<"/my/ships/{shipSymbol}", "get">;

/** Fassade für den Tag Fleet. */
export function createFleetFacade(api: Client<paths>) {
  return {
    getMyShips: (query?: QueryParams<"/my/ships", "get">) =>
      unwrap(api.GET("/my/ships", { params: { query } })),
    purchaseShip: (body: RequestBody<"/my/ships", "post">) =>
      unwrap(api.POST("/my/ships", { body })),
    getMyShip: (path: ShipPath) => unwrap(api.GET("/my/ships/{shipSymbol}", { params: { path } })),
    getMyShipCargo: (path: ShipPath) =>
      unwrap(api.GET("/my/ships/{shipSymbol}/cargo", { params: { path } })),
    orbitShip: (path: ShipPath) =>
      unwrap(api.POST("/my/ships/{shipSymbol}/orbit", { params: { path } })),
    shipRefine: (path: ShipPath, body: RequestBody<"/my/ships/{shipSymbol}/refine", "post">) =>
      unwrap(api.POST("/my/ships/{shipSymbol}/refine", { params: { path }, body })),
    createChart: (path: ShipPath) =>
      unwrap(api.POST("/my/ships/{shipSymbol}/chart", { params: { path } })),
    getShipCooldown: (path: ShipPath) =>
      unwrap(api.GET("/my/ships/{shipSymbol}/cooldown", { params: { path } })),
    dockShip: (path: ShipPath) =>
      unwrap(api.POST("/my/ships/{shipSymbol}/dock", { params: { path } })),
    createSurvey: (path: ShipPath) =>
      unwrap(api.POST("/my/ships/{shipSymbol}/survey", { params: { path } })),
    extractResources: (
      path: ShipPath,
      body: RequestBody<"/my/ships/{shipSymbol}/extract", "post">,
    ) => unwrap(api.POST("/my/ships/{shipSymbol}/extract", { params: { path }, body })),
    siphonResources: (path: ShipPath) =>
      unwrap(api.POST("/my/ships/{shipSymbol}/siphon", { params: { path } })),
    extractResourcesWithSurvey: (
      path: ShipPath,
      body: RequestBody<"/my/ships/{shipSymbol}/extract/survey", "post">,
    ) => unwrap(api.POST("/my/ships/{shipSymbol}/extract/survey", { params: { path }, body })),
    jettison: (path: ShipPath, body: RequestBody<"/my/ships/{shipSymbol}/jettison", "post">) =>
      unwrap(api.POST("/my/ships/{shipSymbol}/jettison", { params: { path }, body })),
    jumpShip: (path: ShipPath, body: RequestBody<"/my/ships/{shipSymbol}/jump", "post">) =>
      unwrap(api.POST("/my/ships/{shipSymbol}/jump", { params: { path }, body })),
    navigateShip: (path: ShipPath, body: RequestBody<"/my/ships/{shipSymbol}/navigate", "post">) =>
      unwrap(api.POST("/my/ships/{shipSymbol}/navigate", { params: { path }, body })),
    patchShipNav: (path: ShipPath, body: RequestBody<"/my/ships/{shipSymbol}/nav", "patch">) =>
      unwrap(api.PATCH("/my/ships/{shipSymbol}/nav", { params: { path }, body })),
    getShipNav: (path: ShipPath) =>
      unwrap(api.GET("/my/ships/{shipSymbol}/nav", { params: { path } })),
    warpShip: (path: ShipPath, body: RequestBody<"/my/ships/{shipSymbol}/warp", "post">) =>
      unwrap(api.POST("/my/ships/{shipSymbol}/warp", { params: { path }, body })),
    sellCargo: (path: ShipPath, body: RequestBody<"/my/ships/{shipSymbol}/sell", "post">) =>
      unwrap(api.POST("/my/ships/{shipSymbol}/sell", { params: { path }, body })),
    createShipSystemScan: (path: ShipPath) =>
      unwrap(api.POST("/my/ships/{shipSymbol}/scan/systems", { params: { path } })),
    createShipWaypointScan: (path: ShipPath) =>
      unwrap(api.POST("/my/ships/{shipSymbol}/scan/waypoints", { params: { path } })),
    createShipShipScan: (path: ShipPath) =>
      unwrap(api.POST("/my/ships/{shipSymbol}/scan/ships", { params: { path } })),
    refuelShip: (path: ShipPath, body: RequestBody<"/my/ships/{shipSymbol}/refuel", "post">) =>
      unwrap(api.POST("/my/ships/{shipSymbol}/refuel", { params: { path }, body })),
    purchaseCargo: (path: ShipPath, body: RequestBody<"/my/ships/{shipSymbol}/purchase", "post">) =>
      unwrap(api.POST("/my/ships/{shipSymbol}/purchase", { params: { path }, body })),
    transferCargo: (path: ShipPath, body: RequestBody<"/my/ships/{shipSymbol}/transfer", "post">) =>
      unwrap(api.POST("/my/ships/{shipSymbol}/transfer", { params: { path }, body })),
    negotiateContract: (path: ShipPath) =>
      unwrap(api.POST("/my/ships/{shipSymbol}/negotiate/contract", { params: { path } })),
    getMounts: (path: ShipPath) =>
      unwrap(api.GET("/my/ships/{shipSymbol}/mounts", { params: { path } })),
    installMount: (
      path: ShipPath,
      body: RequestBody<"/my/ships/{shipSymbol}/mounts/install", "post">,
    ) => unwrap(api.POST("/my/ships/{shipSymbol}/mounts/install", { params: { path }, body })),
    removeMount: (
      path: ShipPath,
      body: RequestBody<"/my/ships/{shipSymbol}/mounts/remove", "post">,
    ) => unwrap(api.POST("/my/ships/{shipSymbol}/mounts/remove", { params: { path }, body })),
    getScrapShip: (path: ShipPath) =>
      unwrap(api.GET("/my/ships/{shipSymbol}/scrap", { params: { path } })),
    scrapShip: (path: ShipPath) =>
      unwrap(api.POST("/my/ships/{shipSymbol}/scrap", { params: { path } })),
    getRepairShip: (path: ShipPath) =>
      unwrap(api.GET("/my/ships/{shipSymbol}/repair", { params: { path } })),
    repairShip: (path: ShipPath) =>
      unwrap(api.POST("/my/ships/{shipSymbol}/repair", { params: { path } })),
    getShipModules: (path: ShipPath) =>
      unwrap(api.GET("/my/ships/{shipSymbol}/modules", { params: { path } })),
    installShipModule: (
      path: ShipPath,
      body: RequestBody<"/my/ships/{shipSymbol}/modules/install", "post">,
    ) => unwrap(api.POST("/my/ships/{shipSymbol}/modules/install", { params: { path }, body })),
    removeShipModule: (
      path: ShipPath,
      body: RequestBody<"/my/ships/{shipSymbol}/modules/remove", "post">,
    ) => unwrap(api.POST("/my/ships/{shipSymbol}/modules/remove", { params: { path }, body })),
  };
}
