// Lädt die gebündelte SpaceTraders-Spezifikation herunter und legt sie unverändert ab.
// Aufruf: npm run api:update-spec (braucht Netz). Das Ergebnis vor dem Commit prüfen.
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SPEC_URL = "https://spacetraders.io/SpaceTraders.json";
const specPath = resolve(dirname(fileURLToPath(import.meta.url)), "../spec/SpaceTraders.json");

function fail(message) {
  console.error(`api:update-spec: ${message}`);
  process.exit(1);
}

const response = await fetch(SPEC_URL);
if (!response.ok) {
  fail(`Download fehlgeschlagen (HTTP ${response.status}).`);
}
const text = await response.text();

let spec;
try {
  spec = JSON.parse(text);
} catch {
  fail("Die Antwort ist kein gültiges JSON.");
}
if (typeof spec?.openapi !== "string" || !spec.openapi.startsWith("3.")) {
  fail("Das Feld `openapi` beginnt nicht mit `3.`; die Datei wurde nicht geschrieben.");
}
const version = spec.info?.version;
if (typeof version !== "string" || version === "") {
  fail("Das Feld `info.version` fehlt; die Datei wurde nicht geschrieben.");
}

writeFileSync(specPath, text);
console.log(`api:update-spec: Spezifikation in Version ${version} gespeichert.`);
console.log(
  "Als Nächstes SPACETRADERS_SPEC_VERSION in packages/api-client/src/index.ts anpassen und `npm run api:generate` ausführen.",
);
