import { makeId, type Rng } from "@/lib/random";
import { num, text } from "@/lib/pdf/tokens";
import { defineProblemType, type BaseConfig, type BaseProblem } from "../types";
import { generateUnique, type NumberRange } from "../shared";

export interface RoundingConfig extends BaseConfig {
  numberType: "integer" | "decimal";
  range: NumberRange;
  /** Decimal places of the number being rounded */
  places: number;
  /** Decimal places to round to: 0 = whole number, 1 = tenth, … */
  targets: number[];
}

export interface RoundingProblem extends BaseProblem {
  value: number;
  /** e.g. "tenth", "10" */
  target: string;
}

export const ROUNDING_TARGET_NAMES = ["whole number", "tenth", "hundredth", "thousandth"];

// toFixed first so 1.005 × 100 doesn't round down as 100.4999…
const roundTo = (n: number, factor: number) => Math.round(Number((n * factor).toFixed(8))) / factor;

function makeProblem(config: RoundingConfig, rng: Rng): RoundingProblem | null {
  if (config.numberType === "decimal") {
    const value = rng.float(config.range.min, config.range.max, config.places);
    // Only targets coarser than the number itself make sense; none selected → any of those
    const valid = config.targets.filter((t) => t < config.places);
    const place = rng.pick(valid.length > 0 ? valid : Array.from({ length: config.places }, (_, i) => i));
    return {
      id: makeId(rng),
      value,
      target: ROUNDING_TARGET_NAMES[place] ?? `${place} decimal places`,
      answer: String(roundTo(value, Math.pow(10, place))),
    };
  }
  const value = rng.int(config.range.min, config.range.max);
  const factor = rng.chance(0.5) && config.range.max >= 100 ? 100 : 10;
  return {
    id: makeId(rng),
    value,
    target: String(factor),
    answer: String(Math.round(value / factor) * factor),
  };
}

export const roundingType = defineProblemType<RoundingConfig, RoundingProblem>({
  id: "rounding",
  label: "四舍五入",
  defaultConfig: {
    count: 20,
    numberType: "integer",
    range: { min: 10, max: 1000 },
    places: 2,
    targets: [1],
  },
  generate: (config, rng) =>
    generateUnique(
      config.count,
      () => makeProblem(config, rng),
      (p) => `${p.value}|${p.target}`
    ),
  tags: () => ["round"],
  layout: {
    kind: "grid",
    question: (p) => [text("Round"), num(p.value), text(`to the nearest ${p.target}`)],
    answer: (p) => [num(p.answer)],
  },
});
