import { mkdir, appendFile, readFile, rename, stat, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { app, safeStorage, type BrowserWindow } from "electron";
import { IpcChannel } from "@leviathan/shared";
import type { CorePorts, EventSink, FileStore, SecretCipher } from "../core";

/** Thin layer between the core and Electron; contains no logic of its own. */
export function createElectronPorts(getWindow: () => BrowserWindow | null): CorePorts {
  return {
    cipher: createSafeStorageCipher(),
    files: createUserDataFileStore(app.getPath("userData")),
    events: createWebContentsSink(getWindow),
  };
}

function createSafeStorageCipher(): SecretCipher {
  return {
    isAvailable() {
      if (!safeStorage.isEncryptionAvailable()) return false;
      // "basic_text" is practically plaintext; ADR-01 requires the OS key store.
      if (process.platform === "linux") {
        return safeStorage.getSelectedStorageBackend() !== "basic_text";
      }
      return true;
    },
    encrypt: (plain) => safeStorage.encryptString(plain).toString("base64"),
    decrypt: (base64) => safeStorage.decryptString(Buffer.from(base64, "base64")),
  };
}

function createUserDataFileStore(root: string): FileStore {
  const resolve = (name: string): string => {
    const relative = normalize(name);
    if (isAbsolute(relative) || relative.startsWith("..")) {
      throw new Error(`Invalid file name: ${name}`);
    }
    return join(root, relative);
  };
  const ensureDir = (path: string) => mkdir(dirname(path), { recursive: true });

  return {
    async read(name) {
      try {
        return await readFile(resolve(name), "utf8");
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
        throw error;
      }
    },
    async write(name, text) {
      const path = resolve(name);
      await ensureDir(path);
      await writeFile(path, text, { encoding: "utf8", mode: 0o600 });
    },
    async append(name, text) {
      const path = resolve(name);
      await ensureDir(path);
      await appendFile(path, text, "utf8");
    },
    async size(name) {
      try {
        return (await stat(resolve(name))).size;
      } catch {
        return 0;
      }
    },
    async rename(from, to) {
      await rename(resolve(from), resolve(to));
    },
  };
}

function createWebContentsSink(getWindow: () => BrowserWindow | null): EventSink {
  return {
    send(event) {
      const window = getWindow();
      if (!window || window.isDestroyed() || window.webContents.isDestroyed()) return;
      window.webContents.send(IpcChannel.CoreEvent, event);
    },
  };
}
