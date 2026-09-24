import type { jsPDF } from "jspdf";
import type { Rng } from "@/lib/random";
import type { Token } from "@/lib/pdf/tokens";

/** Every problem type's config carries a question count */
export interface BaseConfig {
  count: number;
}

export interface BaseProblem {
  id: string;
  /** Plain-text answer, used by tests and as a fallback */
  answer: string;
}

export interface DrawContext {
  doc: jsPDF;
  /** Font family name registered on the doc */
  font: string;
}

export interface Cell {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Column addition/subtraction layout (竖式) */
export interface VerticalSpec {
  top: string;
  op: string;
  bottom: string;
  answer: string;
}

/** Problems printed in a grid of equation cells */
export interface GridLayout<C, P> {
  kind: "grid";
  question(problem: P): Token[];
  answer(problem: P): Token[];
  /** Return a spec to print this problem as 竖式; null keeps it horizontal */
  vertical?(problem: P, config: C): VerticalSpec | null;
  /** Whether the sheet uses the taller vertical grid */
  isVertical?(config: C): boolean;
}

/** Problems printed as full-width cards with custom drawing */
export interface CardLayout<P> {
  kind: "card";
  height(problem: P): number;
  draw(ctx: DrawContext, cell: Cell, problem: P, number: number | null): void;
  answer(problem: P): Token[];
  /** A new page starts whenever this value changes between problems */
  section?(problem: P): string;
}

export interface ProblemType<C extends BaseConfig, P extends BaseProblem> {
  id: string;
  label: string;
  defaultConfig: C;
  generate(config: C, rng: Rng): P[];
  /** For types that size themselves (e.g. a count per sub-type) instead of config.count */
  totalCount?(config: C): number;
  /** Short tags for the preset card on the home page */
  tags(config: C): string[];
  layout: GridLayout<C, P> | CardLayout<P>;
}

export function defineProblemType<C extends BaseConfig, P extends BaseProblem>(
  type: ProblemType<C, P>
): ProblemType<C, P> {
  return type;
}
