import createClient from "openapi-fetch";
import { createAgentsFacade } from "./facades/agents";
import { createContractsFacade } from "./facades/contracts";
import { createDataFacade } from "./facades/data";
import { createFactionsFacade } from "./facades/factions";
import { createFleetFacade } from "./facades/fleet";
import { createGlobalFacade } from "./facades/global";
import { createSystemsFacade } from "./facades/systems";
import type { paths } from "./generated/schema";
import { SPACETRADERS_API_BASE_URL } from "./index";

export interface SpaceTradersClientOptions {
  /** Basis-URL der API; standardmäßig {@link SPACETRADERS_API_BASE_URL}. */
  baseUrl?: string;
  /** Agent-Token für alle Endpunkte außer `register`. */
  agentToken?: string;
  /** Account-Token, nur für `register`. */
  accountToken?: string;
  /** Eigene fetch-Funktion; hierüber hängt sich die Request-Queue ein (#6). */
  fetch?: typeof fetch;
}

/** Endpunkt, der den Account-Token statt des Agent-Tokens braucht. */
const ACCOUNT_TOKEN_PATH = "/register";

/**
 * Erzeugt den SpaceTraders-Client mit je einer Fassade pro Tag der Spezifikation.
 * Jede Methode gibt bei Erfolg den ganzen JSON-Body zurück und wirft sonst einen
 * {@link SpaceTradersError}.
 */
export function createSpaceTradersClient(options: SpaceTradersClientOptions = {}) {
  const { baseUrl = SPACETRADERS_API_BASE_URL, agentToken, accountToken } = options;
  const api = createClient<paths>({
    baseUrl,
    ...(options.fetch ? { fetch: options.fetch } : {}),
  });

  api.use({
    onRequest({ request, schemaPath }) {
      const token = schemaPath === ACCOUNT_TOKEN_PATH ? accountToken : agentToken;
      if (token) {
        request.headers.set("Authorization", `Bearer ${token}`);
      }
      return request;
    },
  });

  return {
    global: createGlobalFacade(api),
    agents: createAgentsFacade(api),
    fleet: createFleetFacade(api),
    systems: createSystemsFacade(api),
    contracts: createContractsFacade(api),
    factions: createFactionsFacade(api),
    data: createDataFacade(api),
  };
}

export type SpaceTradersClient = ReturnType<typeof createSpaceTradersClient>;
