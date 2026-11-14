import { toSpaceTradersError } from "../errors";

/**
 * Gibt bei 2xx den ganzen JSON-Body zurück (inklusive `meta`) und wirft sonst ein
 * {@link SpaceTradersError}. Netzwerkfehler von fetch werden unverändert weitergereicht.
 */
export async function unwrap<T>(
  request: Promise<{ data?: T; error?: unknown; response: Response }>,
): Promise<T> {
  const { data, error, response } = await request;
  if (!response.ok) {
    throw toSpaceTradersError(response.status, error);
  }
  return data as T;
}
