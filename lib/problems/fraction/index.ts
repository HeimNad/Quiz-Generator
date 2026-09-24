import { Fraction } from "@/lib/fraction";
import type { Rng } from "@/lib/random";
import { makeId } from "@/lib/random";
import { frac, op, plainText, type Token } from "@/lib/pdf/tokens";
import { defineProblemType, type BaseConfig, type BaseProblem } from "../types";
import { generateUnique, type NumberRange } from "../shared";
import { ARITH_OPS, OP_SYMBOL, type ArithOp } from "../arithmetic";

export type FractionRule = "none" | "integer-fraction" | "related-denominators" | "mixed-ops-3";

export interface FractionConfig extends BaseConfig {
  operations: ArithOp[];
  minDenominator: number;
  maxDenominator: number;
  /** Whole numbers used by the integer-fraction rule */
  intRange: NumberRange;
  allowNegative: boolean;
  rule: FractionRule;
}

interface FracValue {
  n: number;
  d: number;
}

export interface FractionProblem extends BaseProblem {
  terms: FracValue[];
  ops: ArithOp[];
  result: FracValue;
}

const value = (f: Fraction): FracValue => ({ n: f.numerator, d: f.denominator });

function apply(a: Fraction, opName: ArithOp, b: Fraction): Fraction {
  switch (opName) {
    case "add":
      return a.add(b);
    case "subtract":
      return a.subtract(b);
    case "multiply":
      return a.multiply(b);
    case "divide":
      return a.divide(b);
  }
}

function build(rng: Rng, terms: Fraction[], ops: ArithOp[], result: Fraction): FractionProblem {
  return { id: makeId(rng), terms: terms.map(value), ops, result: value(result), answer: result.toString() };
}

export function generateFractionProblem(config: FractionConfig, rng: Rng): FractionProblem | null {
  const maxDenom = config.maxDenominator;
  const minDenom = Math.min(config.minDenominator, maxDenom);
  const randomFraction = () => new Fraction(rng.int(1, maxDenom * 2), rng.int(minDenom, maxDenom));
  const randomWhole = () => new Fraction(rng.int(config.intRange.min, config.intRange.max), 1);

  if (config.rule === "mixed-ops-3") {
    const terms = [randomFraction(), randomFraction(), randomFraction()];
    const ops: ArithOp[] = [rng.chance(0.5) ? "add" : "subtract", rng.chance(0.5) ? "add" : "subtract"];
    const step1 = apply(terms[0], ops[0], terms[1]);
    const result = apply(step1, ops[1], terms[2]);
    if (!config.allowNegative && (step1.numerator < 0 || result.numerator < 0)) return null;
    return build(rng, terms, ops, result);
  }

  const opName = rng.pick(config.operations);
  let f1: Fraction;
  let f2: Fraction;

  if (config.rule === "integer-fraction" && opName === "multiply") {
    [f1, f2] = rng.chance(0.5) ? [randomWhole(), randomFraction()] : [randomFraction(), randomWhole()];
  } else if (config.rule === "integer-fraction" && opName === "divide") {
    [f1, f2] = [randomFraction(), randomWhole()];
  } else if (config.rule === "related-denominators" && (opName === "add" || opName === "subtract")) {
    // One denominator is a multiple of the other (e.g. 1/3 + 1/6)
    const d1 = rng.int(2, Math.max(2, Math.floor(maxDenom / 2)));
    const multiplier = rng.int(2, Math.max(2, Math.floor(maxDenom / d1)));
    const d2 = d1 * multiplier;
    f1 = new Fraction(rng.int(1, d1 * 2), d1);
    f2 = new Fraction(rng.int(1, d2 * 2), d2);
    if (rng.chance(0.5)) [f1, f2] = [f2, f1];
  } else {
    [f1, f2] = [randomFraction(), randomFraction()];
  }

  if (opName === "subtract" && !config.allowNegative && f1.subtract(f2).numerator < 0) {
    [f1, f2] = [f2, f1];
  }
  return build(rng, [f1, f2], [opName], apply(f1, opName, f2));
}

function question(p: FractionProblem): Token[] {
  const tokens: Token[] = [frac(p.terms[0].n, p.terms[0].d)];
  p.ops.forEach((o, i) => tokens.push(op(OP_SYMBOL[o]), frac(p.terms[i + 1].n, p.terms[i + 1].d)));
  return [...tokens, op("=")];
}

export const fractionType = defineProblemType<FractionConfig, FractionProblem>({
  id: "fraction",
  label: "分数运算",
  defaultConfig: {
    count: 20,
    operations: ARITH_OPS,
    minDenominator: 2,
    maxDenominator: 10,
    intRange: { min: 1, max: 20 },
    allowNegative: false,
    rule: "none",
  },
  generate: (config, rng) =>
    generateUnique(
      config.count,
      () => generateFractionProblem(config, rng),
      (p) => plainText(question(p))
    ),
  tags: (config) => config.operations,
  layout: {
    kind: "grid",
    question,
    answer: (p) => [frac(p.result.n, p.result.d)],
  },
});
