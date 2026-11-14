import { DatabaseSync } from "node:sqlite";
import type { SqlDatabase, SqlValue } from "../core";

/**
 * SQLite through the built-in `node:sqlite` (ADR-04); contains no logic of its own.
 * The file opens on first use, so a failure surfaces in the cache and not at startup.
 */
export function openSqliteDatabase(path: string): SqlDatabase {
  let db: DatabaseSync | undefined;

  function handle(): DatabaseSync {
    if (!db) {
      const opened = new DatabaseSync(path);
      if (path !== ":memory:") {
        opened.exec("PRAGMA journal_mode = WAL");
        opened.exec("PRAGMA foreign_keys = ON");
      }
      db = opened;
    }
    return db;
  }

  return {
    exec(sql) {
      handle().exec(sql);
    },
    run(sql, params: SqlValue[] = []) {
      handle()
        .prepare(sql)
        .run(...params);
    },
    get<T>(sql: string, params: SqlValue[] = []) {
      return handle()
        .prepare(sql)
        .get(...params) as T | undefined;
    },
    all<T>(sql: string, params: SqlValue[] = []) {
      return handle()
        .prepare(sql)
        .all(...params) as T[];
    },
    transaction<T>(fn: () => T): T {
      const database = handle();
      database.exec("BEGIN");
      try {
        const result = fn();
        database.exec("COMMIT");
        return result;
      } catch (error) {
        database.exec("ROLLBACK");
        throw error;
      }
    },
    close() {
      db?.close();
      db = undefined;
    },
  };
}
