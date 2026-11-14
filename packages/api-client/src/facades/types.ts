import type { paths } from "../generated/schema";

/** HTTP-Methoden, die die Spezifikation nutzt. */
type Method = "get" | "post" | "patch";

/** Eine Operation aus `paths`, ausgewählt über Pfad und Methode. */
type Operation<P extends keyof paths, M extends Method> = NonNullable<paths[P][M]>;

/** Pfadparameter einer Operation, direkt aus dem erzeugten Schema. */
export type PathParams<P extends keyof paths, M extends Method> =
  Operation<P, M> extends { parameters: { path: infer T } } ? T : never;

/** Query-Parameter einer Operation, direkt aus dem erzeugten Schema. */
export type QueryParams<P extends keyof paths, M extends Method> =
  Operation<P, M> extends { parameters: { query?: infer T } } ? T : never;

/** JSON-Body einer Operation, direkt aus dem erzeugten Schema. */
export type RequestBody<P extends keyof paths, M extends Method> =
  NonNullable<Operation<P, M>["requestBody"]> extends { content: { "application/json": infer T } }
    ? T
    : never;
