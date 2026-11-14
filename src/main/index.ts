import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { BrowserWindow, app, ipcMain, type Tray } from "electron";
import { APP_NAME, type AppInfo } from "@leviathan/shared";
import { createElectronPorts } from "./adapters/electron";
import { createCore } from "./core";
import { registerIpcHandlers } from "./ipc";
import { createTray } from "./tray";
import { createWindowOptions } from "./window";

const rendererUrl = process.env["ELECTRON_RENDERER_URL"];
const useDevServer = !app.isPackaged && rendererUrl !== undefined;
const rendererFile = join(import.meta.dirname, "../renderer/index.html");

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;
let shutdownStarted = false;
let shutdownDone = false;

const core = createCore(createElectronPorts(() => mainWindow));

process.on("uncaughtException", (error) => {
  core.logger.error("main", "Unbehandelter Fehler", error);
});
process.on("unhandledRejection", (reason) => {
  core.logger.error("main", "Unbehandelte Ablehnung", reason);
});

function isAllowedNavigation(url: string): boolean {
  if (!rendererUrl) return false;
  return new URL(url).origin === new URL(rendererUrl).origin;
}

function createWindow(): BrowserWindow {
  const window = new BrowserWindow(
    createWindowOptions(join(import.meta.dirname, "../preload/index.cjs")),
  );

  window.once("ready-to-show", () => window.show());

  // Tray-Modus: closing only hides the window; routines keep running.
  window.on("close", (event) => {
    if (isQuitting) return;
    event.preventDefault();
    window.hide();
  });
  window.on("closed", () => {
    if (mainWindow === window) mainWindow = null;
  });

  window.webContents.on("will-navigate", (event, url) => {
    if (!isAllowedNavigation(url)) event.preventDefault();
  });
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));

  if (useDevServer && rendererUrl) {
    void window.loadURL(rendererUrl);
  } else {
    void window.loadFile(rendererFile);
  }
  return window;
}

function showWindow(): void {
  if (!mainWindow || mainWindow.isDestroyed()) mainWindow = createWindow();
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

if (!app.requestSingleInstanceLock()) {
  // Another instance runs already; it brings its window to the front.
  app.quit();
} else {
  registerIpcHandlers((channel, handler) => ipcMain.handle(channel, handler), {
    core,
    appInfo: (): AppInfo => ({ name: APP_NAME, version: app.getVersion() }),
    allowedRendererUrl:
      useDevServer && rendererUrl ? rendererUrl : pathToFileURL(rendererFile).href,
  });

  app.on("second-instance", () => showWindow());

  // Keep running in the tray when no window is open; only „Beenden“ ends the app.
  app.on("window-all-closed", () => {});

  app.on("before-quit", (event) => {
    isQuitting = true;
    if (shutdownDone) return;
    event.preventDefault();
    if (shutdownStarted) return;
    shutdownStarted = true;
    void core.shutdown().finally(() => {
      shutdownDone = true;
      app.quit();
    });
  });

  void app.whenReady().then(async () => {
    await core.start();
    mainWindow = createWindow();
    tray = createTray({ showWindow, quit: () => app.quit() });
    if (!tray.isDestroyed()) core.logger.info("main", "Tray-Symbol bereit");

    app.on("activate", () => showWindow());
  });
}
