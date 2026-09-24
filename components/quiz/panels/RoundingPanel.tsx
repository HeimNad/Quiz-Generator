"use client";

import { ROUNDING_TARGET_NAMES, type RoundingConfig } from "@/lib/problems/rounding";
import { CheckboxGroup, NumberField, RangeFields, RulesSection, type PanelProps } from "./fields";

const TARGET_LABELS = ["整数位", "十分位", "百分位", "千分位"];

export function RoundingPanel({ config, onChange }: PanelProps<RoundingConfig>) {
  const set = (patch: Partial<RoundingConfig>) => onChange({ ...config, ...patch });
  const isDecimal = config.numberType === "decimal";
  // Only targets coarser than the number's own precision are offered
  const targets = TARGET_LABELS.map((label, value) => ({
    value,
    label: `${label} (${ROUNDING_TARGET_NAMES[value]})`,
  })).filter(({ value }) => value < config.places);

  return (
    <>
      <RangeFields id="range" range={config.range} onChange={(range) => set({ range })} />
      {isDecimal && (
        <NumberField
          label="小数位数"
          value={config.places}
          onChange={(places) => set({ places })}
          min={1}
          max={4}
        />
      )}
      {isDecimal && targets.length > 0 && (
        <RulesSection>
          <CheckboxGroup
            id="rt"
            label="四舍五入到"
            options={targets}
            selected={config.targets.filter((t) => t < config.places)}
            onChange={(t) => set({ targets: t })}
          />
        </RulesSection>
      )}
    </>
  );
}
