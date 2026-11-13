export const APP_NAME = "space-trader-leviathan";

export const IpcChannel = {
  GetAppInfo: "app:get-info",
} as const;

export type IpcChannel = (typeof IpcChannel)[keyof typeof IpcChannel];

export interface AppInfo {
  name: string;
  version: string;
}

export interface LeviathanApi {
  getAppInfo(): Promise<AppInfo>;
}
