"use client";

import { PERCENT_CHOICES, type PercentConfig, type PercentKind } from "@/lib/problems/percent";
import { CheckboxGroup, NumberField, RangeFields, RulesSection, SwitchField, type PanelProps } from "./fields";

const KINDS: { value: PercentKind; label: string }[] = [
  { value: "percent-of", label: "X% of N = ?" },
  { value: "fraction-to-percent", label: "分数转百分数 (1/2 = ?%)" },
  { value: "decimal-to-percent", label: "小数转百分数 (0.5 = ?%)" },
];

export function PercentPanel({ config, onChange }: PanelProps<PercentConfig>) {
  const set = (patch: Partial<PercentConfig>) => onChange({ ...config, ...patch });
  const has = (k: PercentKind) => config.kinds.includes(k);

  return (
    <>
      <CheckboxGroup id="kind" label="题目类型" options={KINDS} selected={config.kinds} onChange={(kinds) => set({ kinds })} />
      {has("percent-of") && (
        <RangeFields
          id="range"
          range={config.range}
          onChange={(range) => set({ range })}
          minLabel="底数最小值"
          maxLabel="底数最大值"
        />
      )}
      <RulesSection>
        {has("percent-of") && (
          <>
            <CheckboxGroup
              id="pct"
              label="使用的百分数 (X% of N)"
              columns={3}
              options={PERCENT_CHOICES.map((p) => ({ value: p, label: `${p}%` }))}
              selected={config.percentages}
              onChange={(percentages) => set({ percentages })}
            />
            <SwitchField
              label="简单模式"
              hint="底数只取10的整倍数 (如50, 100)"
              checked={config.roundBase}
              onChange={(roundBase) => set({ roundBase })}
            />
          </>
        )}
        {has("decimal-to-percent") && (
          <NumberField
            label="小数位数 (小数转百分数)"
            value={config.places}
            onChange={(places) => set({ places })}
            min={1}
            max={2}
          />
        )}
      </RulesSection>
    </>
  );
}
