import { makeId, type Rng } from "@/lib/random";
import { list, num } from "@/lib/pdf/tokens";
import { defineProblemType, type BaseConfig, type BaseProblem } from "../types";
import { effectiveRange, type NumberRange } from "../shared";
import { countingCardHeight, drawCountingCard } from "./draw";

export type CountingKind = "count-shapes" | "missing-sequence" | "count-sequence";
export type ShapeType = "circle" | "square" | "triangle" | "diamond";
export type CountDirection = "forward" | "backward" | "both";

export const COUNTING_KINDS: CountingKind[] = ["count-shapes", "missing-sequence", "count-sequence"];
export const ALL_SHAPES: ShapeType[] = ["circle", "square", "triangle", "diamond"];
const SEQUENCE_LENGTH = 6;

export interface CountingConfig extends BaseConfig {
  kinds: CountingKind[];
  /** Questions per kind */
  counts: Record<CountingKind, number>;
  range: NumberRange;
  shapes: ShapeType[];
  direction: CountDirection;
  /** Max blanks in a missing-sequence problem */
  maxBlanks: number;
  /** How many numbers to write in count-sequence */
  nextCount: number;
}

export type CountingProblem = BaseProblem &
  (
    | { kind: "count-shapes"; shape: ShapeType; count: number }
    | { kind: "missing-sequence"; sequence: (number | null)[] }
    | { kind: "count-sequence"; start: number; direction: "forward" | "backward"; steps: number }
  );

function pickDirection(config: CountingConfig, rng: Rng): "forward" | "backward" {
  if (config.direction === "both") return rng.chance(0.5) ? "forward" : "backward";
  return config.direction;
}

function makeProblem(kind: CountingKind, config: CountingConfig, rng: Rng): CountingProblem | null {
  const [rawMin, max] = effectiveRange(config.range);
  const min = Math.max(0, rawMin);
  const id = makeId(rng);

  if (kind === "count-shapes") {
    const lo = Math.max(1, min);
    if (lo > max) return null;
    const count = rng.int(lo, max);
    return { id, kind, shape: rng.pick(config.shapes), count, answer: String(count) };
  }

  if (kind === "missing-sequence") {
    if (max - min + 1 < SEQUENCE_LENGTH) return null;
    const lowest = rng.int(min, max - SEQUENCE_LENGTH + 1);
    const seq = Array.from({ length: SEQUENCE_LENGTH }, (_, i) => lowest + i);
    if (pickDirection(config, rng) === "backward") seq.reverse();
    // Never blank the first number so there's a starting point
    const blankCount = rng.int(1, Math.min(Math.max(config.maxBlanks, 1), 3));
    const blanks = rng
      .shuffle(Array.from({ length: SEQUENCE_LENGTH - 1 }, (_, i) => i + 1))
      .slice(0, blankCount)
      .sort((a, b) => a - b);
    return {
      id,
      kind,
      sequence: seq.map((n, i) => (blanks.includes(i) ? null : n)),
      answer: blanks.map((i) => seq[i]).join(", "),
    };
  }

  const steps = Math.min(Math.max(config.nextCount, 1), 5);
  const direction = pickDirection(config, rng);
  // Keep every written number inside the range
  const startMin = direction === "forward" ? min : min + steps;
  const startMax = direction === "forward" ? max - steps : max;
  if (startMin > startMax) return null;
  const start = rng.int(startMin, startMax);
  const delta = direction === "forward" ? 1 : -1;
  const next = Array.from({ length: steps }, (_, i) => start + delta * (i + 1));
  return { id, kind, start, direction, steps, answer: next.join(", ") };
}

function problemKey(p: CountingProblem): string {
  switch (p.kind) {
    case "count-shapes":
      return `${p.shape}|${p.count}`;
    case "missing-sequence":
      return p.sequence.join(",");
    case "count-sequence":
      return `${p.direction}|${p.start}`;
  }
}

/** Each selected kind gets exactly its own count, grouped in order (Part A/B/C) */
function generate(config: CountingConfig, rng: Rng): CountingProblem[] {
  const problems: CountingProblem[] = [];
  for (const kind of COUNTING_KINDS) {
    if (!config.kinds.includes(kind)) continue;
    const target = config.counts[kind];
    const seen = new Set<string>();
    for (let made = 0, attempts = 0; made < target && attempts < target * 20; attempts++) {
      const p = makeProblem(kind, config, rng);
      if (!p || seen.has(problemKey(p))) continue;
      seen.add(problemKey(p));
      problems.push(p);
      made++;
    }
  }
  return problems;
}

export const countingType = defineProblemType<CountingConfig, CountingProblem>({
  id: "counting",
  label: "数数",
  defaultConfig: {
    count: 30,
    kinds: COUNTING_KINDS,
    counts: { "count-shapes": 10, "missing-sequence": 10, "count-sequence": 10 },
    range: { min: 1, max: 50 },
    shapes: ALL_SHAPES,
    direction: "both",
    maxBlanks: 2,
    nextCount: 3,
  },
  generate,
  totalCount: (config) => config.kinds.reduce((sum, k) => sum + config.counts[k], 0),
  tags: (config) => config.kinds,
  layout: {
    kind: "card",
    height: countingCardHeight,
    draw: drawCountingCard,
    answer: (p) => (p.kind === "count-shapes" ? [num(p.answer)] : list(p.answer.split(", "))),
    section: (p) => p.kind,
  },
});
