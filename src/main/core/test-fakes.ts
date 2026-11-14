import type { CoreEvent } from "@leviathan/shared";
import { openSqliteDatabase } from "../adapters/sqlite";
import type { EventSink, FetchFunction, FileStore, SecretCipher, SqlDatabase } from "./ports";

/** In-memory fakes for the core ports; used only by tests. */
export class MemoryFileStore implements FileStore {
  readonly files = new Map<string, string>();
  failWrites = false;

  async read(name: string) {
    return this.files.get(name);
  }
  async write(name: string, text: string) {
    if (this.failWrites) throw new Error("disk full");
    this.files.set(name, text);
  }
  async append(name: string, text: string) {
    if (this.failWrites) throw new Error("disk full");
    this.files.set(name, (this.files.get(name) ?? "") + text);
  }
  async size(name: string) {
    return Buffer.byteLength(this.files.get(name) ?? "");
  }
  async rename(from: string, to: string) {
    const text = this.files.get(from);
    if (text === undefined) throw new Error("missing");
    this.files.set(to, text);
    this.files.delete(from);
  }
}

/** Reversible fake encryption that never equals the plaintext. */
export class FakeCipher implements SecretCipher {
  available = true;
  isAvailable() {
    return this.available;
  }
  encrypt(plain: string) {
    return Buffer.from(`enc:${[...plain].reverse().join("")}`).toString("base64");
  }
  decrypt(base64: string) {
    const text = Buffer.from(base64, "base64").toString();
    if (!text.startsWith("enc:")) throw new Error("cannot decrypt");
    return [...text.slice(4)].reverse().join("");
  }
}

export class RecordingEventSink implements EventSink {
  readonly events: CoreEvent[] = [];
  send(event: CoreEvent) {
    this.events.push(event);
  }
}

/** A fetch port that answers from a table of path+query → JSON and records every request. */
export type FakeFetch = FetchFunction & {
  /** Path and query of every request, without the `/v2` prefix, e.g. `/systems/X1-A?page=1`. */
  readonly requests: string[];
  /** Answers requests to `pathAndQuery` with `body`. */
  respond(pathAndQuery: string, body: unknown, status?: number): void;
  /** Removes all answers; further requests fail like a missing network. */
  clear(): void;
};

export function createFakeFetch(): FakeFetch {
  const responses = new Map<string, { body: unknown; status: number }>();
  const requests: string[] = [];
  const fn = async (input: Parameters<FetchFunction>[0]) => {
    const raw = input instanceof Request ? input.url : String(input);
    const url = new URL(raw);
    const key = url.pathname.replace(/^\/v2(?=\/)/, "") + url.search;
    requests.push(key);
    const entry = responses.get(key);
    if (!entry) throw new TypeError(`fetch failed: ${key}`);
    return new Response(JSON.stringify(entry.body), {
      status: entry.status,
      headers: { "Content-Type": "application/json" },
    });
  };
  return Object.assign(fn, {
    requests,
    respond(pathAndQuery: string, body: unknown, status = 200) {
      responses.set(pathAndQuery, { body, status });
    },
    clear() {
      responses.clear();
    },
  }) as FakeFetch;
}

export function fakePorts(database: SqlDatabase = openSqliteDatabase(":memory:")) {
  return {
    cipher: new FakeCipher(),
    files: new MemoryFileStore(),
    events: new RecordingEventSink(),
    database,
    fetch: createFakeFetch(),
  };
}
