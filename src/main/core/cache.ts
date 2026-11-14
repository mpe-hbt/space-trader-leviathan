import type { components } from "@leviathan/api-client";
import type { GameStateArea, GameStateSnapshot } from "@leviathan/shared";
import { migrate } from "./cache-schema";
import type { Logger } from "./logger";
import type { EventSink, SqlDatabase, SqlValue } from "./ports";
import type { RequestPriority } from "./request-queue";
import type { SpaceTradersService } from "./spacetraders";

type Schemas = components["schemas"];
type Agent = Schemas["Agent"];
type Contract = Schemas["Contract"];
type Market = Schemas["Market"];
type MarketTransaction = Schemas["MarketTransaction"];
type Ship = Schemas["Ship"];
type Shipyard = Schemas["Shipyard"];
type System = Schemas["System"];
type Waypoint = Schemas["Waypoint"];

/** GET / is checked on start and then every 30 minutes (ADR-04). */
export const RESET_CHECK_INTERVAL_MS = 30 * 60 * 1000;

/** Page size for loading the waypoints of a system. */
export const WAYPOINT_PAGE_LIMIT = 20;

/** Vorrangstufe der Reset-Prüfung in der Request-Queue: läuft im Hintergrund. */
export const RESET_CHECK_PRIORITY: RequestPriority = "background";

/** Vorrangstufe für das Laden von Systemen und Wegpunkten bei Bedarf. */
export const LOAD_PRIORITY: RequestPriority = "routine";

const SCOPE = "cache";

/** One point of the price history of a trade good at a market. */
export interface MarketPricePoint {
  recordedAt: string;
  type: string;
  supply: string;
  activity: string | null;
  tradeVolume: number;
  purchasePrice: number;
  sellPrice: number;
}

export interface CacheDependencies {
  database: SqlDatabase;
  spaceTraders: SpaceTradersService;
  events: EventSink;
  logger: Logger;
  clock?: () => Date;
}

interface TransactionRow {
  kind: "market" | "shipyard";
  waypointSymbol: string;
  shipSymbol: string;
  itemSymbol: string;
  type: string;
  units: number;
  pricePerUnit: number;
  totalPrice: number;
  timestamp: string;
  data: unknown;
}

function emptyGameState(): GameStateSnapshot {
  return { resetDate: null, nextReset: null, agent: null, ships: [], contracts: [] };
}

function parse<T>(rows: { data: string }[]): T[] {
  return rows.map((row) => JSON.parse(row.data) as T);
}

/**
 * Local Spielstand in SQLite (ADR-04). Every row belongs to one Server-Reset; a new
 * reset archives the previous Spielstand and starts a separate one.
 */
export class CacheService {
  private open = false;
  private started = false;
  private resetDate: string | null = null;
  private timer: ReturnType<typeof setInterval> | undefined;
  /** Increased by stop(); answers that arrive afterwards are discarded. */
  private generation = 0;
  private readonly clock: () => Date;

  constructor(private readonly deps: CacheDependencies) {
    this.clock = deps.clock ?? (() => new Date());
  }

  isOpen(): boolean {
    return this.open;
  }

  /** Opens and migrates the database and reads the current reset; needs no network. */
  start(): void {
    if (this.started) return;
    this.started = true;
    try {
      migrate(this.deps.database);
      const current = this.deps.database.get<{ reset_date: string }>(
        "SELECT reset_date FROM resets WHERE archived_at IS NULL",
      );
      this.resetDate = current?.reset_date ?? null;
      this.open = true;
    } catch (error) {
      this.deps.logger.error(SCOPE, "Spielstand nicht lesbar", error);
      this.open = false;
      return;
    }
    this.timer = setInterval(() => void this.checkReset(), RESET_CHECK_INTERVAL_MS);
    this.timer.unref?.();
  }

  stop(): void {
    if (!this.started) return;
    this.started = false;
    this.generation += 1;
    clearInterval(this.timer);
    this.timer = undefined;
    this.open = false;
    try {
      this.deps.database.close();
    } catch (error) {
      this.deps.logger.error(SCOPE, "Datenbank nicht sauber geschlossen", error);
    }
  }

  /** Compares the reset date from GET / with the current one; never throws. */
  async checkReset(): Promise<void> {
    if (!this.open) return;
    const generation = this.generation;
    let status;
    try {
      status = await this.deps.spaceTraders.client(RESET_CHECK_PRIORITY).global.getStatus();
    } catch (error) {
      if (generation === this.generation) {
        this.deps.logger.warn(SCOPE, "Reset-Prüfung fehlgeschlagen", error);
      }
      return;
    }
    if (generation !== this.generation || !this.open) return;

    const { resetDate, serverResets } = status;
    const db = this.deps.database;
    try {
      if (resetDate === this.resetDate) {
        db.run("UPDATE resets SET next_reset = ?, frequency = ? WHERE reset_date = ?", [
          serverResets.next,
          serverResets.frequency,
          resetDate,
        ]);
        return;
      }
      if (db.get("SELECT reset_date FROM resets WHERE reset_date = ?", [resetDate])) {
        this.deps.logger.warn(SCOPE, "Archivierter Server-Reset gemeldet, ignoriert", {
          resetDate,
        });
        return;
      }
      const now = this.now();
      db.transaction(() => {
        db.run("UPDATE resets SET archived_at = ? WHERE archived_at IS NULL", [now]);
        db.run(
          "INSERT INTO resets (reset_date, first_seen_at, next_reset, frequency) VALUES (?, ?, ?, ?)",
          [resetDate, now, serverResets.next, serverResets.frequency],
        );
      });
      const previous = this.resetDate;
      this.resetDate = resetDate;
      this.deps.logger.info(SCOPE, "Server-Reset erkannt", { previous, resetDate });
      this.emit(resetDate, ["reset"]);
    } catch (error) {
      this.deps.logger.error(SCOPE, "Spielstand nicht schreibbar", error);
    }
  }

  /** The Spielstand of the current reset; empty without a known reset. */
  getGameState(): GameStateSnapshot {
    const resetDate = this.resetDate;
    if (!this.open || resetDate === null) return emptyGameState();
    const db = this.deps.database;
    try {
      const reset = db.get<{ next_reset: string | null }>(
        "SELECT next_reset FROM resets WHERE reset_date = ?",
        [resetDate],
      );
      const agent = db.get<{ data: string }>(
        "SELECT data FROM agents WHERE reset_date = ? ORDER BY updated_at DESC LIMIT 1",
        [resetDate],
      );
      return {
        resetDate,
        nextReset: reset?.next_reset ?? null,
        agent: agent ? (JSON.parse(agent.data) as Agent) : null,
        ships: parse<Ship>(
          db.all("SELECT data FROM ships WHERE reset_date = ? ORDER BY symbol", [resetDate]),
        ),
        contracts: parse<Contract>(
          db.all("SELECT data FROM contracts WHERE reset_date = ? ORDER BY id", [resetDate]),
        ),
      };
    } catch (error) {
      this.deps.logger.error(SCOPE, "Spielstand nicht lesbar", error);
      return emptyGameState();
    }
  }

  /**
   * A system from the Spielstand; loaded once per reset from the API.
   * API errors are passed on to the caller.
   */
  async getSystem(systemSymbol: string): Promise<System | undefined> {
    const resetDate = this.readableReset();
    if (resetDate === null) return undefined;
    const row = this.deps.database.get<{ data: string }>(
      "SELECT data FROM systems WHERE reset_date = ? AND symbol = ?",
      [resetDate, systemSymbol],
    );
    if (row) return JSON.parse(row.data) as System;

    const generation = this.generation;
    const { data: system } = await this.deps.spaceTraders.client(LOAD_PRIORITY).systems.getSystem({
      systemSymbol,
    });
    if (!this.isCurrent(generation, resetDate)) return system;
    this.write(() => {
      this.deps.database.run(
        "INSERT OR REPLACE INTO systems (reset_date, symbol, data, updated_at) VALUES (?, ?, ?, ?)",
        [resetDate, system.symbol, JSON.stringify(system), this.now()],
      );
      return ["systems"];
    });
    return system;
  }

  /**
   * All waypoints of a system from the Spielstand; loaded once per reset over all
   * pages from the API. API errors are passed on to the caller.
   */
  async getSystemWaypoints(systemSymbol: string): Promise<Waypoint[]> {
    const resetDate = this.readableReset();
    if (resetDate === null) return [];
    const db = this.deps.database;
    const loaded = db.get(
      "SELECT loaded_at FROM system_waypoints_loaded WHERE reset_date = ? AND system_symbol = ?",
      [resetDate, systemSymbol],
    );
    if (loaded) {
      return parse<Waypoint>(
        db.all(
          "SELECT data FROM waypoints WHERE reset_date = ? AND system_symbol = ? ORDER BY symbol",
          [resetDate, systemSymbol],
        ),
      );
    }

    const generation = this.generation;
    const waypoints: Waypoint[] = [];
    for (let page = 1; ; page += 1) {
      const response = await this.deps.spaceTraders
        .client(LOAD_PRIORITY)
        .systems.getSystemWaypoints({ systemSymbol }, { page, limit: WAYPOINT_PAGE_LIMIT });
      waypoints.push(...response.data);
      if (response.data.length === 0 || waypoints.length >= response.meta.total) break;
    }
    if (!this.isCurrent(generation, resetDate)) return waypoints;
    this.write(() => {
      const now = this.now();
      for (const waypoint of waypoints) {
        db.run(
          "INSERT OR REPLACE INTO waypoints (reset_date, symbol, system_symbol, data, updated_at) VALUES (?, ?, ?, ?, ?)",
          [resetDate, waypoint.symbol, systemSymbol, JSON.stringify(waypoint), now],
        );
      }
      db.run(
        "INSERT OR REPLACE INTO system_waypoints_loaded (reset_date, system_symbol, loaded_at) VALUES (?, ?, ?)",
        [resetDate, systemSymbol, now],
      );
      return ["waypoints"];
    });
    return waypoints;
  }

  /** Stores the latest state of a market, its prices as time series and its transactions. */
  recordMarket(market: Market): void {
    this.write((resetDate, now) => {
      const db = this.deps.database;
      db.run(
        "INSERT OR REPLACE INTO markets (reset_date, waypoint_symbol, data, updated_at) VALUES (?, ?, ?, ?)",
        [resetDate, market.symbol, JSON.stringify(market), now],
      );
      for (const good of market.tradeGoods ?? []) {
        db.run(
          `INSERT OR REPLACE INTO market_prices (reset_date, waypoint_symbol, trade_symbol, recorded_at,
             type, supply, activity, trade_volume, purchase_price, sell_price)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            resetDate,
            market.symbol,
            good.symbol,
            now,
            good.type,
            good.supply,
            good.activity ?? null,
            good.tradeVolume,
            good.purchasePrice,
            good.sellPrice,
          ],
        );
      }
      const added = this.insertTransactions(
        resetDate,
        (market.transactions ?? []).map(fromMarketTransaction),
      );
      return added > 0 ? ["markets", "transactions"] : ["markets"];
    });
  }

  /** Price history of a trade good at a market in the current reset, oldest first. */
  marketHistory(waypointSymbol: string, tradeSymbol: string): MarketPricePoint[] {
    const resetDate = this.resetDate;
    if (!this.open || resetDate === null) return [];
    try {
      return this.deps.database
        .all<{
          recorded_at: string;
          type: string;
          supply: string;
          activity: string | null;
          trade_volume: number;
          purchase_price: number;
          sell_price: number;
        }>(
          `SELECT recorded_at, type, supply, activity, trade_volume, purchase_price, sell_price
           FROM market_prices WHERE reset_date = ? AND waypoint_symbol = ? AND trade_symbol = ?
           ORDER BY recorded_at`,
          [resetDate, waypointSymbol, tradeSymbol],
        )
        .map((row) => ({
          recordedAt: row.recorded_at,
          type: row.type,
          supply: row.supply,
          activity: row.activity,
          tradeVolume: row.trade_volume,
          purchasePrice: row.purchase_price,
          sellPrice: row.sell_price,
        }));
    } catch (error) {
      this.deps.logger.error(SCOPE, "Spielstand nicht lesbar", error);
      return [];
    }
  }

  recordAgent(agent: Agent): void {
    this.write((resetDate, now) => {
      this.deps.database.run(
        "INSERT OR REPLACE INTO agents (reset_date, symbol, data, updated_at) VALUES (?, ?, ?, ?)",
        [resetDate, agent.symbol, JSON.stringify(agent), now],
      );
      return ["agent"];
    });
  }

  /** With `replaceAll`, ships of the current reset that are missing in `ships` are removed. */
  recordShips(ships: Ship[], options: { replaceAll?: boolean } = {}): void {
    this.write((resetDate, now) => {
      const db = this.deps.database;
      if (options.replaceAll) {
        const placeholders = ships.map(() => "?").join(", ");
        db.run(`DELETE FROM ships WHERE reset_date = ? AND symbol NOT IN (${placeholders})`, [
          resetDate,
          ...ships.map((ship) => ship.symbol),
        ]);
      }
      for (const ship of ships) {
        db.run(
          "INSERT OR REPLACE INTO ships (reset_date, symbol, data, updated_at) VALUES (?, ?, ?, ?)",
          [resetDate, ship.symbol, JSON.stringify(ship), now],
        );
      }
      return ["ships"];
    });
  }

  recordShipyard(shipyard: Shipyard): void {
    this.write((resetDate, now) => {
      this.deps.database.run(
        "INSERT OR REPLACE INTO shipyards (reset_date, waypoint_symbol, data, updated_at) VALUES (?, ?, ?, ?)",
        [resetDate, shipyard.symbol, JSON.stringify(shipyard), now],
      );
      const added = this.insertTransactions(
        resetDate,
        (shipyard.transactions ?? []).map((transaction) => ({
          kind: "shipyard",
          waypointSymbol: transaction.waypointSymbol,
          shipSymbol: transaction.shipSymbol,
          itemSymbol: transaction.shipType,
          type: "PURCHASE",
          units: 1,
          pricePerUnit: transaction.price,
          totalPrice: transaction.price,
          timestamp: transaction.timestamp,
          data: transaction,
        })),
      );
      return added > 0 ? ["shipyards", "transactions"] : ["shipyards"];
    });
  }

  recordContracts(contracts: Contract[]): void {
    this.write((resetDate, now) => {
      for (const contract of contracts) {
        this.deps.database.run(
          "INSERT OR REPLACE INTO contracts (reset_date, id, data, updated_at) VALUES (?, ?, ?, ?)",
          [resetDate, contract.id, JSON.stringify(contract), now],
        );
      }
      return ["contracts"];
    });
  }

  /** Stores market transactions; transactions reported twice are stored once. */
  recordTransactions(transactions: MarketTransaction[]): void {
    this.write((resetDate) => {
      const added = this.insertTransactions(resetDate, transactions.map(fromMarketTransaction));
      return added > 0 ? ["transactions"] : [];
    });
  }

  private insertTransactions(resetDate: string, rows: TransactionRow[]): number {
    const db = this.deps.database;
    let added = 0;
    for (const row of rows) {
      const values: SqlValue[] = [
        resetDate,
        row.kind,
        row.waypointSymbol,
        row.shipSymbol,
        row.itemSymbol,
        row.type,
        row.units,
        row.pricePerUnit,
        row.totalPrice,
        row.timestamp,
        JSON.stringify(row.data),
      ];
      db.run(
        `INSERT OR IGNORE INTO transactions (reset_date, kind, waypoint_symbol, ship_symbol,
           item_symbol, type, units, price_per_unit, total_price, timestamp, data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        values,
      );
      added += db.get<{ count: number }>("SELECT changes() AS count")?.count ?? 0;
    }
    return added;
  }

  /** Writes in one transaction for the current reset and emits the changed areas; never throws. */
  private write(fn: (resetDate: string, now: string) => GameStateArea[]): void {
    if (!this.open) {
      this.deps.logger.warn(SCOPE, "Cache geschlossen");
      return;
    }
    const resetDate = this.resetDate;
    if (resetDate === null) {
      this.deps.logger.warn(SCOPE, "Kein Server-Reset bekannt");
      return;
    }
    try {
      const now = this.now();
      const areas = this.deps.database.transaction(() => fn(resetDate, now));
      if (areas.length > 0) this.emit(resetDate, areas);
    } catch (error) {
      this.deps.logger.error(SCOPE, "Spielstand nicht schreibbar", error);
    }
  }

  /** The current reset for reading, or null with a warning. */
  private readableReset(): string | null {
    if (!this.open) {
      this.deps.logger.warn(SCOPE, "Cache geschlossen");
      return null;
    }
    if (this.resetDate === null) {
      this.deps.logger.warn(SCOPE, "Kein Server-Reset bekannt");
    }
    return this.resetDate;
  }

  private isCurrent(generation: number, resetDate: string): boolean {
    return this.open && generation === this.generation && this.resetDate === resetDate;
  }

  private emit(resetDate: string, areas: GameStateArea[]): void {
    this.deps.events.send({ type: "game-state-changed", resetDate, areas });
  }

  private now(): string {
    return this.clock().toISOString();
  }
}

function fromMarketTransaction(transaction: MarketTransaction): TransactionRow {
  return {
    kind: "market",
    waypointSymbol: transaction.waypointSymbol,
    shipSymbol: transaction.shipSymbol,
    itemSymbol: transaction.tradeSymbol,
    type: transaction.type,
    units: transaction.units,
    pricePerUnit: transaction.pricePerUnit,
    totalPrice: transaction.totalPrice,
    timestamp: transaction.timestamp,
    data: transaction,
  };
}
