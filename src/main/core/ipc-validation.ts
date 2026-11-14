import { SECRET_NAMES, type SecretName } from "@leviathan/shared";

export const MAX_SECRET_LENGTH = 4096;

// Whitespace or control characters are never part of a key or token.
// eslint-disable-next-line no-control-regex
const FORBIDDEN_CHARACTERS = /[\s\u0000-\u001f\u007f-\u009f]/;

export function parseSecretName(input: unknown): SecretName | undefined {
  return SECRET_NAMES.find((name) => name === input);
}

export function parseSecretValue(input: unknown): string | undefined {
  if (typeof input !== "string") return undefined;
  const value = input.trim();
  if (value.length === 0 || value.length > MAX_SECRET_LENGTH) return undefined;
  if (FORBIDDEN_CHARACTERS.test(value)) return undefined;
  return value;
}
