import { Fraction } from "./fraction";

export type Operation =
  | "add"
  | "subtract"
  | "multiply"
  | "divide"
  | "compare"
  | "round"
  | "percent-of"
  | "fraction-to-percent"
  | "decimal-to-percent"
  | "count-shapes"
  | "missing-sequence"
  | "count-sequence";

export type CountingKind = "count-shapes" | "missing-sequence" | "count-sequence";
export const COUNTING_OPERATIONS: CountingKind[] = ["count-shapes", "missing-sequence", "count-sequence"];
export const isCountingOperation = (op: Operation): op is CountingKind =>
  (COUNTING_OPERATIONS as Operation[]).includes(op);
export const DEFAULT_COUNTING_COUNT = 10;
export type ShapeType = "circle" | "square" | "triangle" | "diamond";
export type CountDirection = "forward" | "backward" | "both";
export type NumberType = "integer" | "decimal" | "fraction";
export type Topic = "add-sub" | "mul-div" | "fraction-decimal" | "number-sense" | "percent";
export type SpecialRule = 
  | 'none' 
  | 'round-hundred-minus-two-digit' 
  | 'missing-number'
  | 'integer-fraction'
  | 'related-denominators'
  | 'fraction-mixed-ops-3';

export interface Problem {
  id: string;
  question: string;
  answer: string;
  type: NumberType;

  // Counting problems carry structured data so the PDF can draw them
  kind?: CountingKind;
  shape?: ShapeType;
  shapeCount?: number;
  sequence?: (number | null)[]; // null = blank for the student to fill in
  direction?: "forward" | "backward";
}

export interface QuizConfig {
  count: number;
  topic: Topic;
  numberType: NumberType;
  operations: Operation[];

  // Integer / Decimal settings
  minNumber: number;
  maxNumber: number;

  // Inclusive/exclusive boundaries
  minExclusive?: boolean;
  maxExclusive?: boolean;
  minExclusive2?: boolean;
  maxExclusive2?: boolean;

  // Fine-grained control for the second operand (e.g. subtract a 1-digit number from a 2-digit number)
  minNumber2?: number;
  maxNumber2?: number;

  decimalPlaces?: number; // Min decimal places for left operand (or fixed)
  maxDecimalPlaces?: number; // Max decimal places for left operand
  separateDecimalPlaces?: boolean; // Use different decimal place ranges for left vs right
  decimalPlacesNum2?: number; // Min decimal places for right operand (when separateDecimalPlaces)
  maxDecimalPlacesNum2?: number; // Max decimal places for right operand

  // Integer specific
  allowNegative: boolean; // For subtractions resulting in negative numbers
  forceBorrowing?: boolean; // For subtraction
  forceCarrying?: boolean; // For addition
  specialRule?: SpecialRule; // Field for special generation rules

  // Specific override for the first number (e.g. always 100)
  fixedFirstOperand?: number;

  // Fraction settings
  maxDenominator?: number;
  minDenominator?: number;

  // Percent settings
  percentages?: number[]; // Which percentages to use, e.g. [10, 20, 25, 50]
  percentRoundBase?: boolean; // Force base number to be a multiple of 10
  decimalSimpleMode?: boolean; // Multiply/divide: second operand is always an integer
  roundingTargets?: number[]; // Which decimal places to round to: 0=whole, 1=tenth, 2=hundredth

  // Counting settings
  countDirection?: CountDirection; // Sequence direction for missing-sequence / count-sequence
  maxBlanks?: number; // Max blanks in a missing-sequence problem
  countNextCount?: number; // How many numbers to write in count-sequence
  countingCounts?: Partial<Record<CountingKind, number>>; // Questions per counting type
  shapeTypes?: ShapeType[]; // Shapes used in count-shapes
}

function generateRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomFloat(min: number, max: number, places: number): number {
  const factor = Math.pow(10, places);
  const num = generateRandomInt(min * factor, max * factor) / factor;
  return parseFloat(num.toFixed(places));
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
    const digitA = tempA % 10;
    const digitB = tempB % 10;
    if (digitA < digitB) return true;
    tempA = Math.floor(tempA / 10);
    tempB = Math.floor(tempB / 10);
  }
  return false;
}

export function generateQuiz(config: QuizConfig): Problem[] {
  const problems: Problem[] = [];
  const generatedQuestions = new Set<string>(); // Track unique questions

  if (config.operations.length === 0) return [];

  if (config.operations.every(isCountingOperation)) {
    return generateCountingQuiz(config);
  }

  let attempts = 0;
  // Limit total attempts to avoid infinite loops if range is too small
  while (problems.length < config.count && attempts < config.count * 10) {
    attempts++;
    const operation =
      config.operations[Math.floor(Math.random() * config.operations.length)];
    const id = Math.random().toString(36).substring(2, 9);

    try {
      let p: Problem | null = null;

      if (operation === "count-shapes") {
        p = generateCountShapesProblem(id, config);
      } else if (operation === "missing-sequence") {
        p = generateMissingSequenceProblem(id, config);
      } else if (operation === "count-sequence") {
        p = generateCountSequenceProblem(id, config);
      } else if (operation === "percent-of") {
        p = generatePercentProblem(id, config);
      } else if (operation === "fraction-to-percent") {
        p = generateFractionToPercentProblem(id);
      } else if (operation === "decimal-to-percent") {
        p = generateDecimalToPercentProblem(id, config);
      } else if (operation === "compare") {
        p = generateComparisonProblem(id, config);
      } else if (operation === "round") {
        p = generateRoundingProblem(id, config);
      } else if (config.numberType === "fraction") {
        p = generateFractionProblem(id, operation, config);
      } else {
        p = generateArithmeticProblem(id, operation, config);
      }

      if (p) {
        // Check for duplicates (answer included: counting prompts like "Count the circles." repeat)
        const key = `${p.question}|${p.answer}`;
        if (!generatedQuestions.has(key)) {
          generatedQuestions.add(key);
          problems.push(p);
        }
        // If duplicate, do nothing (attempts counter increases, loop continues)
      }
    } catch (e) {
      // Ignore generation errors and retry
    }
  }

  return problems;
}

// --- Counting (Grade 1) ---

// Each selected type gets its own count, grouped in order (Part A/B/C)
function generateCountingQuiz(config: QuizConfig): Problem[] {
  const problems: Problem[] = [];
  for (const kind of COUNTING_OPERATIONS) {
    if (!config.operations.includes(kind)) continue;
    const target = config.countingCounts?.[kind] ?? DEFAULT_COUNTING_COUNT;
    const seen = new Set<string>();
    let made = 0;
    for (let attempts = 0; made < target && attempts < target * 20; attempts++) {
      const id = Math.random().toString(36).substring(2, 9);
      const p =
        kind === "count-shapes"
          ? generateCountShapesProblem(id, config)
          : kind === "missing-sequence"
          ? generateMissingSequenceProblem(id, config)
          : generateCountSequenceProblem(id, config);
      if (!p) continue;
      const key = `${p.question}|${p.answer}`;
      if (seen.has(key)) continue;
      seen.add(key);
      problems.push(p);
      made++;
    }
  }
  return problems;
}

function countingRange(config: QuizConfig): [number, number] {
  const min = (config.minNumber ?? 1) + (config.minExclusive ? 1 : 0);
  const max = (config.maxNumber ?? 50) - (config.maxExclusive ? 1 : 0);
  return [Math.max(0, min), max];
}

function pickDirection(config: QuizConfig): "forward" | "backward" {
  const dir = config.countDirection ?? "both";
  if (dir === "both") return Math.random() < 0.5 ? "forward" : "backward";
  return dir;
}

const SHAPE_NAMES: Record<ShapeType, string> = {
  circle: "circles",
  square: "squares",
  triangle: "triangles",
  diamond: "diamonds",
};

function generateCountShapesProblem(id: string, config: QuizConfig): Problem | null {
  const [min, max] = countingRange(config);
  const lo = Math.max(1, min);
  if (lo > max) return null;
  const shapes: ShapeType[] =
    config.shapeTypes && config.shapeTypes.length > 0
      ? config.shapeTypes
      : ["circle", "square", "triangle", "diamond"];
  const shape = shapes[Math.floor(Math.random() * shapes.length)];
  const n = generateRandomInt(lo, max);
  return {
    id,
    type: "integer",
    kind: "count-shapes",
    shape,
    shapeCount: n,
    question: `Count the ${SHAPE_NAMES[shape]}.`,
    answer: n.toString(),
  };
}

function generateMissingSequenceProblem(id: string, config: QuizConfig): Problem | null {
  const LENGTH = 6;
  const [min, max] = countingRange(config);
  if (max - min + 1 < LENGTH) return null;
  const direction = pickDirection(config);
  const lowest = generateRandomInt(min, max - LENGTH + 1);
  const seq = Array.from({ length: LENGTH }, (_, i) => lowest + i);
  if (direction === "backward") seq.reverse();

  // Blanks never at the first position so the student has a starting point
  const maxBlanks = Math.min(Math.max(config.maxBlanks ?? 2, 1), 3);
  const blankCount = generateRandomInt(1, maxBlanks);
  const positions = Array.from({ length: LENGTH - 1 }, (_, i) => i + 1)
    .sort(() => Math.random() - 0.5)
    .slice(0, blankCount)
    .sort((a, b) => a - b);

  const sequence: (number | null)[] = seq.map((n, i) => (positions.includes(i) ? null : n));
  return {
    id,
    type: "integer",
    kind: "missing-sequence",
    sequence,
    direction,
    question: sequence.map((n) => (n === null ? "___" : n)).join(", "),
    answer: positions.map((i) => seq[i]).join(", "),
  };
}

function generateCountSequenceProblem(id: string, config: QuizConfig): Problem | null {
  const steps = Math.min(Math.max(config.countNextCount ?? 3, 1), 5);
  const [min, max] = countingRange(config);
  const direction = pickDirection(config);
  // Keep every written number inside the range
  const startMin = direction === "forward" ? min : min + steps;
  const startMax = direction === "forward" ? max - steps : max;
  if (startMin > startMax) return null;
  const start = generateRandomInt(startMin, startMax);
  const delta = direction === "forward" ? 1 : -1;
  const next = Array.from({ length: steps }, (_, i) => start + delta * (i + 1));
  return {
    id,
    type: "integer",
    kind: "count-sequence",
    sequence: [start, ...next.map(() => null)],
    direction,
    question: `Count ${direction}. Write the next ${steps} numbers: ${start},`,
    answer: next.join(", "),
  };
}

function generateArithmeticProblem(
  id: string,
  op: Operation,
  config: QuizConfig
): Problem | null {
  const isDecimal = config.numberType === "decimal";
  const minP1 = config.decimalPlaces ?? 1;
  const maxP1 = config.maxDecimalPlaces ?? minP1;
  const places1 = maxP1 > minP1 ? generateRandomInt(minP1, maxP1) : minP1;

  let places2 = places1;
  if (isDecimal && config.separateDecimalPlaces) {
    const minP2 = config.decimalPlacesNum2 ?? minP1;
    const maxP2 = config.maxDecimalPlacesNum2 ?? minP2;
    places2 = maxP2 > minP2 ? generateRandomInt(minP2, maxP2) : minP2;
  }
  // answer uses max precision of both operands
  const places = Math.max(places1, places2);

  let num1, num2, answer;
  let question = "";

  // Handle Special Rules
  if (
    config.specialRule === "round-hundred-minus-two-digit" &&
    op === "subtract" &&
    !isDecimal
  ) {
    if (config.fixedFirstOperand) {
      num1 = config.fixedFirstOperand;
    } else {
      // Generate num1 as a multiple of 100 within range (min 100)
      let minH = Math.max(1, Math.ceil(config.minNumber / 100));
      let maxH = Math.floor(config.maxNumber / 100);
      if (maxH < minH) maxH = minH;
      num1 = generateRandomInt(minH, maxH) * 100;
    }

    // num2 is a 2-digit number (10-99)
    num2 = generateRandomInt(10, 99);

    if (num1 < num2) num1 = (Math.floor(num2 / 100) + 1) * 100;

    answer = num1 - num2;
    question = `${num1} - ${num2} =`;
    return { id, type: "integer", question, answer: answer.toString() };
  }

  // Compute effective boundaries respecting inclusive/exclusive flags
  const unit1 = isDecimal ? Math.pow(10, -places1) : 1;
  const unit2 = isDecimal ? Math.pow(10, -places2) : 1;
  const effMin1 = config.minExclusive ? config.minNumber + unit1 : config.minNumber;
  const effMax1 = config.maxExclusive ? config.maxNumber - unit1 : config.maxNumber;
  if (effMin1 > effMax1) return null;

  const rawMin2 = config.minNumber2 !== undefined ? config.minNumber2 : config.minNumber;
  const rawMax2 = config.maxNumber2 !== undefined ? config.maxNumber2 : config.maxNumber;
  const useExclMin2 = config.minNumber2 !== undefined ? config.minExclusive2 : config.minExclusive;
  const useExclMax2 = config.maxNumber2 !== undefined ? config.maxExclusive2 : config.maxExclusive;
  const effMin2 = useExclMin2 ? rawMin2 + unit2 : rawMin2;
  const effMax2 = useExclMax2 ? rawMax2 - unit2 : rawMax2;
  if (effMin2 > effMax2) return null;

  // Helper to get number with explicit decimal places
  const getNum = (min: number, max: number, p: number = places1) =>
    isDecimal
      ? generateRandomFloat(min, max, p)
      : generateRandomInt(min, max);

  num1 = getNum(effMin1, effMax1, places1);

  num2 = getNum(effMin2, effMax2, places2);

  if (op === "add") {
    if (config.forceCarrying && !isDecimal) {
      if (!hasCarrying(num1, num2)) return null;
    }
    answer = num1 + num2;
    // Special Rule: Missing Number (e.g., 5 + ? = 12)
    if (config.specialRule === "missing-number" && Math.random() > 0.5) {
      question = `${num1} + ___ = ${formatNumber(answer, isDecimal, places)}`;
      answer = num2; // The answer key shows the missing part
    } else if (config.specialRule === "missing-number") {
      question = `___ + ${num2} = ${formatNumber(answer, isDecimal, places)}`;
      answer = num1;
    } else {
      question = `${num1} + ${num2} =`;
    }
  } else if (op === "subtract") {
    if (!config.allowNegative && num1 < num2) {
      [num1, num2] = [num2, num1];
    }
    if (config.forceBorrowing && !isDecimal) {
      if (num1 < num2 || !hasBorrowing(num1, num2)) return null;
    }
    if (isDecimal && config.decimalSimpleMode) {
      // No borrowing in any decimal place (e.g. 3.5 - 1.2 ✓, 5.0 - 2.6 ✗)
      // Use places (max precision) to normalize both operands for digit comparison
      const factor = Math.pow(10, places);
      let aDec = Math.round(num1 * factor) % factor;
      let bDec = Math.round(num2 * factor) % factor;
      for (let i = 0; i < places; i++) {
        if (aDec % 10 < bDec % 10) return null;
        aDec = Math.floor(aDec / 10);
        bDec = Math.floor(bDec / 10);
      }
    }
    answer = num1 - num2;
    if (config.specialRule === "missing-number" && Math.random() > 0.5) {
      question = `${num1} - ___ = ${formatNumber(answer, isDecimal, places)}`;
      answer = num2;
    } else if (config.specialRule === "missing-number") {
      question = `___ - ${num2} = ${formatNumber(answer, isDecimal, places)}`;
      answer = num1;
    } else {
      question = `${num1} - ${num2} =`;
    }
  } else if (op === "multiply") {
    if (isDecimal && config.decimalSimpleMode) {
      // Simple mode: decimal × integer (e.g. 1.2 × 3 = 3.6)
      // num1 already generated with places1; force num2 to integer
      num2 = generateRandomInt(2, 10);
      answer = parseFloat((num1 * num2).toFixed(places1));
      // reject if answer has multi-digit integer part (keeps problems "simple")
      if (answer >= 10) return null;
    } else {
      answer = parseFloat((num1 * num2).toFixed(places));
    }
    if (config.specialRule === "missing-number") {
      question = `${num1} × ___ = ${formatNumber(answer, isDecimal, places)}`;
      answer = num2;
    } else {
      question = `${num1} × ${num2} =`;
    }
  } else if (op === "divide") {
    if (isDecimal) {
      if (config.decimalSimpleMode) {
        // Simple mode: decimal ÷ integer = decimal (e.g. 3.6 ÷ 3 = 1.2)
        // Use places1 (left operand precision) — NOT places (max), so left stays at set decimal places
        const factor1 = Math.pow(10, places1);
        const maxAnsInt = Math.floor((config.maxNumber || 20) * factor1);
        if (maxAnsInt < 1) return null;
        const answerInt = generateRandomInt(1, maxAnsInt);
        const maxDiv = Math.min(10, Math.floor(((config.maxNumber || 20) * factor1) / answerInt));
        if (maxDiv < 2) return null;
        num2 = generateRandomInt(2, maxDiv);
        const num1Int = answerInt * num2;
        if (num1Int / factor1 > (config.maxNumber || 20)) return null;
        num1 = parseFloat((num1Int / factor1).toFixed(places1));
        answer = parseFloat((answerInt / factor1).toFixed(places1));
      } else {
        // Standard: integer answer ÷ decimal divisor (e.g. 1.5 ÷ 0.3 = 5)
        const factor = Math.pow(10, places);
        const maxAns = Math.floor(config.maxNumber || 20);
        const answerInt = generateRandomInt(1, maxAns);
        const maxNum2Int = Math.min(factor * 10, Math.floor(((config.maxNumber || 20) / answerInt) * factor));
        if (maxNum2Int < 1) return null;
        const num2Int = generateRandomInt(1, maxNum2Int);
        num2 = parseFloat((num2Int / factor).toFixed(places));
        num1 = parseFloat(((answerInt * num2Int) / factor).toFixed(places));
        answer = answerInt;
      }
    } else {
      num2 = generateRandomInt(config.minNumber || 1, config.maxNumber / 2);
      if (num2 === 0) num2 = 1;
      const maxMultiplier = Math.floor(config.maxNumber / num2);
      const multiplier = generateRandomInt(
        config.minNumber || 1,
        maxMultiplier
      );
      answer = multiplier;
      num1 = num2 * answer;
    }
    question = `${num1} ÷ ${num2} =`;
  } else {
    return null;
  }

  const answerStr = formatNumber(answer, isDecimal, places);

  return {
    id,
    type: config.numberType,
    question,
    answer: answerStr,
  };
}

function generateComparisonProblem(
  id: string,
  config: QuizConfig
): Problem | null {
  const isDecimal = config.numberType === "decimal";
  const places = config.decimalPlaces || 1;
  const getNum = () =>
    isDecimal
      ? generateRandomFloat(config.minNumber, config.maxNumber, places)
      : generateRandomInt(config.minNumber, config.maxNumber);

  const num1 = getNum();
  // Ensure num2 is close to num1 to make it harder, or just random
  // Let's make it random but sometimes equal
  let num2 = getNum();
  if (Math.random() < 0.2) num2 = num1;

  const question = `${num1} ___ ${num2}`;
  let answer = "=";
  if (num1 > num2) answer = ">";
  if (num1 < num2) answer = "<";

  return {
    id,
    type: config.numberType,
    question,
    answer,
  };
}

function generateRoundingProblem(
  id: string,
  config: QuizConfig
): Problem | null {
  // Rounding usually applies to integers (nearest 10, 100) or decimals (nearest whole, tenth)
  const isDecimal = config.numberType === "decimal";

  if (isDecimal) {
    const places = config.decimalPlaces || 2;
    const num = generateRandomFloat(config.minNumber, config.maxNumber, places);

    // Pick rounding target from configured list, or fall back to random valid place
    let targetPlace = 0;
    if (config.roundingTargets && config.roundingTargets.length > 0) {
      // Only use targets that are strictly less than source precision
      const valid = config.roundingTargets.filter((t) => t < places);
      if (valid.length === 0) return null;
      targetPlace = valid[Math.floor(Math.random() * valid.length)];
    } else if (places > 1) {
      targetPlace = generateRandomInt(0, places - 1);
    }

    const factor = Math.pow(10, targetPlace);
    const answer = Math.round(num * factor) / factor;

    let targetDesc = "whole number";
    if (targetPlace === 1) targetDesc = "tenth";
    else if (targetPlace === 2) targetDesc = "hundredth";
    else if (targetPlace === 3) targetDesc = "thousandth";
    else if (targetPlace > 0) targetDesc = `${targetPlace} decimal places`;

    const question = `Round ${num} to the nearest ${targetDesc}`;

    return { id, type: "decimal", question, answer: answer.toString() };
  } else {
    // Integer rounding
    // Round to nearest 10 or 100
    const num = generateRandomInt(config.minNumber, config.maxNumber);
    const roundTo100 = Math.random() > 0.5 && config.maxNumber >= 100;
    const factor = roundTo100 ? 100 : 10;

    const answer = Math.round(num / factor) * factor;
    const question = `Round ${num} to the nearest ${factor}`;

    return { id, type: "integer", question, answer: answer.toString() };
  }
}

function generateFractionProblem(
  id: string,
  op: Operation,
  config: QuizConfig
): Problem | null {
  // ... (Keep existing fraction logic, but add comparison?)
  // For brevity, skipping comparison for fractions in this iteration unless requested,
  // sticking to arithmetic.
  if (op === "compare" || op === "round") return null; // Not implemented for fractions yet

  const minDenom = config.minDenominator || 2;
  const maxDenom = config.maxDenominator || 10;

  const safeMinDenom = Math.min(minDenom, maxDenom);

  const getFract = () =>
    new Fraction(
      generateRandomInt(1, maxDenom * 2),
      generateRandomInt(safeMinDenom, maxDenom)
    );

  const getIntAsFract = () =>
    new Fraction(
      generateRandomInt(config.minNumber || 2, config.maxNumber || 10),
      1
    );

  // Handle Special Rules
  if (config.specialRule === 'fraction-mixed-ops-3') {
      const f1 = getFract();
      const f2 = getFract();
      const f3 = getFract();
      
      const op1 = Math.random() > 0.5 ? 'add' : 'subtract';
      const op2 = Math.random() > 0.5 ? 'add' : 'subtract';
      
      // Calculate f1 op1 f2
      const step1 = op1 === 'add' ? f1.add(f2) : f1.subtract(f2);
      
      // Calculate step1 op2 f3
      const ans = op2 === 'add' ? step1.add(f3) : step1.subtract(f3);
      
      if (!config.allowNegative && (step1.numerator * step1.denominator < 0 || ans.numerator * ans.denominator < 0)) {
          return null; // Retry
      }

      return {
          id,
          type: 'fraction',
          question: `${f1.toString()} ${getOpSymbol(op1)} ${f2.toString()} ${getOpSymbol(op2)} ${f3.toString()} =`,
          answer: ans.toString()
      };
  }

  let f1: Fraction, f2: Fraction;

  // Handle Special Rules
  if (config.specialRule === "integer-fraction") {
    if (op === "multiply") {
      // Integer x Fraction or Fraction x Integer
      if (Math.random() > 0.5) {
        f1 = getIntAsFract();
        f2 = getFract();
      } else {
        f1 = getFract();
        f2 = getIntAsFract();
      }
    } else if (op === "divide") {
      // Fraction / Integer
      f1 = getFract();
      f2 = getIntAsFract();
    } else {
      // Fallback for add/sub: just standard fractions
      f1 = getFract();
      f2 = getFract();
    }
  } else if (
    config.specialRule === "related-denominators" &&
    (op === "add" || op === "subtract")
  ) {
    // Logic for related denominators (e.g. 1/3 + 1/6)
    // d1 is random
    // d2 is multiple of d1
    const d1 = generateRandomInt(2, Math.max(2, Math.floor(maxDenom / 2)));
    const maxMultiplier = Math.floor(maxDenom / d1);
    const multiplier = generateRandomInt(2, Math.max(2, maxMultiplier));
    const d2 = d1 * multiplier;

    f1 = new Fraction(generateRandomInt(1, d1 * 2), d1);
    f2 = new Fraction(generateRandomInt(1, d2 * 2), d2);

    // Randomize order so smaller denom isn't always first
    if (Math.random() > 0.5) {
      const temp = f1;
      f1 = f2;
      f2 = temp;
    }
  } else {
    // Standard random fractions
    f1 = getFract();
    f2 = getFract();
  }

  let ans: Fraction;

  switch (op) {
    case "add":
      ans = f1.add(f2);
      break;
    case "subtract":
      if (!config.allowNegative) {
        if (f1.numerator * f2.denominator < f2.numerator * f1.denominator) {
          [f1, f2] = [f2, f1];
        }
      }
      ans = f1.subtract(f2);
      break;
    case "multiply":
      ans = f1.multiply(f2);
      break;
    case "divide":
      ans = f1.divide(f2);
      break;
    default:
      return null;
  }

  return {
    id,
    type: "fraction",
    question: `${f1.toString()} ${getOpSymbol(op)} ${f2.toString()} =`,
    answer: ans.toString(),
  };
}

function gcd(a: number, b: number): number {
  while (b > 0) [a, b] = [b, a % b];
  return a;
}

function lcm(a: number, b: number): number {
  return (a * b) / gcd(a, b);
}

function generatePercentProblem(id: string, config: QuizConfig): Problem | null {
  const percentages =
    config.percentages && config.percentages.length > 0
      ? config.percentages
      : [10, 20, 25, 50];

  const pct = percentages[Math.floor(Math.random() * percentages.length)];

  // N * pct / 100 must be an integer → N must be divisible by (100 / gcd(100, pct))
  const divisor = 100 / gcd(100, pct);

  const minN = config.minNumber || 1;
  const maxN = config.maxNumber || 200;
  // Simple mode: N must be a multiple of lcm(divisor, 10) so it's always a round number
  const step = config.percentRoundBase ? lcm(divisor, 10) : divisor;
  const minMult = Math.ceil(minN / step);
  const maxMult = Math.floor(maxN / step);

  if (maxMult < minMult) return null;

  const N = generateRandomInt(minMult, maxMult) * step;
  const result = (N * pct) / 100;

  return {
    id,
    type: "integer",
    question: `${pct}% of ${N} = ______`,
    answer: result.toString(),
  };
}

// Denominators that divide 100 evenly → guaranteed integer percentage answers
const PERCENT_DENOMINATORS = [2, 4, 5, 10, 20, 25];

function generateFractionToPercentProblem(id: string): Problem | null {
  const denom = PERCENT_DENOMINATORS[Math.floor(Math.random() * PERCENT_DENOMINATORS.length)];
  const numer = generateRandomInt(1, denom - 1);
  const percent = (numer / denom) * 100;
  return {
    id,
    type: "fraction",
    question: `${numer}/${denom} = ______%`,
    answer: `${percent}%`,
  };
}

function generateDecimalToPercentProblem(id: string, config: QuizConfig): Problem | null {
  const places = config.decimalPlaces || 1;
  const factor = Math.pow(10, places);
  const raw = generateRandomInt(1, factor - 1);
  const decimal = raw / factor;
  const percent = raw * (100 / factor);
  return {
    id,
    type: "decimal",
    question: `${decimal.toFixed(places)} = ______%`,
    answer: `${percent}%`,
  };
}

function formatNumber(num: number, isDecimal: boolean, places: number): string {
  return isDecimal ? num.toFixed(places).replace(/\.?0+$/, "") : num.toString();
}

function getOpSymbol(op: Operation): string {
  switch (op) {
    case "add":
      return "+";
    case "subtract":
      return "-";
    case "multiply":
      return "x";
    case "divide":
      return "÷";
    default:
      return "?";
  }
}
