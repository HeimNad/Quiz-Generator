"use client";

import type { CompareConfig } from "@/lib/problems/compare";
import { NumberField, RangeFields, type PanelProps } from "./fields";

export function ComparePanel({ config, onChange }: PanelProps<CompareConfig>) {
  return (
    <>
      <RangeFields id="range" range={config.range} onChange={(range) => onChange({ ...config, range })} />
      {config.numberType === "decimal" && (
        <NumberField
          label="小数位数"
          value={config.places}
          onChange={(places) => onChange({ ...config, places })}
          min={1}
          max={4}
        />
      )}
    </>
  );
}
