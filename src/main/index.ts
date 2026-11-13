import { join } from "node:path";
import { BrowserWindow, app, ipcMain } from "electron";
import { APP_NAME, IpcChannel, type AppInfo } from "@leviathan/shared";
import { createWindowOptions } from "./window";

const rendererUrl = process.env["ELECTRON_RENDERER_URL"];

function isAllowedNavigation(url: string): boolean {
  if (!rendererUrl) return false;
  return new URL(url).origin === new URL(rendererUrl).origin;
}

function createWindow(): void {
  const window = new BrowserWindow(
    createWindowOptions(join(import.meta.dirname, "../preload/index.cjs")),
  );

  window.once("ready-to-show", () => window.show());

  window.webContents.on("will-navigate", (event, url) => {
    if (!isAllowedNavigation(url)) event.preventDefault();
  });
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));

  if (!app.isPackaged && rendererUrl) {
    void window.loadURL(rendererUrl);
  } else {
    void window.loadFile(join(import.meta.dirname, "../renderer/index.html"));
  }
}

ipcMain.handle(IpcChannel.GetAppInfo, (): AppInfo => ({
  name: APP_NAME,
  version: app.getVersion(),
}));

void app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
