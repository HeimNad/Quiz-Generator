import { makeId, type Rng } from "@/lib/random";
import { line, num, text } from "@/lib/pdf/tokens";
import { defineProblemType, type BaseConfig, type BaseProblem } from "../types";
import { generateUnique, type NumberRange } from "../shared";

export type NumberWordsKind = "to-words" | "to-number";

export interface NumberWordsConfig extends BaseConfig {
  kinds: NumberWordsKind[];
  range: NumberRange;
}

export interface NumberWordsProblem extends BaseProblem {
  kind: NumberWordsKind;
  value: number;
  words: string;
}

export const MAX_WORDS_NUMBER = 999_999;

const SMALL = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen",
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

/** US style, no "and": 93 → "ninety-three", 2305 → "two thousand three hundred five" */
export function numberToWords(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > MAX_WORDS_NUMBER) throw new RangeError(`Unsupported number: ${n}`);
  if (n < 20) return SMALL[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? `-${SMALL[n % 10]}` : "");
  const [unit, size] = n < 1000 ? ["hundred", 100] : ["thousand", 1000];
  const rest = n % size;
  return `${numberToWords(Math.floor(n / size))} ${unit}` + (rest ? ` ${numberToWords(rest)}` : "");
}

function makeProblem(config: NumberWordsConfig, rng: Rng): NumberWordsProblem | null {
  const min = Math.max(0, config.range.min);
  const max = Math.min(MAX_WORDS_NUMBER, config.range.max);
  if (min > max) return null;
  const value = rng.int(min, max);
  const words = numberToWords(value);
  const kind = rng.pick(config.kinds);
  return { id: makeId(rng), kind, value, words, answer: kind === "to-words" ? words : String(value) };
}

export const numberWordsType = defineProblemType<NumberWordsConfig, NumberWordsProblem>({
  id: "number-words",
  label: "英文数字",
  defaultConfig: {
    count: 20,
    kinds: ["to-words", "to-number"],
    range: { min: 1, max: 100 },
  },
  generate: (config, rng) =>
    generateUnique(
      config.count,
      () => makeProblem(config, rng),
      (p) => `${p.kind}|${p.value}`
    ),
  tags: (config) => config.kinds,
  layout: {
    kind: "grid",
    question: (p) =>
      p.kind === "to-words"
        ? // Room to write the words by hand, longer for bigger numbers
          [text("Write"), num(p.value), text("in words:"), line(undefined, Math.max(18, Math.round(p.words.length * 0.9)))]
        : [text("Write the number:"), text(p.words), line()],
    answer: (p) => [p.kind === "to-words" ? text(p.words) : num(p.value)],
    // Words for thousands are long; give them the full width
    columns: (config) => (config.range.max >= 1000 ? 1 : 2),
    answerColumns: (config) => (config.range.max >= 1000 ? 1 : config.range.max >= 100 ? 2 : 3),
  },
});
