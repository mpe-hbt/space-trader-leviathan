import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";
import {
  IpcChannel,
  type AgentResult,
  type AgentsStatus,
  type AppInfo,
  type CoreEvent,
  type FactionsResult,
  type GameStateSnapshot,
  type LeviathanApi,
  type SaveResult,
  type SettingsStatus,
} from "@leviathan/shared";

const api: LeviathanApi = {
  getAppInfo: () => ipcRenderer.invoke(IpcChannel.GetAppInfo) as Promise<AppInfo>,
  getSettings: () => ipcRenderer.invoke(IpcChannel.GetSettings) as Promise<SettingsStatus>,
  setSecret: (name, value) =>
    ipcRenderer.invoke(IpcChannel.SetSecret, name, value) as Promise<SaveResult>,
  clearSecret: (name) => ipcRenderer.invoke(IpcChannel.ClearSecret, name) as Promise<SaveResult>,
  getAgents: () => ipcRenderer.invoke(IpcChannel.GetAgents) as Promise<AgentsStatus>,
  getFactions: () => ipcRenderer.invoke(IpcChannel.GetFactions) as Promise<FactionsResult>,
  registerAgent: (input) =>
    ipcRenderer.invoke(IpcChannel.RegisterAgent, input) as Promise<AgentResult>,
  importAgentToken: (token) =>
    ipcRenderer.invoke(IpcChannel.ImportAgentToken, token) as Promise<AgentResult>,
  selectAgent: (symbol) =>
    ipcRenderer.invoke(IpcChannel.SelectAgent, symbol) as Promise<AgentResult>,
  removeAgent: (symbol) =>
    ipcRenderer.invoke(IpcChannel.RemoveAgent, symbol) as Promise<AgentResult>,
  checkAgents: (symbol) =>
    ipcRenderer.invoke(IpcChannel.CheckAgents, symbol) as Promise<AgentResult>,
  getGameState: () => ipcRenderer.invoke(IpcChannel.GetGameState) as Promise<GameStateSnapshot>,
  onCoreEvent(listener) {
    // Pass only the payload; the IpcRendererEvent never reaches the renderer.
    const wrapped = (_event: IpcRendererEvent, payload: CoreEvent) => listener(payload);
    ipcRenderer.on(IpcChannel.CoreEvent, wrapped);
    return () => {
      ipcRenderer.removeListener(IpcChannel.CoreEvent, wrapped);
    };
  },
};

contextBridge.exposeInMainWorld("leviathan", api);
