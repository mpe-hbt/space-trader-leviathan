import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, expectTypeOf, it } from "vitest";
import { createSpaceTradersClient } from "./client";
import { SpaceTradersError } from "./errors";
import type { operations } from "./generated/schema";
import { SPACETRADERS_API_BASE_URL } from "./index";

interface Recorded {
  url: string;
  method: string;
  authorization: string | null;
  body: string;
}

function fakeFetch(status: number, body: unknown, recorded: Recorded[] = []): typeof fetch {
  return async (input, init) => {
    const request = new Request(input, init);
    recorded.push({
      url: request.url,
      method: request.method,
      authorization: request.headers.get("Authorization"),
      body: await request.text(),
    });
    const text = typeof body === "string" ? body : JSON.stringify(body);
    return new Response(text, {
      status,
      headers: { "Content-Type": typeof body === "string" ? "text/plain" : "application/json" },
    });
  };
}

describe("createSpaceTradersClient", () => {
  it("gibt bei Erfolg den ganzen Body mit meta zurück und sendet den Agent-Token", async () => {
    const recorded: Recorded[] = [];
    const body = { data: [], meta: { total: 0, page: 2, limit: 20 } };
    const client = createSpaceTradersClient({
      agentToken: "agent-token",
      accountToken: "account-token",
      fetch: fakeFetch(200, body, recorded),
    });

    const result = await client.fleet.getMyShips({ page: 2, limit: 20 });

    expect(result).toEqual(body);
    expect(recorded).toHaveLength(1);
    expect(recorded[0]?.method).toBe("GET");
    expect(recorded[0]?.url).toBe(`${SPACETRADERS_API_BASE_URL}/my/ships?page=2&limit=20`);
    expect(recorded[0]?.authorization).toBe("Bearer agent-token");
  });

  it("sendet bei register den Account-Token und den Body", async () => {
    const recorded: Recorded[] = [];
    const client = createSpaceTradersClient({
      agentToken: "agent-token",
      accountToken: "account-token",
      fetch: fakeFetch(201, { data: {} }, recorded),
    });

    await client.global.register({ symbol: "LEVIATHAN", faction: "COSMIC" });

    expect(recorded[0]?.method).toBe("POST");
    expect(recorded[0]?.authorization).toBe("Bearer account-token");
    expect(JSON.parse(recorded[0]?.body ?? "")).toEqual({
      symbol: "LEVIATHAN",
      faction: "COSMIC",
    });
  });

  it("sendet ohne Token keinen Authorization-Header", async () => {
    const recorded: Recorded[] = [];
    const client = createSpaceTradersClient({ fetch: fakeFetch(200, { data: {} }, recorded) });

    await client.global.getStatus();
    await client.global.register({ symbol: "LEVIATHAN", faction: "COSMIC" });

    expect(recorded.map((r) => r.authorization)).toEqual([null, null]);
  });

  it("nutzt die eigene Basis-URL und setzt Pfadparameter ein", async () => {
    const recorded: Recorded[] = [];
    const client = createSpaceTradersClient({
      baseUrl: "https://example.test/v2",
      agentToken: "agent-token",
      fetch: fakeFetch(200, { data: {} }, recorded),
    });

    await client.fleet.navigateShip({ shipSymbol: "SHIP-1" }, { waypointSymbol: "X1-DF55-A1" });

    expect(recorded[0]?.method).toBe("POST");
    expect(recorded[0]?.url).toBe("https://example.test/v2/my/ships/SHIP-1/navigate");
    expect(JSON.parse(recorded[0]?.body ?? "")).toEqual({ waypointSymbol: "X1-DF55-A1" });
  });

  it("wirft bei einer Fehlerantwort einen SpaceTradersError mit Status", async () => {
    const client = createSpaceTradersClient({
      agentToken: "agent-token",
      fetch: fakeFetch(400, {
        error: { code: 4214, message: "Ship is currently in-transit.", data: { a: 1 } },
      }),
    });

    const error = await client.fleet.orbitShip({ shipSymbol: "SHIP-1" }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(SpaceTradersError);
    expect(error).toMatchObject({
      status: 400,
      code: 4214,
      message: "Ship is currently in-transit.",
      data: { a: 1 },
    });
    expect(String((error as Error).message)).not.toContain("agent-token");
  });

  it("wirft bei einer Fehlerantwort ohne Standardfehler einen SpaceTradersError", async () => {
    const client = createSpaceTradersClient({ fetch: fakeFetch(500, "Internal Server Error") });

    const error = await client.global.getStatus().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(SpaceTradersError);
    expect(error).toMatchObject({
      status: 500,
      code: undefined,
      message: "HTTP 500",
      data: "Internal Server Error",
    });
  });

  it("reicht Netzwerkfehler von fetch unverändert weiter", async () => {
    const networkError = new TypeError("fetch failed");
    const client = createSpaceTradersClient({
      fetch: async () => {
        throw networkError;
      },
    });

    await expect(client.global.getStatus()).rejects.toBe(networkError);
  });

  it("ist aus dem Schema typisiert", () => {
    const client = createSpaceTradersClient();
    expectTypeOf(client.fleet.getMyShips).returns.resolves.toEqualTypeOf<
      operations["get-my-ships"]["responses"][200]["content"]["application/json"]
    >();
    expectTypeOf(client.agents.getMyAgent).returns.resolves.toEqualTypeOf<
      operations["get-my-agent"]["responses"][200]["content"]["application/json"]
    >();
    // Typprüfung: falsche Parameter sind Typfehler (wird nur von tsc geprüft, nicht ausgeführt).
    if (Math.random() > 2) {
      // @ts-expect-error shipSymbol fehlt
      void client.fleet.getMyShip({});
      // @ts-expect-error Body für navigate fehlt
      void client.fleet.navigateShip({ shipSymbol: "SHIP-1" });
    }
  });
});

describe("Vollständigkeit der Fassaden", () => {
  const spec = JSON.parse(
    readFileSync(resolve(import.meta.dirname, "../spec/SpaceTraders.json"), "utf8"),
  ) as { paths: Record<string, Record<string, { operationId?: string; tags?: string[] }>> };

  const operations = Object.values(spec.paths).flatMap((pathItem) =>
    Object.values(pathItem).filter((op) => typeof op === "object" && op?.operationId),
  );

  const toCamelCase = (id: string) => id.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());

  it("hat für jede operationId eine Methode in der Fassade ihres Tags", () => {
    const client = createSpaceTradersClient() as unknown as Record<string, Record<string, unknown>>;
    expect(operations).toHaveLength(59);
    for (const op of operations) {
      const tag = (op.tags?.[0] ?? "").toLowerCase();
      const method = toCamelCase(op.operationId ?? "");
      expect(typeof client[tag]?.[method], `${tag}.${method}`).toBe("function");
    }
  });

  it("hat keine Methoden ohne passende operationId", () => {
    const client = createSpaceTradersClient() as unknown as Record<string, Record<string, unknown>>;
    const expected = new Set(
      operations.map(
        (op) => `${(op.tags?.[0] ?? "").toLowerCase()}.${toCamelCase(op.operationId ?? "")}`,
      ),
    );
    const actual = Object.entries(client).flatMap(([tag, facade]) =>
      Object.keys(facade).map((method) => `${tag}.${method}`),
    );
    expect(new Set(actual)).toEqual(expected);
    expect(Object.keys(client).sort()).toEqual(
      ["agents", "contracts", "data", "factions", "fleet", "global", "systems"].sort(),
    );
  });
});
