"use client";

import { SafeNumberInput } from "@/components/ui/safe-number-input";
import type { CountDirection, CountingConfig, CountingKind, ShapeType } from "@/lib/problems/counting";
import { CheckboxGroup, NumberField, RangeFields, RulesSection, SelectField, type PanelProps } from "./fields";

const KINDS: { value: CountingKind; label: string }[] = [
  { value: "count-shapes", label: "数图形 (Count the Shapes)" },
  { value: "missing-sequence", label: "填缺数 (Missing Numbers)" },
  { value: "count-sequence", label: "顺数/倒数 (Count Forward/Backward)" },
];

const SHAPES: { value: ShapeType; label: string }[] = [
  { value: "circle", label: "圆形 ○" },
  { value: "square", label: "正方形 □" },
  { value: "triangle", label: "三角形 △" },
  { value: "diamond", label: "菱形 ◇" },
];

const DIRECTIONS: { value: CountDirection; label: string }[] = [
  { value: "both", label: "顺数 + 倒数" },
  { value: "forward", label: "只顺数 (3, 4, 5…)" },
  { value: "backward", label: "只倒数 (5, 4, 3…)" },
];

export function CountingPanel({ config, onChange }: PanelProps<CountingConfig>) {
  const set = (patch: Partial<CountingConfig>) => onChange({ ...config, ...patch });
  const has = (k: CountingKind) => config.kinds.includes(k);

  return (
    <>
      <CheckboxGroup
        id="count-kind"
        label="题目类型 / 数量"
        options={KINDS}
        selected={config.kinds}
        onChange={(kinds) => set({ kinds })}
        renderExtra={(kind) => (
          <SafeNumberInput
            className="w-16 h-8"
            value={config.counts[kind]}
            onValueChange={(n) => set({ counts: { ...config.counts, [kind]: n } })}
            defaultValue={10}
            min={1}
            max={100}
          />
        )}
      />
      <RangeFields id="range" range={config.range} onChange={(range) => set({ range })} withInclusive />
      <RulesSection>
        {has("count-shapes") && (
          <CheckboxGroup
            id="shape"
            label="使用的图形"
            columns={2}
            options={SHAPES}
            selected={config.shapes}
            onChange={(shapes) => set({ shapes })}
          />
        )}
        {(has("missing-sequence") || has("count-sequence")) && (
          <SelectField
            label="数数方向"
            value={config.direction}
            options={DIRECTIONS}
            onChange={(direction) => set({ direction })}
          />
        )}
        <div className="grid grid-cols-2 gap-3">
          {has("missing-sequence") && (
            <NumberField
              label="最多空几个"
              value={config.maxBlanks}
              onChange={(maxBlanks) => set({ maxBlanks })}
              min={1}
              max={3}
            />
          )}
          {has("count-sequence") && (
            <NumberField
              label="往后写几个数"
              value={config.nextCount}
              onChange={(nextCount) => set({ nextCount })}
              min={1}
              max={5}
            />
          )}
        </div>
      </RulesSection>
    </>
  );
}
