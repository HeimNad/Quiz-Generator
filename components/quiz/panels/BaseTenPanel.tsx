"use client";

import type { BaseTenConfig, BaseTenOp, Regrouping } from "@/lib/problems/base-ten";
import { CheckboxGroup, RangeFields, RulesSection, SelectField, type PanelProps } from "./fields";

const OPS: { value: BaseTenOp; label: string }[] = [
  { value: "add", label: "加法 (+)" },
  { value: "subtract", label: "减法 (-)" },
];

const REGROUPING: { value: Regrouping; label: string }[] = [
  { value: "without", label: "不进位 / 不退位 (Without Regrouping)" },
  { value: "with", label: "进位 / 退位 (With Regrouping)" },
  { value: "mixed", label: "混合" },
];

export function BaseTenPanel({ config, onChange }: PanelProps<BaseTenConfig>) {
  const set = (patch: Partial<BaseTenConfig>) => onChange({ ...config, ...patch });
  return (
    <>
      <CheckboxGroup
        id="op"
        label="运算类型"
        columns={2}
        options={OPS}
        selected={config.operations}
        onChange={(operations) => set({ operations })}
      />
      <RangeFields id="range" range={config.range} onChange={(range) => set({ range })} />
      <p className="text-[10px] text-slate-500">
        只有十位和个位两栏：加法的和不超过 99。减法只画被减数的方块，学生划掉要减去的部分。
      </p>
      <RulesSection>
        <SelectField
          label="进位 / 退位"
          value={config.regrouping}
          options={REGROUPING}
          onChange={(regrouping) => set({ regrouping })}
        />
      </RulesSection>
    </>
  );
}
