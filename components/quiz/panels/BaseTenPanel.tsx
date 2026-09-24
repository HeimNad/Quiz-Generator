"use client";

import type { BaseTenConfig, Regrouping } from "@/lib/problems/base-ten";
import { RangeFields, RulesSection, SelectField, type PanelProps } from "./fields";

const REGROUPING: { value: Regrouping; label: string }[] = [
  { value: "without", label: "不进位 (Without Regrouping)" },
  { value: "with", label: "进位 (With Regrouping)" },
  { value: "mixed", label: "混合" },
];

export function BaseTenPanel({ config, onChange }: PanelProps<BaseTenConfig>) {
  const set = (patch: Partial<BaseTenConfig>) => onChange({ ...config, ...patch });
  return (
    <>
      <RangeFields
        id="range"
        range={config.range}
        onChange={(range) => set({ range })}
        minLabel="加数最小值"
        maxLabel="加数最大值"
      />
      <p className="text-[10px] text-slate-500">和不超过 99（只有十位和个位两栏）</p>
      <RulesSection>
        <SelectField label="进位" value={config.regrouping} options={REGROUPING} onChange={(regrouping) => set({ regrouping })} />
      </RulesSection>
    </>
  );
}
