import { makeId, type Rng } from "@/lib/random";
import { num } from "@/lib/pdf/tokens";
import { defineProblemType, type BaseConfig, type BaseProblem } from "../types";
import { generateUnique, type NumberRange } from "../shared";
import { BASE_TEN_CARD_HEIGHT, drawBaseTenCard } from "./draw";

export type BaseTenOp = "add" | "subtract";

/** without: no carrying/borrowing in the ones; with: always; mixed: either */
export type Regrouping = "without" | "with" | "mixed";

export interface BaseTenConfig extends BaseConfig {
  operations: BaseTenOp[];
  /** Range of both numbers (two-digit) */
  range: NumberRange;
  regrouping: Regrouping;
}

export interface BaseTenProblem extends BaseProblem {
  op: BaseTenOp;
  operands: [number, number];
}

function makeProblem(config: BaseTenConfig, rng: Rng): BaseTenProblem | null {
  const op = rng.pick(config.operations);
  const min = Math.max(1, config.range.min);
  const max = Math.min(99, config.range.max);
  if (min > max) return null;
  let a = rng.int(min, max);
  let b = rng.int(min, max);

  let result: number;
  let regroups: boolean;
  if (op === "add") {
    result = a + b;
    // Two place-value columns: the sum has to stay two-digit
    if (result > 99) return null;
    regroups = (a % 10) + (b % 10) >= 10;
  } else {
    if (a === b) return null;
    if (a < b) [a, b] = [b, a];
    result = a - b;
    regroups = a % 10 < b % 10;
  }

  if (config.regrouping === "without" && regroups) return null;
  if (config.regrouping === "with" && !regroups) return null;
  return { id: makeId(rng), op, operands: [a, b], answer: String(result) };
}

export const baseTenType = defineProblemType<BaseTenConfig, BaseTenProblem>({
  id: "base-ten",
  label: "十位个位加减法",
  defaultConfig: {
    count: 10,
    operations: ["add"],
    range: { min: 10, max: 89 },
    regrouping: "without",
  },
  generate: (config, rng) =>
    generateUnique(
      config.count,
      () => makeProblem(config, rng),
      (p) => `${p.op}|${p.operands.join(",")}`,
      // Most random pairs break the regrouping/sum rules, so allow more tries
      50
    ),
  tags: (config) => [...config.operations, config.regrouping === "without" ? "no regrouping" : "regrouping"],
  layout: {
    kind: "card",
    height: () => BASE_TEN_CARD_HEIGHT,
    draw: drawBaseTenCard,
    answer: (p) => [num(p.answer)],
  },
});
