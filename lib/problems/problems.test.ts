import { describe, expect, it } from "vitest";
import { Fraction } from "@/lib/fraction";
import { createRng } from "@/lib/random";
import { compareType } from "./compare";
import { countingType, type CountingConfig } from "./counting";
import { fractionType, type FractionConfig } from "./fraction";
import { percentType } from "./percent";
import { roundingType } from "./rounding";

describe("fraction", () => {
  const gen = (patch: Partial<FractionConfig>) => fractionType.generate({ ...fractionType.defaultConfig, ...patch }, createRng(5));

  it("computes simplified answers", () => {
    for (const p of gen({ count: 40 })) {
      const [a, b] = p.terms.map((t) => new Fraction(t.n, t.d));
      const expected = { add: a.add(b), subtract: a.subtract(b), multiply: a.multiply(b), divide: a.divide(b) }[p.ops[0]];
      expect(p.answer).toBe(expected.toString());
    }
  });

  it("avoids negative results unless allowed", () => {
    for (const p of gen({ count: 40, operations: ["subtract"] })) expect(p.result.n).toBeGreaterThanOrEqual(0);
    for (const p of gen({ count: 30, rule: "mixed-ops-3" })) {
      expect(p.terms).toHaveLength(3);
      expect(p.result.n).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("compare", () => {
  it("answers <, > or =", () => {
    for (const p of compareType.generate({ ...compareType.defaultConfig, count: 30 }, createRng(2))) {
      expect(p.answer).toBe(p.left > p.right ? ">" : p.left < p.right ? "<" : "=");
    }
  });
});

describe("rounding", () => {
  it("rounds integers to 10 or 100", () => {
    for (const p of roundingType.generate({ ...roundingType.defaultConfig, count: 30 }, createRng(3))) {
      const f = Number(p.target);
      expect(Number(p.answer)).toBe(Math.round(p.value / f) * f);
    }
  });

  it("rounds decimals to the chosen places", () => {
    const cfg = { ...roundingType.defaultConfig, count: 30, numberType: "decimal" as const, range: { min: 0, max: 100 }, places: 3, targets: [1] };
    for (const p of roundingType.generate(cfg, createRng(4))) {
      expect(p.target).toBe("tenth");
      expect(Math.abs(Number(p.answer) - p.value)).toBeLessThanOrEqual(0.05 + 1e-9);
    }
  });
});

describe("percent", () => {
  it("gives whole-number answers", () => {
    for (const p of percentType.generate({ ...percentType.defaultConfig, count: 30, percentages: [5, 15, 75] }, createRng(6))) {
      if (p.kind === "percent-of") {
        expect(Number(p.answer)).toBe((p.base * p.percent) / 100);
        expect(Number.isInteger(Number(p.answer))).toBe(true);
        expect(p.base % 10).toBe(0); // roundBase
      } else if (p.kind === "fraction-to-percent") {
        expect(p.answer).toBe(`${(p.numerator / p.denominator) * 100}%`);
      } else {
        expect(p.answer).toBe(`${Math.round(Number(p.decimal) * 100)}%`);
      }
    }
  });
});

describe("counting", () => {
  const gen = (patch: Partial<CountingConfig>) => countingType.generate({ ...countingType.defaultConfig, ...patch }, createRng(8));

  it("makes exactly the requested count per kind, grouped in order", () => {
    const problems = gen({ counts: { "count-shapes": 4, "missing-sequence": 7, "count-sequence": 3 } });
    expect(problems.map((p) => p.kind)).toEqual([
      ...Array(4).fill("count-shapes"),
      ...Array(7).fill("missing-sequence"),
      ...Array(3).fill("count-sequence"),
    ]);
  });

  it("keeps every number in range and sequences consecutive", () => {
    for (const p of gen({ range: { min: 1, max: 50 } })) {
      if (p.kind === "count-shapes") {
        expect(p.count).toBeGreaterThanOrEqual(1);
        expect(p.count).toBeLessThanOrEqual(50);
      } else if (p.kind === "missing-sequence") {
        const answers = p.answer.split(", ").map(Number);
        let k = 0;
        const full = p.sequence.map((n) => n ?? answers[k++]);
        const step = full[1] - full[0];
        expect(Math.abs(step)).toBe(1);
        full.forEach((n, i) => i > 0 && expect(n - full[i - 1]).toBe(step));
        expect(p.sequence[0]).not.toBeNull();
        expect(Math.min(...full)).toBeGreaterThanOrEqual(1);
        expect(Math.max(...full)).toBeLessThanOrEqual(50);
      } else {
        const next = p.answer.split(", ").map(Number);
        expect(next).toHaveLength(p.steps);
        const delta = p.direction === "forward" ? 1 : -1;
        next.forEach((n, i) => expect(n).toBe(p.start + delta * (i + 1)));
        expect(Math.min(p.start, ...next)).toBeGreaterThanOrEqual(1);
        expect(Math.max(p.start, ...next)).toBeLessThanOrEqual(50);
      }
    }
  });

  it("skips kinds the range can't fit instead of hanging", () => {
    const problems = gen({ range: { min: 1, max: 4 } });
    expect(problems.some((p) => p.kind === "missing-sequence")).toBe(false);
  });
});
