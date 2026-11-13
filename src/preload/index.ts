import { contextBridge, ipcRenderer } from "electron";
import { IpcChannel, type AppInfo, type LeviathanApi } from "@leviathan/shared";

const api: LeviathanApi = {
  getAppInfo: () => ipcRenderer.invoke(IpcChannel.GetAppInfo) as Promise<AppInfo>,
};

contextBridge.exposeInMainWorld("leviathan", api);
