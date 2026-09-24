/**
 * Seedable random source. Generators take an Rng instead of calling
 * Math.random, so a worksheet can be reproduced from its seed and tests
 * are deterministic.
 */
export interface Rng {
  /** Float in [0, 1) */
  next(): number;
  /** Integer in [min, max], both inclusive */
  int(min: number, max: number): number;
  /** Number in [min, max] with exactly `places` decimal places */
  float(min: number, max: number, places: number): number;
  pick<T>(items: readonly T[]): T;
  chance(p: number): boolean;
  shuffle<T>(items: readonly T[]): T[];
}

/** mulberry32 — small, fast, good enough for worksheets */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRng(seed: number = randomSeed()): Rng {
  const next = mulberry32(seed);
  const int = (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min;
  return {
    next,
    int,
    float(min, max, places) {
      const factor = Math.pow(10, places);
      const n = int(Math.ceil(min * factor), Math.floor(max * factor)) / factor;
      return parseFloat(n.toFixed(places));
    },
    pick: (items) => items[Math.floor(next() * items.length)],
    chance: (p) => next() < p,
    shuffle(items) {
      const out = [...items];
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    },
  };
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

/** Short id for React keys; not security sensitive */
export function makeId(rng: Rng): string {
  return Math.floor(rng.next() * 2 ** 40).toString(36);
}
