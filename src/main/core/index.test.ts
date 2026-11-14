import { afterEach, describe, expect, it, vi } from "vitest";
import { SPACETRADERS_API_BASE_URL } from "@leviathan/api-client";
import { createCore } from "./index";
import { LOG_FILE } from "./logger";
import { RequestQueue, STOPPED_MESSAGE } from "./request-queue";
import { ROUTINES_FILE } from "./routines";
import { fakePorts } from "./test-fakes";

describe("createCore", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("wires all services", () => {
    const core = createCore(fakePorts());
    expect(core.spaceTraders.baseUrl).toBe(SPACETRADERS_API_BASE_URL);
    expect(core.boardComputer.isAvailable()).toBe(false);
    expect(core.gitHub.isAvailable()).toBe(false);
  });

  it("starts and shuts down the services together", async () => {
    const ports = fakePorts();
    const core = createCore(ports);
    await core.start();
    expect(core.cache.isOpen()).toBe(true);
    expect(core.routines.state()).toBe("running");

    await core.shutdown();
    expect(core.cache.isOpen()).toBe(false);
    expect(core.routines.state()).toBe("paused");
    expect(ports.files.files.get(ROUTINES_FILE)).toBe(JSON.stringify({ pausedByQuit: true }));
    const log = ports.files.files.get(LOG_FILE) ?? "";
    expect(log).toContain("Kern gestartet");
    expect(log).toContain("Routinen pausiert");
    expect(log).toContain("Kern beendet");
  });

  it("resumes the routines on the next start", async () => {
    const ports = fakePorts();
    const first = createCore(ports);
    await first.start();
    await first.shutdown();

    const second = createCore(ports);
    await second.start();
    expect(second.routines.state()).toBe("running");
    await second.logger.flush();
    expect(ports.files.files.get(LOG_FILE)).toContain("Routinen fortgesetzt");
  });

  it("gives up shutting down after the timeout", async () => {
    const ports = fakePorts();
    ports.files.write = () => new Promise(() => {});
    const core = createCore(ports, { shutdownTimeoutMs: 20 });
    await expect(core.shutdown()).resolves.toBeUndefined();
  });

  it("emits events without secret values", async () => {
    const ports = fakePorts();
    const core = createCore(ports);
    await core.start();
    await core.settings.setSecret("anthropicApiKey", "sk-ant-geheim");
    await core.settings.clearSecret("anthropicApiKey");
    await core.settings.setSecret("githubToken", "");
    await core.shutdown();

    expect(ports.events.events.map((event) => event.type)).toEqual([
      "settings-changed",
      "settings-changed",
      "routines-changed",
    ]);
    expect(JSON.stringify(ports.events.events)).not.toContain("sk-ant-geheim");
    expect(ports.files.files.get(LOG_FILE)).not.toContain("sk-ant-geheim");
  });

  it("exposes the request queue and sends SpaceTraders requests through it", async () => {
    const transport = vi.fn<typeof fetch>(async () =>
      Response.json({ status: "ok" }, { status: 200 }),
    );
    vi.stubGlobal("fetch", transport);
    const core = createCore(fakePorts());
    expect(core.requestQueue).toBeInstanceOf(RequestQueue);
    const fetchSpy = vi.spyOn(core.requestQueue, "fetch");

    await core.spaceTraders.client("user").global.getStatus();

    expect(fetchSpy).toHaveBeenCalledWith("user", expect.any(Request), undefined);
    expect(transport).toHaveBeenCalledTimes(1);
    const sent = transport.mock.calls[0]![0] as Request;
    expect(sent.url).toBe(`${SPACETRADERS_API_BASE_URL}/`);
    expect(core.requestQueue.metrics().averageWaitMs).toBe(0);
    await core.shutdown();
  });

  it("stops the request queue on shutdown", async () => {
    const core = createCore(fakePorts());
    await core.start();
    await core.shutdown();
    await expect(core.requestQueue.fetch("user", `${SPACETRADERS_API_BASE_URL}/`)).rejects.toThrow(
      STOPPED_MESSAGE,
    );
  });
});
