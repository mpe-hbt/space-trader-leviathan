import { describe, expect, it, vi } from "vitest";
import { ENCRYPTION_UNAVAILABLE_MESSAGE, INVALID_INPUT_MESSAGE } from "@leviathan/shared";
import {
  AGENTS_FILE,
  INVALID_ACCOUNT_TOKEN_MESSAGE,
  INVALID_AGENT_TOKEN_MESSAGE,
  NO_ACCOUNT_TOKEN_MESSAGE,
  REGISTERED_BUT_NOT_SAVED_MESSAGE,
  SYMBOL_TAKEN_MESSAGE,
  TOO_MANY_REQUESTS_MESSAGE,
  UNREACHABLE_MESSAGE,
  agentErrorMessage,
} from "./agents";
import { createCore } from "./index";
import { LOG_FILE } from "./logger";
import { SECRETS_FILE } from "./secrets";
import { fakePorts } from "./test-fakes";
import { SpaceTradersError } from "@leviathan/api-client";

const ACCOUNT_TOKEN = "account-geheim-123";
const AGENT_TOKEN = "agent-geheim-456";
const OTHER_TOKEN = "agent-geheim-789";
const TOKENS = [ACCOUNT_TOKEN, AGENT_TOKEN, OTHER_TOKEN];

interface Call {
  method: string;
  path: string;
  authorization: string | null;
  body: string;
}

type Route = (call: Call) => Response | Promise<Response>;

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function apiError(status: number, code: number): Response {
  return json(status, { error: { code, message: `Fehler mit ${AGENT_TOKEN} ${ACCOUNT_TOKEN}` } });
}

function apiAgent(symbol: string, credits = 175000) {
  return {
    accountId: "acc",
    symbol,
    headquarters: "X1-AB12-A1",
    credits,
    startingFaction: "COSMIC",
    shipCount: 2,
  };
}

function agentRoute(tokens: Record<string, string>): Route {
  return (call) => {
    const token = call.authorization?.replace("Bearer ", "") ?? "";
    const symbol = tokens[token];
    return symbol ? json(200, { data: apiAgent(symbol) }) : apiError(401, 4104);
  };
}

function fakeFetch(route: Route) {
  const calls: Call[] = [];
  const fn: typeof fetch = async (input, init) => {
    const request = new Request(input, init);
    const call = {
      method: request.method,
      path: new URL(request.url).pathname.replace("/v2", "") + new URL(request.url).search,
      authorization: request.headers.get("Authorization"),
      body: await request.text(),
    };
    calls.push(call);
    return route(call);
  };
  return { fn, calls };
}

async function setup(route: Route, ports = fakePorts()) {
  const fetch = fakeFetch(route);
  const core = createCore(ports, { fetch: fetch.fn });
  await core.start();
  return { ports, core, calls: fetch.calls };
}

const registerRoute: Route = (call) => {
  if (call.method === "POST" && call.path === "/register") {
    const body = JSON.parse(call.body) as { symbol: string };
    return json(201, {
      data: { token: AGENT_TOKEN, agent: apiAgent(body.symbol), faction: {}, ships: [] },
    });
  }
  return agentRoute({ [AGENT_TOKEN]: "LEVI" })(call);
};

/** No token may appear in results, events or the log file. */
async function expectNoToken(
  ports: ReturnType<typeof fakePorts>,
  core: Awaited<ReturnType<typeof setup>>["core"],
  ...results: unknown[]
) {
  await core.logger.flush();
  const texts = [
    JSON.stringify(results),
    JSON.stringify(ports.events.events),
    ports.files.files.get(LOG_FILE) ?? "",
    ports.files.files.get(AGENTS_FILE) ?? "",
    JSON.stringify(core.agents.status()),
  ];
  for (const text of texts) {
    for (const token of TOKENS) expect(text).not.toContain(token);
  }
}

describe("AgentService.register", () => {
  it("registers an agent, makes it active and stores the token only encrypted", async () => {
    const { ports, core, calls } = await setup(registerRoute);
    const result = await core.agents.register({
      symbol: "levi",
      faction: "COSMIC",
      accountToken: ACCOUNT_TOKEN,
    });

    expect(result).toEqual({
      ok: true,
      agents: {
        encryptionAvailable: true,
        accountTokenConfigured: true,
        active: "LEVI",
        agents: [
          {
            symbol: "LEVI",
            faction: "COSMIC",
            headquarters: "X1-AB12-A1",
            credits: 175000,
            status: "valid",
          },
        ],
      },
    });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.authorization).toBe(`Bearer ${ACCOUNT_TOKEN}`);
    expect(JSON.parse(calls[0]?.body ?? "")).toEqual({ symbol: "LEVI", faction: "COSMIC" });

    const file = JSON.parse(ports.files.files.get(AGENTS_FILE) ?? "") as {
      active: string;
      agents: { token: string }[];
    };
    expect(file.active).toBe("LEVI");
    expect(ports.cipher.decrypt(file.agents[0]?.token ?? "")).toBe(AGENT_TOKEN);
    expect(ports.files.files.get(SECRETS_FILE)).not.toContain(ACCOUNT_TOKEN);
    expect(ports.events.events.map((event) => event.type)).toEqual([
      "settings-changed",
      "agents-changed",
    ]);
    await expectNoToken(ports, core, result);

    const restarted = createCore(ports, { fetch: fakeFetch(registerRoute).fn });
    await restarted.start();
    expect(restarted.agents.status()).toMatchObject({
      active: "LEVI",
      agents: [{ symbol: "LEVI" }],
    });
    expect(restarted.agents.activeClient()).toBeDefined();
  });

  it("uses the stored Account-Token when none is entered", async () => {
    const { ports, core, calls } = await setup(registerRoute);
    await core.settings.setSecret("accountToken", ACCOUNT_TOKEN);
    const result = await core.agents.register({ symbol: "LEVI", faction: "COSMIC" });
    expect(result.ok).toBe(true);
    expect(calls[0]?.authorization).toBe(`Bearer ${ACCOUNT_TOKEN}`);
    await expectNoToken(ports, core, result);
  });

  it("reports a taken symbol in German", async () => {
    const { ports, core } = await setup(() => apiError(409, 4111));
    const result = await core.agents.register({
      symbol: "LEVI",
      faction: "COSMIC",
      accountToken: ACCOUNT_TOKEN,
    });
    expect(result).toEqual({ ok: false, message: SYMBOL_TAKEN_MESSAGE });
    expect(core.agents.status().agents).toEqual([]);
    expect(ports.files.files.has(AGENTS_FILE)).toBe(false);
    await expectNoToken(ports, core, result);
  });

  it("rejects an invalid Account-Token", async () => {
    const { ports, core } = await setup(() => apiError(401, 4100));
    const result = await core.agents.register({
      symbol: "LEVI",
      faction: "COSMIC",
      accountToken: ACCOUNT_TOKEN,
    });
    expect(result).toEqual({ ok: false, message: INVALID_ACCOUNT_TOKEN_MESSAGE });
    await expectNoToken(ports, core, result);
  });

  it("does not call the network without Account-Token", async () => {
    const { ports, core, calls } = await setup(registerRoute);
    const result = await core.agents.register({ symbol: "LEVI", faction: "COSMIC" });
    expect(result).toEqual({ ok: false, message: NO_ACCOUNT_TOKEN_MESSAGE });
    expect(calls).toHaveLength(0);
    await expectNoToken(ports, core, result);
  });

  it("does not call the network without encryption", async () => {
    const ports = fakePorts();
    ports.cipher.available = false;
    const { core, calls } = await setup(registerRoute, ports);
    const result = await core.agents.register({
      symbol: "LEVI",
      faction: "COSMIC",
      accountToken: ACCOUNT_TOKEN,
    });
    expect(result).toEqual({ ok: false, message: ENCRYPTION_UNAVAILABLE_MESSAGE });
    expect(calls).toHaveLength(0);
    await expectNoToken(ports, core, result);
  });

  it.each([
    ["no object", "LEVI"],
    ["short symbol", { symbol: "AB", faction: "COSMIC" }],
    ["long symbol", { symbol: "A".repeat(15), faction: "COSMIC" }],
    ["symbol with space", { symbol: "LE VI", faction: "COSMIC" }],
    ["lowercase faction", { symbol: "LEVI", faction: "cosmic" }],
    ["invalid token", { symbol: "LEVI", faction: "COSMIC", accountToken: "a b" }],
  ])("rejects %s", async (_label, input) => {
    const { core, calls } = await setup(registerRoute);
    expect(await core.agents.register(input)).toEqual({
      ok: false,
      message: INVALID_INPUT_MESSAGE,
    });
    expect(calls).toHaveLength(0);
  });

  it("keeps the agent for the session when saving fails", async () => {
    const { ports, core } = await setup(registerRoute);
    await core.settings.setSecret("accountToken", ACCOUNT_TOKEN);
    ports.files.failWrites = true;
    const result = await core.agents.register({ symbol: "LEVI", faction: "COSMIC" });
    expect(result).toEqual({ ok: false, message: REGISTERED_BUT_NOT_SAVED_MESSAGE });
    expect(core.agents.status().active).toBe("LEVI");
    await expectNoToken(ports, core, result);
  });
});

describe("AgentService.importToken", () => {
  it("takes over a valid Agent-Token", async () => {
    const { ports, core, calls } = await setup(agentRoute({ [AGENT_TOKEN]: "LEVI" }));
    const result = await core.agents.importToken(AGENT_TOKEN);
    expect(result).toMatchObject({
      ok: true,
      agents: { active: "LEVI", agents: [{ symbol: "LEVI", status: "valid" }] },
    });
    expect(calls).toEqual([
      expect.objectContaining({ path: "/my/agent", authorization: `Bearer ${AGENT_TOKEN}` }),
    ]);
    await expectNoToken(ports, core, result);
  });

  it("does not store an invalid Agent-Token", async () => {
    const { ports, core } = await setup(agentRoute({}));
    const result = await core.agents.importToken(AGENT_TOKEN);
    expect(result).toEqual({ ok: false, message: INVALID_AGENT_TOKEN_MESSAGE });
    expect(core.agents.status().agents).toEqual([]);
    expect(ports.files.files.has(AGENTS_FILE)).toBe(false);
    await expectNoToken(ports, core, result);
  });

  it("rejects an empty value without network call", async () => {
    const { core, calls } = await setup(agentRoute({}));
    expect(await core.agents.importToken("  ")).toEqual({
      ok: false,
      message: INVALID_INPUT_MESSAGE,
    });
    expect(calls).toHaveLength(0);
  });
});

describe("AgentService select and remove", () => {
  async function twoAgents() {
    const env = await setup(agentRoute({ [AGENT_TOKEN]: "LEVI", [OTHER_TOKEN]: "NAUTILUS" }));
    await env.core.agents.importToken(AGENT_TOKEN);
    await env.core.agents.importToken(OTHER_TOKEN);
    env.ports.events.events.length = 0;
    return env;
  }

  it("switches the active agent and checks it", async () => {
    const { ports, core, calls } = await twoAgents();
    expect(core.agents.status().active).toBe("NAUTILUS");
    const result = await core.agents.select("LEVI");
    expect(result).toMatchObject({ ok: true, agents: { active: "LEVI" } });
    expect(calls.at(-1)?.authorization).toBe(`Bearer ${AGENT_TOKEN}`);
    expect(ports.events.events[0]).toMatchObject({
      type: "agents-changed",
      agents: { active: "LEVI" },
    });
    await expectNoToken(ports, core, result);
  });

  it("removes an agent and clears the active agent", async () => {
    const { ports, core } = await twoAgents();
    const result = await core.agents.remove("NAUTILUS");
    expect(result).toMatchObject({
      ok: true,
      agents: { active: null, agents: [{ symbol: "LEVI" }] },
    });
    expect(ports.events.events).toEqual([{ type: "agents-changed", agents: core.agents.status() }]);
    expect(ports.files.files.get(AGENTS_FILE)).not.toContain("NAUTILUS");
    expect(core.agents.activeClient()).toBeUndefined();
    await expectNoToken(ports, core, result);
  });

  it("rejects unknown symbols", async () => {
    const { core } = await twoAgents();
    expect(await core.agents.select("UNKNOWN")).toEqual({
      ok: false,
      message: INVALID_INPUT_MESSAGE,
    });
    expect(await core.agents.remove(42)).toEqual({ ok: false, message: INVALID_INPUT_MESSAGE });
  });
});

describe("AgentService.check", () => {
  it.each([
    ["401", 401, 4104],
    ["4104", 400, 4104],
  ])("marks an agent as expired on %s", async (_label, status, code) => {
    let expired = false;
    const { ports, core } = await setup((call) =>
      expired ? apiError(status, code) : agentRoute({ [AGENT_TOKEN]: "LEVI" })(call),
    );
    await core.agents.importToken(AGENT_TOKEN);
    expired = true;
    const result = await core.agents.check();
    expect(result).toMatchObject({
      ok: true,
      agents: { active: "LEVI", agents: [{ symbol: "LEVI", status: "expired" }] },
    });
    expect(ports.events.events.at(-1)).toMatchObject({
      type: "agents-changed",
      agents: { agents: [{ status: "expired" }] },
    });
    await expectNoToken(ports, core, result);
  });

  it("keeps the state on a network error", async () => {
    let offline = false;
    const { ports, core } = await setup((call) => {
      if (offline) throw new TypeError(`fetch failed ${AGENT_TOKEN}`);
      return agentRoute({ [AGENT_TOKEN]: "LEVI" })(call);
    });
    await core.agents.importToken(AGENT_TOKEN);
    offline = true;
    const events = ports.events.events.length;
    const result = await core.agents.check("LEVI");
    expect(result).toEqual({ ok: false, message: UNREACHABLE_MESSAGE });
    expect(core.agents.status().agents[0]?.status).toBe("valid");
    expect(ports.events.events).toHaveLength(events);
    await expectNoToken(ports, core, result);
  });

  it("does not call the network on start without agent", async () => {
    const { calls } = await setup(registerRoute);
    expect(calls).toHaveLength(0);
  });

  it("checks the active agent on start", async () => {
    const ports = fakePorts();
    const first = await setup(agentRoute({ [AGENT_TOKEN]: "LEVI" }), ports);
    await first.core.agents.importToken(AGENT_TOKEN);

    const { core, calls } = await setup(() => apiError(401, 4103), ports);
    await vi.waitFor(() => expect(core.agents.status().agents[0]?.status).toBe("expired"));
    expect(calls).toHaveLength(1);
    await expectNoToken(ports, core);
  });
});

describe("AgentService.load", () => {
  it.each([
    ["broken JSON", "{"],
    ["unknown format", "[]"],
    ["missing agents", JSON.stringify({ active: "LEVI" })],
  ])("treats %s as no agents", async (_label, content) => {
    const ports = fakePorts();
    ports.files.files.set(AGENTS_FILE, content);
    const { core, calls } = await setup(registerRoute, ports);
    expect(core.agents.status()).toMatchObject({ active: null, agents: [] });
    expect(calls).toHaveLength(0);
    await core.logger.flush();
    expect(ports.files.files.get(LOG_FILE)).toContain("Agents-Datei");
  });

  it("skips entries whose token cannot be decrypted", async () => {
    const ports = fakePorts();
    const agent = { faction: "COSMIC", headquarters: "X1-A", credits: 1, status: "valid" };
    ports.files.files.set(
      AGENTS_FILE,
      JSON.stringify({
        active: "BROKEN",
        agents: [
          { ...agent, symbol: "BROKEN", token: "kaputt" },
          { ...agent, symbol: "LEVI", token: ports.cipher.encrypt(AGENT_TOKEN), status: "x" },
        ],
      }),
    );
    const { core } = await setup(registerRoute, ports);
    expect(core.agents.status()).toMatchObject({
      active: null,
      agents: [{ symbol: "LEVI", status: "unchecked" }],
    });
    await expectNoToken(ports, core);
  });
});

describe("AgentService.factions", () => {
  it("loads all pages over the core fetch, sorted by name, and caches them", async () => {
    const pages = [
      [
        { symbol: "VOID", name: "Void", isRecruiting: false, headquarters: "X1-V" },
        { symbol: "COSMIC", name: "Cosmic", isRecruiting: true, headquarters: "X1-C" },
      ],
      [{ symbol: "ASTRO", name: "Astro", isRecruiting: true }],
    ];
    const { core, calls } = await setup((call) => {
      const page = Number(new URLSearchParams(call.path.split("?")[1]).get("page"));
      const data = (pages[page - 1] ?? []).map((faction) => ({
        description: "",
        traits: [],
        ...faction,
      }));
      return json(200, { data, meta: { total: 3, page, limit: 20 } });
    });
    const result = await core.agents.factions();
    expect(result).toEqual({
      ok: true,
      factions: [
        { symbol: "ASTRO", name: "Astro", headquarters: "", isRecruiting: true },
        { symbol: "COSMIC", name: "Cosmic", headquarters: "X1-C", isRecruiting: true },
        { symbol: "VOID", name: "Void", headquarters: "X1-V", isRecruiting: false },
      ],
    });
    expect(calls.map((call) => call.path)).toEqual([
      "/factions?page=1&limit=20",
      "/factions?page=2&limit=20",
    ]);
    expect(calls.every((call) => call.authorization === null)).toBe(true);
    await core.agents.factions();
    expect(calls).toHaveLength(2);
  });

  it("does not cache an error", async () => {
    let fail = true;
    const { core, calls } = await setup(() =>
      fail ? apiError(429, 429) : json(200, { data: [], meta: { total: 0, page: 1, limit: 20 } }),
    );
    expect(await core.agents.factions()).toEqual({
      ok: false,
      message: TOO_MANY_REQUESTS_MESSAGE,
    });
    fail = false;
    expect(await core.agents.factions()).toEqual({ ok: true, factions: [] });
    expect(calls).toHaveLength(2);
  });
});

describe("agentErrorMessage", () => {
  it("maps the errors to short German messages", () => {
    const error = (status: number, code?: number) =>
      new SpaceTradersError(status, code, "API", undefined);
    expect(agentErrorMessage(error(409, 4109), "register")).toBe(SYMBOL_TAKEN_MESSAGE);
    expect(agentErrorMessage(error(401), "register")).toBe(INVALID_ACCOUNT_TOKEN_MESSAGE);
    expect(agentErrorMessage(error(401), "check")).toBe(INVALID_AGENT_TOKEN_MESSAGE);
    expect(agentErrorMessage(error(400, 4108), "import")).toBe(INVALID_AGENT_TOKEN_MESSAGE);
    expect(agentErrorMessage(error(429, 429), "check")).toBe(TOO_MANY_REQUESTS_MESSAGE);
    expect(agentErrorMessage(new TypeError("x"), "check")).toBe(UNREACHABLE_MESSAGE);
    expect(agentErrorMessage(error(400, 4200), "check")).toBe(
      "SpaceTraders hat die Anfrage abgelehnt (Code 4200).",
    );
    expect(agentErrorMessage(error(500), "check")).toBe(
      "SpaceTraders hat die Anfrage abgelehnt (Code 500).",
    );
  });
});
