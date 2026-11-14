import { IpcChannel, type AppInfo } from "@leviathan/shared";
import type { Core } from "./core";

export const FOREIGN_SENDER_MESSAGE = "Unzulässiger Absender";

/** The part of `IpcMainInvokeEvent` the handlers need. */
export interface InvokeEvent {
  senderFrame?: { url: string } | null;
}

export type InvokeHandler = (event: InvokeEvent, ...args: unknown[]) => unknown;

/** Same shape as `ipcMain.handle`, injected so the handlers run without Electron. */
export type HandleFunction = (channel: IpcChannel, handler: InvokeHandler) => void;

/**
 * Checks that an IPC call comes from our own renderer: the dev server origin in
 * development or the bundled `renderer/index.html` as `file:` URL.
 */
export function isAllowedSender(
  senderUrl: string | undefined,
  allowedRendererUrl: string,
): boolean {
  if (!senderUrl) return false;
  let sender: URL;
  let allowed: URL;
  try {
    sender = new URL(senderUrl);
    allowed = new URL(allowedRendererUrl);
  } catch {
    return false;
  }
  if (allowed.protocol === "file:") {
    return sender.protocol === "file:" && sender.pathname === allowed.pathname;
  }
  return sender.origin === allowed.origin;
}

export interface IpcDependencies {
  core: Pick<Core, "settings" | "agents" | "logger">;
  appInfo: () => AppInfo;
  allowedRendererUrl: string;
}

export function registerIpcHandlers(handle: HandleFunction, deps: IpcDependencies): void {
  const { core, appInfo, allowedRendererUrl } = deps;

  type ChannelHandler = ((...args: unknown[]) => unknown) | undefined;
  const table: Record<IpcChannel, ChannelHandler> = {
    [IpcChannel.GetAppInfo]: () => appInfo(),
    [IpcChannel.GetSettings]: () => core.settings.status(),
    [IpcChannel.SetSecret]: (name, value) => core.settings.setSecret(name, value),
    [IpcChannel.ClearSecret]: (name) => core.settings.clearSecret(name),
    [IpcChannel.GetAgents]: () => core.agents.status(),
    [IpcChannel.GetFactions]: () => core.agents.factions(),
    [IpcChannel.RegisterAgent]: (input) => core.agents.register(input),
    [IpcChannel.ImportAgentToken]: (token) => core.agents.importToken(token),
    [IpcChannel.SelectAgent]: (symbol) => core.agents.select(symbol),
    [IpcChannel.RemoveAgent]: (symbol) => core.agents.remove(symbol),
    [IpcChannel.CheckAgents]: (symbol) => core.agents.check(symbol),
    // Main → renderer only; no handler.
    [IpcChannel.CoreEvent]: undefined,
  };

  for (const [channel, fn] of Object.entries(table) as [IpcChannel, ChannelHandler][]) {
    if (!fn) continue;
    handle(channel, (event, ...args) => {
      const url = event.senderFrame?.url;
      if (!isAllowedSender(url, allowedRendererUrl)) {
        core.logger.warn("ipc", "Aufruf eines fremden Absenders abgelehnt", { channel, url });
        throw new Error(FOREIGN_SENDER_MESSAGE);
      }
      return fn(...args);
    });
  }
}
