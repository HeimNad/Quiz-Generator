import { makeId, type Rng } from "@/lib/random";
import { frac, line, num, op, text, type Token } from "@/lib/pdf/tokens";
import { defineProblemType, type BaseConfig, type BaseProblem } from "../types";
import { generateUnique, type NumberRange } from "../shared";

export type PercentKind = "percent-of" | "fraction-to-percent" | "decimal-to-percent";

export interface PercentConfig extends BaseConfig {
  kinds: PercentKind[];
  /** Range of N in "X% of N" */
  range: NumberRange;
  percentages: number[];
  /** N is always a multiple of 10 */
  roundBase: boolean;
  /** Decimal places in decimal-to-percent */
  places: number;
}

export type PercentProblem = BaseProblem &
  (
    | { kind: "percent-of"; percent: number; base: number }
    | { kind: "fraction-to-percent"; numerator: number; denominator: number }
    | { kind: "decimal-to-percent"; decimal: string }
  );

export const PERCENT_CHOICES = [5, 10, 15, 20, 25, 30, 50, 60, 75, 90];

// Denominators that divide 100 evenly → whole-number percentages
const PERCENT_DENOMINATORS = [2, 4, 5, 10, 20, 25];

function gcd(a: number, b: number): number {
  while (b > 0) [a, b] = [b, a % b];
  return a;
}

const lcm = (a: number, b: number) => (a * b) / gcd(a, b);

function makeProblem(config: PercentConfig, rng: Rng): PercentProblem | null {
  const kind = rng.pick(config.kinds);
  const id = makeId(rng);

  if (kind === "percent-of") {
    const percent = rng.pick(config.percentages);
    // N × pct / 100 must be whole → N is a multiple of 100 / gcd(100, pct)
    const divisor = 100 / gcd(100, percent);
    const step = config.roundBase ? lcm(divisor, 10) : divisor;
    const minMult = Math.ceil((config.range.min || 1) / step);
    const maxMult = Math.floor((config.range.max || 200) / step);
    if (maxMult < minMult) return null;
    const base = rng.int(minMult, maxMult) * step;
    return { id, kind, percent, base, answer: String((base * percent) / 100) };
  }

  if (kind === "fraction-to-percent") {
    const denominator = rng.pick(PERCENT_DENOMINATORS);
    const numerator = rng.int(1, denominator - 1);
    return { id, kind, numerator, denominator, answer: `${(numerator / denominator) * 100}%` };
  }

  const places = config.places || 1;
  const factor = Math.pow(10, places);
  const raw = rng.int(1, factor - 1);
  return { id, kind, decimal: (raw / factor).toFixed(places), answer: `${raw * (100 / factor)}%` };
}

function question(p: PercentProblem): Token[] {
  switch (p.kind) {
    case "percent-of":
      return [num(`${p.percent}%`), text("of"), num(p.base), op("="), line()];
    case "fraction-to-percent":
      return [frac(p.numerator, p.denominator), op("="), line("%")];
    case "decimal-to-percent":
      return [num(p.decimal), op("="), line("%")];
  }
}

export const percentType = defineProblemType<PercentConfig, PercentProblem>({
  id: "percent",
  label: "百分数",
  defaultConfig: {
    count: 30,
    kinds: ["percent-of", "fraction-to-percent", "decimal-to-percent"],
    range: { min: 10, max: 200 },
    percentages: [10, 20, 25, 50],
    roundBase: true,
    places: 1,
  },
  generate: (config, rng) =>
    generateUnique(
      config.count,
      () => makeProblem(config, rng),
      (p) => `${p.kind}|${JSON.stringify(question(p))}`
    ),
  tags: (config) => config.kinds,
  layout: {
    kind: "grid",
    question,
    answer: (p) => [num(p.answer)],
  },
});
