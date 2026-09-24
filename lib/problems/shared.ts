import type { BaseProblem } from "./types";

export interface NumberRange {
  min: number;
  max: number;
  /** When true the boundary value itself is never used */
  minExclusive?: boolean;
  maxExclusive?: boolean;
}

/** Range bounds after applying exclusive flags; `unit` is the smallest step (1, 0.1, …) */
export function effectiveRange(range: NumberRange, unit = 1): [number, number] {
  const min = range.minExclusive ? range.min + unit : range.min;
  const max = range.maxExclusive ? range.max - unit : range.max;
  return [min, max];
}

/**
 * Calls `make` until `count` distinct problems exist or attempts run out
 * (a narrow range may not have enough distinct problems). `make` may return
 * null to reject a candidate.
 */
export function generateUnique<P extends BaseProblem>(
  count: number,
  make: () => P | null,
  key: (p: P) => string,
  attemptsPerProblem = 10
): P[] {
  const problems: P[] = [];
  const seen = new Set<string>();
  for (let attempts = 0; problems.length < count && attempts < count * attemptsPerProblem; attempts++) {
    let p: P | null = null;
    try {
      p = make();
    } catch {
      // Invalid candidate (e.g. zero denominator); try again
    }
    if (!p) continue;
    const k = key(p);
    if (seen.has(k)) continue;
    seen.add(k);
    problems.push(p);
  }
  return problems;
}

/** Decimal answers drop trailing zeros: 1.50 → "1.5" */
export function formatNumber(n: number, places: number): string {
  return places > 0 ? n.toFixed(places).replace(/\.?0+$/, "") : String(Math.round(n));
}

/** Toggle a value in a list, keeping at least one item */
export function toggleInList<T>(list: readonly T[], value: T, on: boolean): T[] {
  const next = on ? [...list.filter((v) => v !== value), value] : list.filter((v) => v !== value);
  return next.length > 0 ? next : [...list];
}
