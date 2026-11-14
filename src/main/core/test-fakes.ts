import type { CoreEvent } from "@leviathan/shared";
import type { EventSink, FileStore, SecretCipher } from "./ports";

/** In-memory fakes for the core ports; used only by tests. */
export class MemoryFileStore implements FileStore {
  readonly files = new Map<string, string>();
  failWrites = false;

  async read(name: string) {
    return this.files.get(name);
  }
  async write(name: string, text: string) {
    if (this.failWrites) throw new Error("disk full");
    this.files.set(name, text);
  }
  async append(name: string, text: string) {
    if (this.failWrites) throw new Error("disk full");
    this.files.set(name, (this.files.get(name) ?? "") + text);
  }
  async size(name: string) {
    return Buffer.byteLength(this.files.get(name) ?? "");
  }
  async rename(from: string, to: string) {
    const text = this.files.get(from);
    if (text === undefined) throw new Error("missing");
    this.files.set(to, text);
    this.files.delete(from);
  }
}

/** Reversible fake encryption that never equals the plaintext. */
export class FakeCipher implements SecretCipher {
  available = true;
  isAvailable() {
    return this.available;
  }
  encrypt(plain: string) {
    return Buffer.from(`enc:${[...plain].reverse().join("")}`).toString("base64");
  }
  decrypt(base64: string) {
    const text = Buffer.from(base64, "base64").toString();
    if (!text.startsWith("enc:")) throw new Error("cannot decrypt");
    return [...text.slice(4)].reverse().join("");
  }
}

export class RecordingEventSink implements EventSink {
  readonly events: CoreEvent[] = [];
  send(event: CoreEvent) {
    this.events.push(event);
  }
}

export function fakePorts() {
  return {
    cipher: new FakeCipher(),
    files: new MemoryFileStore(),
    events: new RecordingEventSink(),
  };
}
