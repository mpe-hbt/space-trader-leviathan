import type { SqlDatabase } from "./ports";

/** Current version of the Spielstand schema, kept in `PRAGMA user_version`. */
export const SCHEMA_VERSION = 1;

/**
 * Every table starts its key with `reset_date`: each row belongs to exactly one
 * Server-Reset, and old Spielstände stay archived instead of being deleted.
 * `data` holds the API object as JSON.
 */
const SCHEMA_V1 = `
CREATE TABLE resets (
  reset_date TEXT PRIMARY KEY,
  first_seen_at TEXT NOT NULL,
  next_reset TEXT,
  frequency TEXT,
  archived_at TEXT
);
CREATE TABLE agents (
  reset_date TEXT NOT NULL,
  symbol TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (reset_date, symbol)
);
CREATE TABLE ships (
  reset_date TEXT NOT NULL,
  symbol TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (reset_date, symbol)
);
CREATE TABLE systems (
  reset_date TEXT NOT NULL,
  symbol TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (reset_date, symbol)
);
CREATE TABLE waypoints (
  reset_date TEXT NOT NULL,
  symbol TEXT NOT NULL,
  system_symbol TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (reset_date, symbol)
);
CREATE INDEX waypoints_by_system ON waypoints (reset_date, system_symbol);
CREATE TABLE system_waypoints_loaded (
  reset_date TEXT NOT NULL,
  system_symbol TEXT NOT NULL,
  loaded_at TEXT NOT NULL,
  PRIMARY KEY (reset_date, system_symbol)
);
CREATE TABLE markets (
  reset_date TEXT NOT NULL,
  waypoint_symbol TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (reset_date, waypoint_symbol)
);
CREATE TABLE market_prices (
  reset_date TEXT NOT NULL,
  waypoint_symbol TEXT NOT NULL,
  trade_symbol TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  type TEXT NOT NULL,
  supply TEXT NOT NULL,
  activity TEXT,
  trade_volume INTEGER NOT NULL,
  purchase_price INTEGER NOT NULL,
  sell_price INTEGER NOT NULL,
  PRIMARY KEY (reset_date, waypoint_symbol, trade_symbol, recorded_at)
);
CREATE TABLE shipyards (
  reset_date TEXT NOT NULL,
  waypoint_symbol TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (reset_date, waypoint_symbol)
);
CREATE TABLE contracts (
  reset_date TEXT NOT NULL,
  id TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (reset_date, id)
);
CREATE TABLE transactions (
  reset_date TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('market', 'shipyard')),
  waypoint_symbol TEXT NOT NULL,
  ship_symbol TEXT NOT NULL,
  item_symbol TEXT NOT NULL,
  type TEXT NOT NULL,
  units INTEGER NOT NULL,
  price_per_unit INTEGER NOT NULL,
  total_price INTEGER NOT NULL,
  timestamp TEXT NOT NULL,
  data TEXT NOT NULL,
  UNIQUE (reset_date, kind, waypoint_symbol, ship_symbol, item_symbol, type, units,
    price_per_unit, total_price, timestamp)
);
`;

/** Creates or upgrades the schema; throws if that fails. */
export function migrate(database: SqlDatabase): void {
  const version = database.get<{ user_version: number }>("PRAGMA user_version")?.user_version ?? 0;
  if (version >= SCHEMA_VERSION) return;
  database.transaction(() => {
    database.exec(SCHEMA_V1);
    database.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  });
}
