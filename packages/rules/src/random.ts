/** Inteiro aleatório em [0, max). Injetável para testes determinísticos. */
export type Rng = (max: number) => number;

declare const crypto: { getRandomValues<T extends Uint32Array>(array: T): T };

/** RNG criptográfico sem viés (rejection sampling). Disponível em Workers e Node 19+. */
export const secureRandomInt: Rng = (max) => {
  if (!Number.isInteger(max) || max <= 0 || max > 2 ** 32) throw new RangeError(`max inválido: ${max}`);
  const limit = 2 ** 32 - (2 ** 32 % max);
  const buf = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(buf);
    const n = buf[0]!;
    if (n < limit) return n % max;
  }
};

/** Fisher–Yates sobre uma cópia. */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = rng(i + 1);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem 0/O/1/I
export const ROOM_CODE_LENGTH = 6;

export function generateRoomCode(rng: Rng): string {
  let code = "";
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) code += CODE_ALPHABET[rng(CODE_ALPHABET.length)];
  return code;
}

export function isRoomCode(value: string): boolean {
  return value.length === ROOM_CODE_LENGTH && [...value].every((c) => CODE_ALPHABET.includes(c));
}
