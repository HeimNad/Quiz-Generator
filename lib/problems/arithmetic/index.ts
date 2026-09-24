import type { Rng } from "@/lib/random";
import { makeId } from "@/lib/random";
import { line, num, op, plainText, type Token } from "@/lib/pdf/tokens";
import { defineProblemType, type BaseConfig, type BaseProblem } from "../types";
import { effectiveRange, formatNumber, generateUnique, type NumberRange } from "../shared";

export type ArithOp = "add" | "subtract" | "multiply" | "divide";

export const ARITH_OPS: ArithOp[] = ["add", "subtract", "multiply", "divide"];

export const OP_SYMBOL: Record<ArithOp, string> = {
  add: "+",
  subtract: "-",
  multiply: "×",
  divide: "÷",
};

export interface PlacesRange {
  min: number;
  max: number;
}

export interface ArithmeticConfig extends BaseConfig {
  numberType: "integer" | "decimal";
  operations: ArithOp[];
  /** Operations the editor offers for this preset */
  allowedOperations: ArithOp[];
  range: NumberRange;
  /** Optional override for the second operand; unset bounds follow `range` */
  range2: Partial<NumberRange>;
  places: PlacesRange;
  /** Use `places2` for the right operand instead of `places` */
  separatePlaces: boolean;
  places2: PlacesRange;
  allowNegative: boolean;
  forceCarrying: boolean;
  forceBorrowing: boolean;
  /** Decimals: × and ÷ by a whole number, − without borrowing */
  decimalSimpleMode: boolean;
  /** "missing-number" prints 5 + ___ = 12 */
  format: "standard" | "missing-number";
  /** Round hundred minus a two-digit number, e.g. 300 - 47 */
  specialRule: "none" | "round-hundred";
  /** Fixed minuend for the round-hundred rule */
  fixedFirstOperand?: number;
  displayFormat: "horizontal" | "vertical";
}

export interface ArithmeticProblem extends BaseProblem {
  operands: [number, number];
  op: ArithOp;
  /** Formatted value of the full expression */
  result: string;
  /** Which operand is the blank in missing-number problems */
  blank: 0 | 1 | null;
}

// Check if a + b involves carrying (base 10)
function hasCarrying(a: number, b: number): boolean {
  let carry = 0;
  let tempA = Math.abs(a);
  let tempB = Math.abs(b);
  while (tempA > 0 || tempB > 0) {
    const digitA = tempA % 10;
    const digitB = tempB % 10;
    if (digitA + digitB + carry >= 10) return true;
    carry = Math.floor((digitA + digitB + carry) / 10);
    tempA = Math.floor(tempA / 10);
    tempB = Math.floor(tempB / 10);
  }
  return false;
}

// Check if a - b involves borrowing (assuming a >= b >= 0)
function hasBorrowing(a: number, b: number): boolean {
  let tempA = a;
  let tempB = b;
  while (tempA > 0 || tempB > 0) {
    if (tempA % 10 < tempB % 10) return true;
    tempA = Math.floor(tempA / 10);
    tempB = Math.floor(tempB / 10);
  }
  return false;
}

// No borrowing in any decimal place (e.g. 3.5 - 1.2 ✓, 5.0 - 2.6 ✗)
function hasDecimalBorrowing(a: number, b: number, places: number): boolean {
  const factor = Math.pow(10, places);
  let aDec = Math.round(a * factor) % factor;
  let bDec = Math.round(b * factor) % factor;
  for (let i = 0; i < places; i++) {
    if (aDec % 10 < bDec % 10) return true;
    aDec = Math.floor(aDec / 10);
    bDec = Math.floor(bDec / 10);
  }
  return false;
}

function pickPlaces(range: PlacesRange, rng: Rng): number {
  return range.max > range.min ? rng.int(range.min, range.max) : range.min;
}

function build(
  rng: Rng,
  operands: [number, number],
  opName: ArithOp,
  result: number,
  places: number,
  blank: 0 | 1 | null = null
): ArithmeticProblem {
  const answer = blank === null ? result : operands[blank];
  return {
    id: makeId(rng),
    operands,
    op: opName,
    result: formatNumber(result, places),
    blank,
    answer: formatNumber(answer, places),
  };
}

function roundHundredProblem(config: ArithmeticConfig, rng: Rng): ArithmeticProblem {
  let num1: number;
  if (config.fixedFirstOperand) {
    num1 = config.fixedFirstOperand;
  } else {
    // A multiple of 100 within range (min 100)
    const minH = Math.max(1, Math.ceil(config.range.min / 100));
    let maxH = Math.floor(config.range.max / 100);
    if (maxH < minH) maxH = minH;
    num1 = rng.int(minH, maxH) * 100;
  }
  const num2 = rng.int(10, 99);
  return build(rng, [num1, num2], "subtract", num1 - num2, 0);
}

function divideProblem(config: ArithmeticConfig, rng: Rng, places1: number, places: number): ArithmeticProblem | null {
  const maxNumber = config.range.max || 20;

  if (config.numberType === "integer") {
    const min = config.range.min || 1;
    let num2 = rng.int(min, config.range.max / 2);
    if (num2 === 0) num2 = 1;
    const multiplier = rng.int(min, Math.floor(config.range.max / num2));
    return build(rng, [num2 * multiplier, num2], "divide", multiplier, 0);
  }

  if (config.decimalSimpleMode) {
    // decimal ÷ whole number = decimal (e.g. 3.6 ÷ 3 = 1.2); left operand keeps its own places
    const factor1 = Math.pow(10, places1);
    const maxAnsInt = Math.floor(maxNumber * factor1);
    if (maxAnsInt < 1) return null;
    const answerInt = rng.int(1, maxAnsInt);
    const maxDiv = Math.min(10, Math.floor((maxNumber * factor1) / answerInt));
    if (maxDiv < 2) return null;
    const num2 = rng.int(2, maxDiv);
    const num1Int = answerInt * num2;
    if (num1Int / factor1 > maxNumber) return null;
    const num1 = parseFloat((num1Int / factor1).toFixed(places1));
    return build(rng, [num1, num2], "divide", parseFloat((answerInt / factor1).toFixed(places1)), places);
  }

  // whole-number answer ÷ decimal divisor (e.g. 1.5 ÷ 0.3 = 5)
  const factor = Math.pow(10, places);
  const answerInt = rng.int(1, Math.floor(maxNumber));
  const maxNum2Int = Math.min(factor * 10, Math.floor((maxNumber / answerInt) * factor));
  if (maxNum2Int < 1) return null;
  const num2Int = rng.int(1, maxNum2Int);
  const num2 = parseFloat((num2Int / factor).toFixed(places));
  const num1 = parseFloat(((answerInt * num2Int) / factor).toFixed(places));
  return build(rng, [num1, num2], "divide", answerInt, places);
}

export function generateArithmeticProblem(config: ArithmeticConfig, rng: Rng): ArithmeticProblem | null {
  const opName = rng.pick(config.operations);
  const isDecimal = config.numberType === "decimal";

  if (config.specialRule === "round-hundred" && opName === "subtract" && !isDecimal) {
    return roundHundredProblem(config, rng);
  }

  const places1 = isDecimal ? pickPlaces(config.places, rng) : 0;
  const places2 = isDecimal && config.separatePlaces ? pickPlaces(config.places2, rng) : places1;
  // The answer uses the larger precision of both operands
  const places = Math.max(places1, places2);

  if (opName === "divide") return divideProblem(config, rng, places1, places);

  const [min1, max1] = effectiveRange(config.range, isDecimal ? Math.pow(10, -places1) : 1);
  if (min1 > max1) return null;
  const range2: NumberRange = {
    min: config.range2.min ?? config.range.min,
    max: config.range2.max ?? config.range.max,
    minExclusive: config.range2.min !== undefined ? config.range2.minExclusive : config.range.minExclusive,
    maxExclusive: config.range2.max !== undefined ? config.range2.maxExclusive : config.range.maxExclusive,
  };
  const [min2, max2] = effectiveRange(range2, isDecimal ? Math.pow(10, -places2) : 1);
  if (min2 > max2) return null;

  const pick = (min: number, max: number, p: number) => (isDecimal ? rng.float(min, max, p) : rng.int(min, max));
  let num1 = pick(min1, max1, places1);
  let num2 = pick(min2, max2, places2);
  const missing = config.format === "missing-number";

  if (opName === "add") {
    if (config.forceCarrying && !isDecimal && !hasCarrying(num1, num2)) return null;
    const blank = missing ? (rng.chance(0.5) ? 0 : 1) : null;
    return build(rng, [num1, num2], "add", num1 + num2, places, blank);
  }

  if (opName === "subtract") {
    if (!config.allowNegative && num1 < num2) [num1, num2] = [num2, num1];
    if (config.forceBorrowing && !isDecimal && (num1 < num2 || !hasBorrowing(num1, num2))) return null;
    if (isDecimal && config.decimalSimpleMode && hasDecimalBorrowing(num1, num2, places)) return null;
    const blank = missing ? (rng.chance(0.5) ? 0 : 1) : null;
    return build(rng, [num1, num2], "subtract", num1 - num2, places, blank);
  }

  // multiply: a product has as many decimal places as both factors combined (1.5 × 1.5 = 2.25)
  if (isDecimal && config.decimalSimpleMode) {
    // decimal × whole number (e.g. 1.2 × 3 = 3.6), kept to a one-digit whole part
    num2 = rng.int(2, 10);
    const product = parseFloat((num1 * num2).toFixed(places1));
    if (product >= 10) return null;
    return build(rng, [num1, num2], "multiply", product, places1, missing ? 1 : null);
  }
  const productPlaces = isDecimal ? places1 + places2 : 0;
  const product = parseFloat((num1 * num2).toFixed(productPlaces));
  return build(rng, [num1, num2], "multiply", product, productPlaces, missing ? 1 : null);
}

function question(p: ArithmeticProblem): Token[] {
  const operand = (i: 0 | 1) => (p.blank === i ? line() : num(p.operands[i]));
  const tokens = [operand(0), op(OP_SYMBOL[p.op]), operand(1), op("=")];
  return p.blank === null ? tokens : [...tokens, num(p.result)];
}

export const arithmeticType = defineProblemType<ArithmeticConfig, ArithmeticProblem>({
  id: "arithmetic",
  label: "四则运算",
  defaultConfig: {
    count: 20,
    numberType: "integer",
    operations: ["add", "subtract"],
    allowedOperations: ARITH_OPS,
    range: { min: 1, max: 20 },
    range2: {},
    places: { min: 1, max: 1 },
    separatePlaces: false,
    places2: { min: 1, max: 1 },
    allowNegative: false,
    forceCarrying: false,
    forceBorrowing: false,
    decimalSimpleMode: false,
    format: "standard",
    specialRule: "none",
    displayFormat: "horizontal",
  },
  generate: (config, rng) =>
    generateUnique(
      config.count,
      () => generateArithmeticProblem(config, rng),
      (p) => `${plainText(question(p))}|${p.answer}`
    ),
  tags: (config) => config.operations,
  layout: {
    kind: "grid",
    question,
    answer: (p) => [num(p.answer)],
    isVertical: (config) => config.displayFormat === "vertical" && config.numberType === "integer",
    vertical: (p, config) =>
      config.displayFormat === "vertical" && config.numberType === "integer" && p.blank === null
        ? { top: String(p.operands[0]), op: OP_SYMBOL[p.op], bottom: String(p.operands[1]), answer: p.answer }
        : null,
  },
});
