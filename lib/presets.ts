import { getProblemType, type ConfigOf, type ProblemTypeId } from "./problems/registry";
import type { BaseConfig } from "./problems/types";

/** Home page categories */
export type Category = "add-sub" | "mul-div" | "fraction-decimal" | "number-sense" | "percent";

interface PresetOf<Id extends ProblemTypeId> {
  id: string;
  name: string;
  description: string;
  category: Category;
  type: Id;
  /** Overrides on top of the type's defaultConfig (shallow merge) */
  config: Partial<ConfigOf<Id>>;
  defaultTitle: string;
  defaultInstructions: string;
}

export type Preset = { [Id in ProblemTypeId]: PresetOf<Id> }[ProblemTypeId];

export const PRESETS: Preset[] = [
  // ADD / SUB
  {
    id: "basic-add-sub",
    name: "基础加减法 (Basic +/-)",
    description: "20以内的加减运算，适合一年级。",
    category: "add-sub",
    type: "arithmetic",
    defaultTitle: "Addition and Subtraction (within 20)",
    defaultInstructions: "Solve the following problems.",
    config: { operations: ["add", "subtract"], allowedOperations: ["add", "subtract"], range: { min: 0, max: 20 } },
  },
  {
    id: "base-ten-addition",
    name: "十位个位加法 (Base Ten Blocks)",
    description: "两位数加法，配十位棒和个位方块图示，可选是否进位。",
    category: "add-sub",
    type: "base-ten",
    defaultTitle: "Two-Digit Addition with Base Ten Blocks",
    defaultInstructions: "Use the blocks to help you add. Write the answer in the table.",
    config: {},
  },
  {
    id: "multi-digit",
    name: "多位数运算 (Multi-Digit)",
    description: "两位数、三位数的加减法。",
    category: "add-sub",
    type: "arithmetic",
    defaultTitle: "Multi-Digit Addition and Subtraction",
    defaultInstructions: "Calculate carefully, paying attention to carrying and borrowing.",
    config: { operations: ["add", "subtract"], allowedOperations: ["add", "subtract"], range: { min: 10, max: 1000 } },
  },

  // MUL / DIV
  {
    id: "multiplication",
    name: "乘法练习 (Multiplication)",
    description: "九九乘法表及简单两位数乘法。",
    category: "mul-div",
    type: "arithmetic",
    defaultTitle: "Multiplication Practice",
    defaultInstructions: "Practice multiplication facts and calculate.",
    config: { operations: ["multiply"], allowedOperations: ["multiply"], range: { min: 1, max: 12 } },
  },
  {
    id: "division-basic",
    name: "除法基础 (Basic Division)",
    description: "整除练习，适合三年级。",
    category: "mul-div",
    type: "arithmetic",
    defaultTitle: "Basic Division",
    defaultInstructions: "Calculate the following division problems.",
    config: { operations: ["divide"], allowedOperations: ["divide"], range: { min: 1, max: 81 } },
  },

  // FRACTIONS & DECIMALS
  {
    id: "fractions-basic",
    name: "分数运算 (Fractions)",
    description: "分数的加减乘除运算。",
    category: "fraction-decimal",
    type: "fraction",
    defaultTitle: "Fraction Operations Practice",
    defaultInstructions: "Solve the following fraction problems, simplify results.",
    config: { maxDenominator: 12 },
  },
  {
    id: "decimal-ops",
    name: "小数运算 (Decimals)",
    description: "小数的加减乘除。",
    category: "fraction-decimal",
    type: "arithmetic",
    defaultTitle: "Decimal Operations Test",
    defaultInstructions: "Pay attention to the decimal point position.",
    config: {
      numberType: "decimal",
      operations: ["add", "subtract", "multiply", "divide"],
      range: { min: 0, max: 20 },
      places: { min: 1, max: 2 },
      decimalSimpleMode: true,
    },
  },

  // NUMBER SENSE
  {
    id: "rounding-int",
    name: "整数四舍五入 (Rounding)",
    description: "将整数近似到十位或百位。",
    category: "number-sense",
    type: "rounding",
    defaultTitle: "Integer Rounding Practice",
    defaultInstructions: "Round the following numbers as required.",
    config: { numberType: "integer", range: { min: 10, max: 1000 } },
  },
  {
    id: "rounding-dec",
    name: "小数四舍五入 (Rounding)",
    description: "将小数近似到整数或十分位。",
    category: "number-sense",
    type: "rounding",
    defaultTitle: "Decimal Rounding",
    defaultInstructions: "Retain the specified number of decimal places as required.",
    config: { numberType: "decimal", range: { min: 0, max: 100 }, places: 4, targets: [1] },
  },
  {
    id: "counting",
    name: "数数练习 (Counting)",
    description: "数图形、填空缺数字、顺数倒数，适合一年级。",
    category: "number-sense",
    type: "counting",
    defaultTitle: "Grade 1 Counting Practice",
    defaultInstructions: "Count carefully. Write the missing numbers.",
    config: {},
  },
  {
    id: "number-words",
    name: "英文数字 (Number Words)",
    description: "数字写成英文单词，英文单词写成数字，如 93 → ninety-three。",
    category: "number-sense",
    type: "number-words",
    defaultTitle: "Numbers in Words",
    defaultInstructions: "Write each number in words, or write the number for the words.",
    config: {},
  },
  {
    id: "comparison",
    name: "比大小 (Comparison)",
    description: "比较两个数字的大小 (<, >, =)。",
    category: "number-sense",
    type: "compare",
    defaultTitle: "Number Comparison",
    defaultInstructions: "Fill in >, < or = in the circle.",
    config: { range: { min: 0, max: 100 } },
  },

  // SPECIAL
  {
    id: "missing-number",
    name: "填空题 (Missing Number)",
    description: "求算式中的未知数，如 5 + ? = 12。",
    category: "add-sub",
    type: "arithmetic",
    defaultTitle: "Missing Number Problems",
    defaultInstructions: "Fill in the missing numbers on the lines.",
    config: {
      operations: ["add", "subtract"],
      allowedOperations: ["add", "subtract"],
      range: { min: 0, max: 20 },
      format: "missing-number",
    },
  },
  {
    id: "special-sub-hundred",
    name: "整百减法 (Special Sub)",
    description: "如 100 - 34，专门练习借位技巧。",
    category: "add-sub",
    type: "arithmetic",
    defaultTitle: "Hundreds Subtraction Practice",
    defaultInstructions: "Solve the following problems.",
    config: {
      operations: ["subtract"],
      allowedOperations: ["subtract"],
      range: { min: 100, max: 900 },
      specialRule: "round-hundred",
    },
  },

  // PERCENT
  {
    id: "percent-of-integer",
    name: "百分数计算 (Percent)",
    description: "整数百分之几 / 分数转百分数 / 小数转百分数",
    category: "percent",
    type: "percent",
    defaultTitle: "Percent Calculation Practice",
    defaultInstructions: "Calculate the following percent problems.",
    config: { percentages: [5, 10, 15, 20, 25, 30, 50, 60, 75, 90] },
  },

  {
    id: "custom",
    name: "自定义设置 (Custom)",
    description: "完全自定义所有参数。",
    category: "add-sub",
    type: "arithmetic",
    defaultTitle: "Math Practice Worksheet",
    defaultInstructions: "Complete the following problems.",
    config: {},
  },
];

export function getPresetById(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}

/** The preset's full starting config: type defaults + preset overrides */
export function presetConfig(preset: Preset): BaseConfig {
  return { ...getProblemType(preset.type).defaultConfig, ...preset.config };
}

export function presetTags(preset: Preset): string[] {
  return getProblemType(preset.type).tags(presetConfig(preset));
}
