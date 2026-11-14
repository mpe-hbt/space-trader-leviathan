import { Menu, Tray, nativeImage, type NativeImage } from "electron";
import { APP_NAME } from "@leviathan/shared";

export interface TrayActions {
  showWindow(): void;
  quit(): void;
}

/** Tray-Modus: the app keeps running in the tray after the window is closed. */
export function createTray(actions: TrayActions): Tray {
  const tray = new Tray(createTrayIcon());
  tray.setToolTip(APP_NAME);
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "Fenster öffnen", click: () => actions.showWindow() },
      { type: "separator" },
      { label: "Beenden", click: () => actions.quit() },
    ]),
  );
  tray.on("click", () => actions.showWindow());
  return tray;
}

// Placeholder until a real icon file exists: a filled circle, built in code.
function createTrayIcon(): NativeImage {
  const image = nativeImage.createFromBitmap(circleBitmap(16), { width: 16, height: 16 });
  image.addRepresentation({ scaleFactor: 2, width: 32, height: 32, buffer: circleBitmap(32) });
  return image;
}

/** BGRA pixels of a cyan circle on a transparent background. */
function circleBitmap(size: number): Buffer {
  const buffer = Buffer.alloc(size * size * 4);
  const center = (size - 1) / 2;
  const radius = size / 2 - 0.5;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (Math.hypot(x - center, y - center) > radius) continue;
      const offset = (y * size + x) * 4;
      buffer[offset] = 0xd4; // blue
      buffer[offset + 1] = 0xb8; // green
      buffer[offset + 2] = 0x22; // red
      buffer[offset + 3] = 0xff; // alpha
    }
  }
  return buffer;
}
