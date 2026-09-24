import { describe, expect, it } from "vitest";
import { createRng } from "@/lib/random";
import { arithmeticType, type ArithmeticConfig, type ArithmeticProblem } from "./index";

const base = arithmeticType.defaultConfig;
const gen = (patch: Partial<ArithmeticConfig>, seed = 1) =>
  arithmeticType.generate({ ...base, ...patch }, createRng(seed));

/** Recompute the result of a problem from its operands */
function evaluate(p: ArithmeticProblem): number {
  const [a, b] = p.operands;
  switch (p.op) {
    case "add":
      return a + b;
    case "subtract":
      return a - b;
    case "multiply":
      return a * b;
    case "divide":
      return a / b;
  }
}

const close = (a: number, b: number) => Math.abs(a - b) < 1e-9;

describe("arithmetic", () => {
  it("is deterministic for a seed", () => {
    expect(gen({}, 42)).toEqual(gen({}, 42));
  });

  it("generates the requested count with correct answers", () => {
    const problems = gen({ count: 30, operations: ["add", "subtract", "multiply", "divide"], range: { min: 1, max: 20 } });
    expect(problems).toHaveLength(30);
    for (const p of problems) expect(close(Number(p.result), evaluate(p))).toBe(true);
  });

  it("keeps operands inside the range", () => {
    const problems = gen({ count: 50, operations: ["add"], range: { min: 5, max: 15 } }, 7);
    for (const p of problems) {
      for (const n of p.operands) {
        expect(n).toBeGreaterThanOrEqual(5);
        expect(n).toBeLessThanOrEqual(15);
      }
    }
  });

  it("honours exclusive boundaries", () => {
    const problems = gen({ count: 40, operations: ["add"], range: { min: 1, max: 10, minExclusive: true, maxExclusive: true } });
    for (const n of problems.flatMap((p) => p.operands)) {
      expect(n).toBeGreaterThan(1);
      expect(n).toBeLessThan(10);
    }
  });

  it("uses the second-operand range", () => {
    const problems = gen({ count: 30, operations: ["subtract"], range: { min: 50, max: 99 }, range2: { min: 1, max: 9 } });
    for (const p of problems) expect(p.operands[1]).toBeLessThanOrEqual(9);
  });

  it("never goes negative unless allowed", () => {
    const problems = gen({ count: 50, operations: ["subtract"], range: { min: 0, max: 20 } }, 3);
    for (const p of problems) expect(Number(p.result)).toBeGreaterThanOrEqual(0);
  });

  it("forces carrying and borrowing", () => {
    for (const p of gen({ count: 30, operations: ["add"], range: { min: 10, max: 99 }, forceCarrying: true })) {
      const [a, b] = p.operands;
      expect((a % 10) + (b % 10) >= 10 || (Math.floor(a / 10) % 10) + (Math.floor(b / 10) % 10) >= 10).toBe(true);
    }
    for (const p of gen({ count: 30, operations: ["subtract"], range: { min: 10, max: 99 }, forceBorrowing: true })) {
      const [a, b] = p.operands;
      expect(a % 10 < b % 10 || Math.floor(a / 10) % 10 < Math.floor(b / 10) % 10).toBe(true);
    }
  });

  it("divides exactly for integers", () => {
    for (const p of gen({ count: 30, operations: ["divide"], range: { min: 1, max: 81 } })) {
      expect(Number.isInteger(evaluate(p))).toBe(true);
    }
  });

  it("puts the answer in the blank for missing-number problems", () => {
    for (const p of gen({ count: 30, format: "missing-number", range: { min: 0, max: 20 } })) {
      expect(p.blank).not.toBeNull();
      expect(Number(p.answer)).toBe(p.operands[p.blank!]);
      expect(close(Number(p.result), evaluate(p))).toBe(true);
    }
  });

  it("keeps all decimal places of a product (1.5 × 1.5 = 2.25)", () => {
    const problems = gen({
      count: 40,
      numberType: "decimal",
      operations: ["multiply"],
      range: { min: 0, max: 10 },
      places: { min: 1, max: 2 },
    });
    for (const p of problems) expect(close(Number(p.result), evaluate(p))).toBe(true);
  });

  it("decimal simple mode divides by a whole number and never borrows", () => {
    const cfg: Partial<ArithmeticConfig> = {
      count: 40,
      numberType: "decimal",
      operations: ["divide", "subtract"],
      range: { min: 0, max: 20 },
      places: { min: 1, max: 1 },
      decimalSimpleMode: true,
    };
    for (const p of gen(cfg)) {
      expect(close(Number(p.result), evaluate(p))).toBe(true);
      if (p.op === "divide") expect(Number.isInteger(p.operands[1])).toBe(true);
      if (p.op === "subtract") {
        const tenths = (n: number) => Math.round(n * 10) % 10;
        expect(tenths(p.operands[0])).toBeGreaterThanOrEqual(tenths(p.operands[1]));
      }
    }
  });

  it("round-hundred rule subtracts a two-digit number from a hundred", () => {
    const problems = gen({ count: 20, operations: ["subtract"], range: { min: 100, max: 900 }, specialRule: "round-hundred" });
    for (const p of problems) {
      expect(p.operands[0] % 100).toBe(0);
      expect(p.operands[1]).toBeGreaterThanOrEqual(10);
      expect(p.operands[1]).toBeLessThanOrEqual(99);
    }
  });

  it("returns fewer problems instead of looping when the range is too small", () => {
    expect(gen({ count: 50, operations: ["add"], range: { min: 1, max: 2 } }).length).toBeLessThan(50);
  });
});
