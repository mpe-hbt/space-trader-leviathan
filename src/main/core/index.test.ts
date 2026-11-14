import { describe, expect, it } from "vitest";
import { SPACETRADERS_API_BASE_URL } from "@leviathan/api-client";
import { createCore } from "./index";
import { LOG_FILE } from "./logger";
import { ROUTINES_FILE } from "./routines";
import { fakePorts } from "./test-fakes";

describe("createCore", () => {
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
});
