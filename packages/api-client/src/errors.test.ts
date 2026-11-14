import { describe, expect, it } from "vitest";
import { SpaceTradersError, toSpaceTradersError } from "./errors";

describe("toSpaceTradersError", () => {
  it("übernimmt code, message und data aus einem Standardfehler", () => {
    const body = {
      error: {
        code: 4214,
        message: "Ship is currently in-transit.",
        data: { secondsToArrival: 42 },
      },
    };
    const error = toSpaceTradersError(400, body);
    expect(error).toBeInstanceOf(SpaceTradersError);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("SpaceTradersError");
    expect(error.status).toBe(400);
    expect(error.code).toBe(4214);
    expect(error.message).toBe("Ship is currently in-transit.");
    expect(error.data).toEqual({ secondsToArrival: 42 });
  });

  it("lässt data undefined, wenn der Standardfehler kein data hat", () => {
    const error = toSpaceTradersError(404, { error: { code: 404, message: "Not found" } });
    expect(error.status).toBe(404);
    expect(error.code).toBe(404);
    expect(error.message).toBe("Not found");
    expect(error.data).toBeUndefined();
  });

  it("bildet einen leeren Body (undefined) ab", () => {
    const error = toSpaceTradersError(502, undefined);
    expect(error.status).toBe(502);
    expect(error.code).toBeUndefined();
    expect(error.message).toBe("HTTP 502");
    expect(error.data).toBeUndefined();
  });

  it("bildet einen Text-Body ab und gibt ihn als data zurück", () => {
    const error = toSpaceTradersError(503, "Service Unavailable");
    expect(error.code).toBeUndefined();
    expect(error.message).toBe("HTTP 503");
    expect(error.data).toBe("Service Unavailable");
  });

  it("bildet JSON ohne Feld error ab", () => {
    const body = { message: "something else" };
    const error = toSpaceTradersError(400, body);
    expect(error.code).toBeUndefined();
    expect(error.message).toBe("HTTP 400");
    expect(error.data).toBe(body);
  });

  it("bildet einen Fehler ab, dessen code keine Zahl ist", () => {
    const body = { error: { code: "4214", message: "Ship is currently in-transit." } };
    const error = toSpaceTradersError(400, body);
    expect(error.code).toBeUndefined();
    expect(error.message).toBe("HTTP 400");
    expect(error.data).toBe(body);
  });

  it("bildet einen Fehler ohne message ab", () => {
    const body = { error: { code: 4000 } };
    const error = toSpaceTradersError(409, body);
    expect(error.code).toBeUndefined();
    expect(error.message).toBe("HTTP 409");
    expect(error.data).toBe(body);
  });

  it("bildet null und error: null ab", () => {
    expect(toSpaceTradersError(400, null).message).toBe("HTTP 400");
    expect(toSpaceTradersError(400, { error: null }).code).toBeUndefined();
  });

  it("übernimmt einen Rate-Limit-Fehler (429)", () => {
    const body = {
      error: {
        code: 429,
        message: "You have reached your API limit.",
        data: { type: "IP-based limits", retryAfter: 1 },
      },
    };
    const error = toSpaceTradersError(429, body);
    expect(error.status).toBe(429);
    expect(error.code).toBe(429);
    expect(error.data).toEqual({ type: "IP-based limits", retryAfter: 1 });
  });

  it("bildet einen Serverfehler (500) mit Text-Body ab", () => {
    const error = toSpaceTradersError(500, "Internal Server Error");
    expect(error.status).toBe(500);
    expect(error.code).toBeUndefined();
    expect(error.message).toBe("HTTP 500");
    expect(error.data).toBe("Internal Server Error");
  });
});
