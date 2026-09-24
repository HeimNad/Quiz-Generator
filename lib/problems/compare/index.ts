import { makeId } from "@/lib/random";
import { num, paren, text } from "@/lib/pdf/tokens";
import { defineProblemType, type BaseConfig, type BaseProblem } from "../types";
import { generateUnique, type NumberRange } from "../shared";

export interface CompareConfig extends BaseConfig {
  numberType: "integer" | "decimal";
  range: NumberRange;
  /** Decimal places when numberType is "decimal" */
  places: number;
}

export interface CompareProblem extends BaseProblem {
  left: number;
  right: number;
}

export const compareType = defineProblemType<CompareConfig, CompareProblem>({
  id: "compare",
  label: "比大小",
  defaultConfig: {
    count: 20,
    numberType: "integer",
    range: { min: 0, max: 100 },
    places: 1,
  },
  generate: (config, rng) => {
    const pick = () =>
      config.numberType === "decimal"
        ? rng.float(config.range.min, config.range.max, config.places)
        : rng.int(config.range.min, config.range.max);
    return generateUnique(
      config.count,
      () => {
        const left = pick();
        // Sometimes equal, so "=" shows up too
        const right = rng.chance(0.2) ? left : pick();
        const answer = left > right ? ">" : left < right ? "<" : "=";
        return { id: makeId(rng), left, right, answer };
      },
      (p) => `${p.left}|${p.right}`
    );
  },
  tags: () => ["compare"],
  layout: {
    kind: "grid",
    question: (p) => [num(p.left), paren(), num(p.right)],
    answer: (p) => [text(p.answer)],
  },
});
