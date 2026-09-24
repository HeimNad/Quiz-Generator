import { QuizConfig, Topic } from "./math-generator";

export type Preset = {
  id: string;
  name: string;
  description: string;
  topic: Topic;
  config: Partial<QuizConfig>;
  defaultTitle?: string;
  defaultInstructions?: string;
};

export const PRESETS: Preset[] = [
  // ARITHMETIC - ADD/SUB
  {
    id: "basic-add-sub",
    name: "基础加减法 (Basic +/-)",
    description: "20以内的加减运算，适合一年级。",
    topic: "add-sub",
    defaultTitle: "Addition and Subtraction (within 20)",
    defaultInstructions: "Solve the following problems.",
    config: { numberType: "integer", operations: ["add", "subtract"], minNumber: 0, maxNumber: 20 },
  },
  {
    id: "multi-digit",
    name: "多位数运算 (Multi-Digit)",
    description: "两位数、三位数的加减法。",
    topic: "add-sub",
    defaultTitle: "Multi-Digit Addition and Subtraction",
    defaultInstructions: "Calculate carefully, paying attention to carrying and borrowing.",
    config: { numberType: "integer", operations: ["add", "subtract"], minNumber: 10, maxNumber: 1000 },
  },
  
  // ARITHMETIC - MUL/DIV
  {
    id: "multiplication",
    name: "乘法练习 (Multiplication)",
    description: "九九乘法表及简单两位数乘法。",
    topic: "mul-div",
    defaultTitle: "Multiplication Practice",
    defaultInstructions: "Practice multiplication facts and calculate.",
    config: { numberType: "integer", operations: ["multiply"], minNumber: 1, maxNumber: 12 },
  },
  {
    id: "division-basic",
    name: "除法基础 (Basic Division)",
    description: "整除练习，适合三年级。",
    topic: "mul-div",
    defaultTitle: "Basic Division",
    defaultInstructions: "Calculate the following division problems.",
    config: { numberType: "integer", operations: ["divide"], minNumber: 1, maxNumber: 81 },
  },

  // FRACTIONS & DECIMALS
  {
    id: "fractions-basic",
    name: "分数运算 (Fractions)",
    description: "分数的加减乘除运算。",
    topic: "fraction-decimal",
    defaultTitle: "Fraction Operations Practice",
    defaultInstructions: "Solve the following fraction problems, simplify results.",
    config: { numberType: "fraction", operations: ["add", "subtract", "multiply", "divide"], maxDenominator: 12 },
  },
  {
    id: "decimal-ops",
    name: "小数运算 (Decimals)",
    description: "小数的加减乘除。",
    topic: "fraction-decimal",
    defaultTitle: "Decimal Operations Test",
    defaultInstructions: "Pay attention to the decimal point position.",
    config: { numberType: "decimal", operations: ["add", "subtract", "multiply", "divide"], minNumber: 0, maxNumber: 20, decimalPlaces: 1, maxDecimalPlaces: 2, decimalSimpleMode: true },
  },
  
  // NUMBER SENSE
  {
    id: "rounding-int",
    name: "整数四舍五入 (Rounding)",
    description: "将整数近似到十位或百位。",
    topic: "number-sense",
    defaultTitle: "Integer Rounding Practice",
    defaultInstructions: "Round the following numbers as required.",
    config: { numberType: "integer", operations: ["round"], minNumber: 10, maxNumber: 1000 },
  },
  {
    id: "rounding-dec",
    name: "小数四舍五入 (Rounding)",
    description: "将小数近似到整数或十分位。",
    topic: "number-sense",
    defaultTitle: "Decimal Rounding",
    defaultInstructions: "Retain the specified number of decimal places as required.",
    config: { numberType: "decimal", operations: ["round"], minNumber: 0, maxNumber: 100, decimalPlaces: 4, roundingTargets: [1] },
  },
  {
    id: "counting",
    name: "数数练习 (Counting)",
    description: "数图形、填空缺数字、顺数倒数，适合一年级。",
    topic: "number-sense",
    defaultTitle: "Grade 1 Counting Practice",
    defaultInstructions: "Count carefully. Write the missing numbers.",
    config: {
      numberType: "integer",
      operations: ["count-shapes", "missing-sequence", "count-sequence"],
      countingCounts: { "count-shapes": 10, "missing-sequence": 10, "count-sequence": 10 },
      minNumber: 1,
      maxNumber: 50,
      countDirection: "both",
      maxBlanks: 2,
      countNextCount: 3,
    },
  },
  {
    id: "comparison",
    name: "比大小 (Comparison)",
    description: "比较两个数字的大小 (<, >, =)。",
    topic: "number-sense",
    defaultTitle: "Number Comparison",
    defaultInstructions: "Fill in >, < or = in the circle.",
    config: { numberType: "integer", operations: ["compare"], minNumber: 0, maxNumber: 100 },
  },
  
  // SPECIAL
  {
    id: "missing-number",
    name: "填空题 (Missing Number)",
    description: "求算式中的未知数，如 5 + ? = 12。",
    topic: "add-sub",
    defaultTitle: "Missing Number Problems",
    defaultInstructions: "Fill in the missing numbers on the lines.",
    config: { numberType: "integer", operations: ["add", "subtract"], minNumber: 0, maxNumber: 20, specialRule: "missing-number" },
  },
  {
    id: "special-sub-hundred",
    name: "整百减法 (Special Sub)",
    description: "如 100 - 34，专门练习借位技巧。",
    topic: "add-sub",
    defaultTitle: "Hundreds Subtraction Practice",
    defaultInstructions: "Solve the following problems.",
    config: { 
      numberType: "integer", 
      operations: ["subtract"], 
      minNumber: 100, 
      maxNumber: 900, 
      specialRule: "round-hundred-minus-two-digit" 
    },
  },
  // PERCENT
  {
    id: "percent-of-integer",
    name: "百分数计算 (Percent)",
    description: "整数百分之几 / 分数转百分数 / 小数转百分数",
    topic: "percent",
    defaultTitle: "Percent Calculation Practice",
    defaultInstructions: "Calculate the following percent problems.",
    config: {
      count: 30,
      numberType: "integer",
      operations: ["percent-of", "fraction-to-percent", "decimal-to-percent"],
      minNumber: 10,
      maxNumber: 200,
      percentages: [5, 10, 15, 20, 25, 30, 50, 60, 75, 90],
      percentRoundBase: true,
      allowNegative: false,
      decimalPlaces: 1,
    },
  },

  {
    id: "custom",
    name: "自定义设置 (Custom)",
    description: "完全自定义所有参数。",
    topic: "add-sub",
    defaultTitle: "Math Practice Worksheet",
    defaultInstructions: "Complete the following problems.",
    config: { numberType: "integer", operations: ["add", "subtract"], minNumber: 1, maxNumber: 20 },
  }
];

export function getPresetById(id: string): Preset | undefined {
  return PRESETS.find(p => p.id === id);
}
