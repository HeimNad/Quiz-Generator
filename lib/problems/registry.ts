import { arithmeticType } from "./arithmetic";
import { compareType } from "./compare";
import { countingType } from "./counting";
import { fractionType } from "./fraction";
import { percentType } from "./percent";
import { roundingType } from "./rounding";
import type { BaseConfig, BaseProblem, ProblemType } from "./types";

/**
 * All problem types. To add one: create lib/problems/<name>/index.ts with
 * defineProblemType, add it here, and add its settings panel in
 * components/quiz/panels/index.ts.
 */
export const PROBLEM_TYPES = {
  arithmetic: arithmeticType,
  fraction: fractionType,
  compare: compareType,
  rounding: roundingType,
  percent: percentType,
  counting: countingType,
};

export type ProblemTypeId = keyof typeof PROBLEM_TYPES;

/** Config type of a given problem type */
export type ConfigOf<Id extends ProblemTypeId> = (typeof PROBLEM_TYPES)[Id]["defaultConfig"];

/**
 * A problem type with its config/problem types erased, for code that only
 * passes values between the type's own functions (editor page, PDF builder).
 */
export type AnyProblemType = ProblemType<BaseConfig, BaseProblem>;

export function getProblemType(id: ProblemTypeId): AnyProblemType {
  // Safe: callers only feed a type the configs and problems it produced itself
  return PROBLEM_TYPES[id] as unknown as AnyProblemType;
}

export function questionCount(type: AnyProblemType, config: BaseConfig): number {
  return type.totalCount ? type.totalCount(config) : config.count;
}
