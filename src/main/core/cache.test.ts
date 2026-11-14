import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { components } from "@leviathan/api-client";
import { openSqliteDatabase } from "../adapters/sqlite";
import { RESET_CHECK_INTERVAL_MS } from "./cache";
import { createCore } from "./index";
import { LOG_FILE } from "./logger";
import type { SqlDatabase } from "./ports";
import { fakePorts } from "./test-fakes";

type Schemas = components["schemas"];

const OLD_RESET = "2026-11-01";
const NEW_RESET = "2026-11-15";

function status(resetDate: string) {
  return {
    status: "ok",
    version: "v2.3.0",
    resetDate,
    serverResets: { next: "2026-11-29T00:00:00.000Z", frequency: "fortnightly" },
  };
}

const agent = { symbol: "LEVIATHAN", credits: 175000 } as Schemas["Agent"];
const ship = (symbol: string) => ({ symbol }) as Schemas["Ship"];
const contract = { id: "c1" } as Schemas["Contract"];
const transaction: Schemas["MarketTransaction"] = {
  waypointSymbol: "X1-A-B1",
  shipSymbol: "LEVIATHAN-1",
  tradeSymbol: "IRON_ORE",
  type: "SELL",
  units: 10,
  pricePerUnit: 20,
  totalPrice: 200,
  timestamp: "2026-11-14T09:00:00.000Z",
};

function market(sellPrice: number): Schemas["Market"] {
  return {
    symbol: "X1-A-B1",
    exports: [],
    imports: [],
    exchange: [],
    transactions: [transaction],
    tradeGoods: [
      {
        symbol: "IRON_ORE",
        type: "IMPORT",
        tradeVolume: 60,
        supply: "SCARCE",
        activity: "WEAK",
        purchasePrice: sellPrice * 2,
        sellPrice,
      },
    ],
  } as Schemas["Market"];
}

const waypoint = (n: number) => ({ symbol: `X1-A-W${n}`, systemSymbol: "X1-A" });

let tempDirs: string[] = [];

afterEach(() => {
  vi.useRealTimers();
  for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true });
  tempDirs = [];
});

function fileDatabase(): { open: () => SqlDatabase } {
  const dir = mkdtempSync(join(tmpdir(), "leviathan-"));
  tempDirs.push(dir);
  const path = join(dir, "leviathan.db");
  return { open: () => openSqliteDatabase(path) };
}

/** A started core whose first reset check has finished. */
async function startedCore(resetDate: string | null = OLD_RESET, database?: SqlDatabase) {
  const ports = fakePorts(database);
  if (resetDate) ports.fetch.respond("/", status(resetDate));
  let time = Date.parse("2026-11-14T10:00:00.000Z");
  const clock = () => new Date((time += 1000));
  const core = createCore(ports, { clock });
  await core.start();
  await core.cache.checkReset();
  ports.events.events.length = 0;
  return { ports, core };
}

describe("CacheService", () => {
  it("shows the stored Spielstand after a restart without any request", async () => {
    const db = fileDatabase();
    const first = await startedCore(OLD_RESET, db.open());
    first.core.cache.recordAgent(agent);
    first.core.cache.recordShips([ship("LEVIATHAN-1")]);
    await first.core.shutdown();

    // The fetch port has no answers: every request fails like a missing network.
    const ports = fakePorts(db.open());
    const second = createCore(ports);
    await second.start();
    const state = second.cache.getGameState();
    expect(state).toEqual({
      resetDate: OLD_RESET,
      nextReset: "2026-11-29T00:00:00.000Z",
      agent,
      ships: [ship("LEVIATHAN-1")],
      contracts: [],
    });
    await second.cache.checkReset();
    expect(second.cache.isOpen()).toBe(true);
    await second.logger.flush();
    expect(ports.files.files.get(LOG_FILE)).toContain("Reset-Prüfung fehlgeschlagen");
    await second.shutdown();
  });

  it("archives the old Spielstand on a new reset and starts a separate one", async () => {
    const { ports, core } = await startedCore();
    core.cache.recordShips([ship("LEVIATHAN-1")]);
    ports.events.events.length = 0;

    await core.cache.checkReset();
    expect(ports.events.events).toEqual([]);

    ports.fetch.respond("/", status(NEW_RESET));
    await core.cache.checkReset();

    const resets = ports.database.all<{ reset_date: string; archived_at: string | null }>(
      "SELECT reset_date, archived_at FROM resets ORDER BY reset_date",
    );
    expect(resets[0]).toMatchObject({ reset_date: OLD_RESET });
    expect(resets[0]?.archived_at).not.toBeNull();
    expect(resets[1]).toEqual({ reset_date: NEW_RESET, archived_at: null });
    expect(ports.database.all("SELECT reset_date, symbol FROM ships")).toEqual([
      { reset_date: OLD_RESET, symbol: "LEVIATHAN-1" },
    ]);
    expect(core.cache.getGameState()).toMatchObject({ resetDate: NEW_RESET, ships: [] });
    expect(ports.events.events).toEqual([
      { type: "game-state-changed", resetDate: NEW_RESET, areas: ["reset"] },
    ]);

    ports.fetch.respond("/", status(OLD_RESET));
    await core.cache.checkReset();
    expect(core.cache.getGameState().resetDate).toBe(NEW_RESET);
    await core.shutdown();
  });

  it("checks GET / every 30 minutes until shutdown and closes the database", async () => {
    vi.useFakeTimers();
    const ports = fakePorts();
    const close = vi.spyOn(ports.database, "close");
    ports.fetch.respond("/", status(OLD_RESET));
    const core = createCore(ports);
    await core.start();
    expect(ports.fetch.requests).toEqual(["/"]);

    await vi.advanceTimersByTimeAsync(RESET_CHECK_INTERVAL_MS);
    expect(ports.fetch.requests).toEqual(["/", "/"]);

    await core.shutdown();
    expect(close).toHaveBeenCalledTimes(1);
    expect(core.cache.isOpen()).toBe(false);
    await vi.advanceTimersByTimeAsync(RESET_CHECK_INTERVAL_MS * 2);
    expect(ports.fetch.requests).toEqual(["/", "/"]);
    core.cache.stop();
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("loads the waypoints of a system once per reset over all pages", async () => {
    const { ports, core } = await startedCore();
    const pages = (resetMeta: number) => {
      ports.fetch.respond("/systems/X1-A/waypoints?page=1&limit=20", {
        data: Array.from({ length: 20 }, (_, i) => waypoint(i)),
        meta: { total: resetMeta, page: 1, limit: 20 },
      });
      ports.fetch.respond("/systems/X1-A/waypoints?page=2&limit=20", {
        data: [waypoint(20)],
        meta: { total: resetMeta, page: 2, limit: 20 },
      });
    };
    pages(21);
    ports.fetch.requests.length = 0;

    expect(await core.cache.getSystemWaypoints("X1-A")).toHaveLength(21);
    expect(ports.fetch.requests).toEqual([
      "/systems/X1-A/waypoints?page=1&limit=20",
      "/systems/X1-A/waypoints?page=2&limit=20",
    ]);
    expect(ports.events.events).toEqual([
      { type: "game-state-changed", resetDate: OLD_RESET, areas: ["waypoints"] },
    ]);

    expect(await core.cache.getSystemWaypoints("X1-A")).toHaveLength(21);
    expect(ports.fetch.requests).toHaveLength(2);

    ports.fetch.respond("/systems/X1-A", { data: { symbol: "X1-A" } });
    expect(await core.cache.getSystem("X1-A")).toEqual({ symbol: "X1-A" });
    expect(await core.cache.getSystem("X1-A")).toEqual({ symbol: "X1-A" });
    expect(ports.fetch.requests).toHaveLength(3);

    ports.fetch.respond("/", status(NEW_RESET));
    await core.cache.checkReset();
    expect(await core.cache.getSystemWaypoints("X1-A")).toHaveLength(21);
    expect(ports.fetch.requests).toHaveLength(6);
    await core.shutdown();
  });

  it("stores market prices as a time series and counts transactions once", async () => {
    const { ports, core } = await startedCore();
    core.cache.recordMarket(market(40));
    core.cache.recordMarket(market(45));

    const history = core.cache.marketHistory("X1-A-B1", "IRON_ORE");
    expect(history.map((point) => point.sellPrice)).toEqual([40, 45]);
    expect(history[0]!.recordedAt < history[1]!.recordedAt).toBe(true);
    expect(history[0]).toMatchObject({ type: "IMPORT", supply: "SCARCE", activity: "WEAK" });
    expect(ports.database.get("SELECT COUNT(*) AS count FROM transactions")).toEqual({
      count: 1,
    });
    expect(ports.events.events.map((event) => "areas" in event && event.areas)).toEqual([
      ["markets", "transactions"],
      ["markets"],
    ]);
    await core.shutdown();
  });

  it("records agent, ships, shipyard, contracts and transactions with one event each", async () => {
    const { ports, core } = await startedCore();
    core.cache.recordAgent(agent);
    core.cache.recordShips([ship("LEVIATHAN-1"), ship("LEVIATHAN-2")]);
    core.cache.recordShips([ship("LEVIATHAN-2")], { replaceAll: true });
    core.cache.recordShipyard({
      symbol: "X1-A-B1",
      shipTypes: [],
      modificationsFee: 100,
      transactions: [
        {
          waypointSymbol: "X1-A-B1",
          shipSymbol: "LEVIATHAN-3",
          shipType: "SHIP_PROBE",
          price: 20000,
          agentSymbol: "LEVIATHAN",
          timestamp: "2026-11-14T09:30:00.000Z",
        },
      ],
    });
    core.cache.recordContracts([contract]);
    core.cache.recordTransactions([transaction, transaction]);

    expect(ports.events.events).toEqual(
      [
        ["agent"],
        ["ships"],
        ["ships"],
        ["shipyards", "transactions"],
        ["contracts"],
        ["transactions"],
      ].map((areas) => ({ type: "game-state-changed", resetDate: OLD_RESET, areas })),
    );
    expect(core.cache.getGameState()).toMatchObject({
      agent,
      ships: [ship("LEVIATHAN-2")],
      contracts: [contract],
    });
    expect(
      ports.database.all("SELECT reset_date, kind, item_symbol FROM transactions ORDER BY kind"),
    ).toEqual([
      { reset_date: OLD_RESET, kind: "market", item_symbol: "IRON_ORE" },
      { reset_date: OLD_RESET, kind: "shipyard", item_symbol: "SHIP_PROBE" },
    ]);
    expect(JSON.stringify(ports.events.events)).not.toContain("175000");
    await core.shutdown();
  });

  it("stores nothing and throws nothing without a known reset", async () => {
    const { ports, core } = await startedCore(null);
    expect(() => {
      core.cache.recordAgent(agent);
      core.cache.recordShips([ship("LEVIATHAN-1")]);
      core.cache.recordShipyard({ symbol: "X1-A-B1", shipTypes: [], modificationsFee: 0 });
      core.cache.recordContracts([contract]);
      core.cache.recordTransactions([transaction]);
      core.cache.recordMarket(market(40));
    }).not.toThrow();
    expect(await core.cache.getSystemWaypoints("X1-A")).toEqual([]);
    expect(ports.events.events).toEqual([]);
    expect(ports.database.get("SELECT COUNT(*) AS count FROM agents")).toEqual({ count: 0 });
    expect(core.cache.getGameState()).toEqual({
      resetDate: null,
      nextReset: null,
      agent: null,
      ships: [],
      contracts: [],
    });
    await core.logger.flush();
    expect(ports.files.files.get(LOG_FILE)).toContain("Kein Server-Reset bekannt");
    await core.shutdown();
  });

  it("starts the core even if the database cannot be opened", async () => {
    const ports = fakePorts();
    ports.database.exec = () => {
      throw new Error("kaputt");
    };
    ports.database.get = () => {
      throw new Error("kaputt");
    };
    const core = createCore(ports);
    await expect(core.start()).resolves.toBeUndefined();
    expect(core.cache.isOpen()).toBe(false);
    expect(core.cache.getGameState().resetDate).toBeNull();
    await core.shutdown();
  });

  it("discards a reset answer that arrives after shutdown", async () => {
    const ports = fakePorts();
    let answer: (response: Response) => void = () => {};
    const pending = new Promise<Response>((resolve) => (answer = resolve));
    const fetchPort = Object.assign(() => pending, ports.fetch);
    const core = createCore({ ...ports, fetch: fetchPort });
    await core.start();
    await core.shutdown();
    answer(new Response(JSON.stringify(status(NEW_RESET)), { status: 200 }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(ports.events.events.some((event) => event.type === "game-state-changed")).toBe(false);
  });
});
