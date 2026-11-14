import type { CoreEvent } from "@leviathan/shared";

/** Encrypts secrets with the key store of the operating system. */
export interface SecretCipher {
  isAvailable(): boolean;
  /** Returns the ciphertext as base64. */
  encrypt(plain: string): string;
  decrypt(base64: string): string;
}

/** Text files; names are relative to the user data folder, e.g. `logs/leviathan.log`. */
export interface FileStore {
  read(name: string): Promise<string | undefined>;
  write(name: string, text: string): Promise<void>;
  append(name: string, text: string): Promise<void>;
  /** Size in bytes; 0 if the file does not exist. */
  size(name: string): Promise<number>;
  rename(from: string, to: string): Promise<void>;
}

/** Sends events from the core to the renderer. */
export interface EventSink {
  send(event: CoreEvent): void;
}

export interface CorePorts {
  cipher: SecretCipher;
  files: FileStore;
  events: EventSink;
}
