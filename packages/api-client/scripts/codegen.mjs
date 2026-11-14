// Erzeugt packages/api-client/src/generated/schema.d.ts aus der gepinnten Spezifikation.
// Aufruf: node packages/api-client/scripts/codegen.mjs [--check]
// Mit --check wird nichts geschrieben, sondern nur verglichen (Exit-Code 1 bei Abweichung).
// Läuft offline: Die Spezifikation wird lokal gelesen, alle $ref sind darin aufgelöst.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import openapiTS, { astToString } from "openapi-typescript";

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const specPath = resolve(packageDir, "spec/SpaceTraders.json");
const outputPath = resolve(packageDir, "src/generated/schema.d.ts");

const HEADER = [
  "/**",
  " * Diese Datei ist erzeugt. Nicht von Hand ändern.",
  " * Quelle: packages/api-client/spec/SpaceTraders.json",
  " * Neu erzeugen: npm run api:generate",
  " */",
  "",
  "",
].join("\n");

const normalize = (text) => text.replace(/\r\n/g, "\n");

async function generate() {
  const spec = JSON.parse(readFileSync(specPath, "utf8"));
  const ast = await openapiTS(spec, {
    alphabetize: false,
    exportType: false,
    immutable: false,
    enum: false,
    defaultNonNullable: true,
    additionalProperties: false,
    emptyObjectsUnknown: false,
    pathParamsAsTypes: false,
    rootTypes: false,
    silent: true,
  });
  return normalize(HEADER + astToString(ast));
}

const content = await generate();

if (process.argv.includes("--check")) {
  const current = existsSync(outputPath) ? normalize(readFileSync(outputPath, "utf8")) : undefined;
  if (current !== content) {
    console.error(
      current === undefined
        ? "api:check: src/generated/schema.d.ts fehlt. Bitte `npm run api:generate` ausführen."
        : "api:check: src/generated/schema.d.ts passt nicht zur gepinnten Spezifikation. Bitte `npm run api:generate` ausführen.",
    );
    process.exit(1);
  }
  console.log("api:check: Erzeugte Typen passen zur gepinnten Spezifikation.");
} else {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, content);
  console.log("api:generate: src/generated/schema.d.ts geschrieben.");
}
