"use client";

import type { ArithOp } from "@/lib/problems/arithmetic";
import type { FractionConfig, FractionRule } from "@/lib/problems/fraction";
import { CheckboxGroup, NumberField, RulesSection, SelectField, SwitchField, type PanelProps } from "./fields";

const OP_LABELS: Record<ArithOp, string> = {
  add: "加法 (+)",
  subtract: "减法 (-)",
  multiply: "乘法 (×)",
  divide: "除法 (÷)",
};

const RULES: { value: FractionRule; label: string }[] = [
  { value: "none", label: "标准分数计算" },
  { value: "integer-fraction", label: "分数与整数混合 (乘除)" },
  { value: "related-denominators", label: "异分母 (倍数关系) 加减" },
  { value: "mixed-ops-3", label: "分数加减混合 (3项)" },
];

export function FractionPanel({ config, onChange }: PanelProps<FractionConfig>) {
  const set = (patch: Partial<FractionConfig>) => onChange({ ...config, ...patch });
  return (
    <>
      <CheckboxGroup
        id="op"
        label="运算类型"
        columns={2}
        options={(Object.keys(OP_LABELS) as ArithOp[]).map((op) => ({ value: op, label: OP_LABELS[op] }))}
        selected={config.operations}
        onChange={(operations) => set({ operations })}
      />
      <NumberField
        label="最大分母"
        value={config.maxDenominator}
        onChange={(maxDenominator) => set({ maxDenominator })}
        min={2}
        max={100}
      />
      <RulesSection>
        <SelectField label="分数题型" value={config.rule} options={RULES} onChange={(rule) => set({ rule })} />
        {(config.operations.includes("subtract") || config.rule === "mixed-ops-3") && (
          <SwitchField
            label="允许负数"
            hint="结果可为负"
            checked={config.allowNegative}
            onChange={(allowNegative) => set({ allowNegative })}
          />
        )}
      </RulesSection>
    </>
  );
}
