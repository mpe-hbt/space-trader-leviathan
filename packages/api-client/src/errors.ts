/**
 * Einheitliches Fehlerobjekt für jede Fehlerantwort (Nicht-2xx) der SpaceTraders-API.
 * Netzwerkfehler (keine HTTP-Antwort) werden nicht hierauf abgebildet.
 */
export class SpaceTradersError extends Error {
  /** HTTP-Status der Antwort; immer gesetzt. */
  readonly status: number;
  /** Fehlercode der API (`error.code`); undefined, wenn die Antwort kein Standardfehler ist. */
  readonly code: number | undefined;
  /** Weitere Angaben der API (`error.data`) oder der Rohbody, wenn kein Standardfehler vorliegt. */
  readonly data: unknown;

  constructor(status: number, code: number | undefined, message: string, data: unknown) {
    super(message);
    this.name = "SpaceTradersError";
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Bildet Status und Body einer Fehlerantwort auf ein {@link SpaceTradersError} ab.
 * Standardform: `{ error: { code: number, message: string, data? } }`.
 */
export function toSpaceTradersError(status: number, body: unknown): SpaceTradersError {
  const error = isRecord(body) ? body.error : undefined;
  if (isRecord(error) && typeof error.code === "number" && typeof error.message === "string") {
    return new SpaceTradersError(status, error.code, error.message, error.data);
  }
  return new SpaceTradersError(status, undefined, `HTTP ${status}`, body);
}
