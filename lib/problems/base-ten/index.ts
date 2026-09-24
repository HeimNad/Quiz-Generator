import { makeId, type Rng } from "@/lib/random";
import { num } from "@/lib/pdf/tokens";
import { defineProblemType, type BaseConfig, type BaseProblem } from "../types";
import { generateUnique, type NumberRange } from "../shared";
import { BASE_TEN_CARD_HEIGHT, drawBaseTenCard } from "./draw";

/** without: ones never add up to 10+; with: they always do; mixed: either */
export type Regrouping = "without" | "with" | "mixed";

export interface BaseTenConfig extends BaseConfig {
  /** Range of each addend (two-digit) */
  range: NumberRange;
  regrouping: Regrouping;
}

export interface BaseTenProblem extends BaseProblem {
  operands: [number, number];
}

function makeProblem(config: BaseTenConfig, rng: Rng): BaseTenProblem | null {
  const min = Math.max(1, config.range.min);
  const max = Math.min(98, config.range.max);
  if (min > max) return null;
  const a = rng.int(min, max);
  const b = rng.int(min, max);
  const sum = a + b;
  // Two place-value columns: the sum has to stay two-digit
  if (sum > 99) return null;
  const regroups = (a % 10) + (b % 10) >= 10;
  if (config.regrouping === "without" && regroups) return null;
  if (config.regrouping === "with" && !regroups) return null;
  return { id: makeId(rng), operands: [a, b], answer: String(sum) };
}

export const baseTenType = defineProblemType<BaseTenConfig, BaseTenProblem>({
  id: "base-ten",
  label: "十位个位加法",
  defaultConfig: {
    count: 10,
    range: { min: 10, max: 89 },
    regrouping: "without",
  },
  generate: (config, rng) =>
    generateUnique(
      config.count,
      () => makeProblem(config, rng),
      (p) => p.operands.join("+"),
      // Most random pairs break the regrouping/sum rules, so allow more tries
      50
    ),
  tags: (config) => ["add", config.regrouping === "without" ? "no regrouping" : "regrouping"],
  layout: {
    kind: "card",
    height: () => BASE_TEN_CARD_HEIGHT,
    draw: drawBaseTenCard,
    answer: (p) => [num(p.answer)],
  },
});
