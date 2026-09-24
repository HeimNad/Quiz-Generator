"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calculator } from "lucide-react";
import type { ArithOp, ArithmeticConfig, PlacesRange } from "@/lib/problems/arithmetic";
import {
  CheckboxGroup,
  FieldLabel,
  NumberField,
  OptionalNumberInput,
  RangeFields,
  RulesSection,
  SelectField,
  SwitchField,
  type PanelProps,
} from "./fields";

const OP_LABELS: Record<ArithOp, string> = {
  add: "加法 (+)",
  subtract: "减法 (-)",
  multiply: "乘法 (×)",
  divide: "除法 (÷)",
};

const HUNDREDS = [100, 200, 300, 400, 500, 600, 700, 800, 900];

function PlacesFields({ places, onChange }: { places: PlacesRange; onChange: (p: PlacesRange) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <NumberField label="最少" value={places.min} onChange={(min) => onChange({ ...places, min })} min={0} max={4} />
      <NumberField label="最多" value={places.max} onChange={(max) => onChange({ ...places, max })} min={0} max={4} />
    </div>
  );
}

export function ArithmeticPanel({ config, onChange }: PanelProps<ArithmeticConfig>) {
  const set = (patch: Partial<ArithmeticConfig>) => onChange({ ...config, ...patch });
  const isInteger = config.numberType === "integer";
  const has = (op: ArithOp) => config.operations.includes(op);

  return (
    <>
      {config.allowedOperations.length > 1 && (
        <CheckboxGroup
          id="op"
          label={
            <span className="flex items-center gap-1">
              <Calculator className="h-3 w-3" /> 运算类型
            </span>
          }
          columns={2}
          options={config.allowedOperations.map((op) => ({ value: op, label: OP_LABELS[op] }))}
          selected={config.operations}
          onChange={(operations) => set({ operations })}
        />
      )}

      <RangeFields id="range" range={config.range} onChange={(range) => set({ range })} withInclusive />

      <div className="pt-2 space-y-2">
        <FieldLabel>第二个数范围 (可选)</FieldLabel>
        <div className="grid grid-cols-2 gap-3">
          {(["min", "max"] as const).map((bound) => {
            const excl = bound === "min" ? "minExclusive" : "maxExclusive";
            return (
              <div key={bound} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-slate-400">{bound === "min" ? "最小值" : "最大值"} (Num2)</Label>
                  {config.range2[bound] !== undefined && (
                    <div className="flex items-center gap-1">
                      <Checkbox
                        id={`range2-${bound}-inclusive`}
                        checked={!config.range2[excl]}
                        onCheckedChange={(c) => set({ range2: { ...config.range2, [excl]: c !== true } })}
                      />
                      <Label
                        htmlFor={`range2-${bound}-inclusive`}
                        className="text-[10px] text-slate-400 cursor-pointer font-normal"
                      >
                        取得到
                      </Label>
                    </div>
                  )}
                </div>
                <OptionalNumberInput
                  value={config.range2[bound]}
                  onChange={(v) => set({ range2: { ...config.range2, [bound]: v } })}
                />
              </div>
            );
          })}
        </div>
      </div>

      {!isInteger && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>小数位数</Label>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400">分开左右</span>
              <Switch
                checked={config.separatePlaces}
                onCheckedChange={(c) =>
                  // Start the right side from the left side's setting
                  set({ separatePlaces: c, places2: c ? { ...config.places } : config.places2 })
                }
              />
            </div>
          </div>
          {config.separatePlaces ? (
            <div className="space-y-2">
              <Label className="text-xs text-slate-500 block">左边 (num1)</Label>
              <PlacesFields places={config.places} onChange={(places) => set({ places })} />
              <Label className="text-xs text-slate-500 block">右边 (num2)</Label>
              <PlacesFields places={config.places2} onChange={(places2) => set({ places2 })} />
            </div>
          ) : (
            <PlacesFields places={config.places} onChange={(places) => set({ places })} />
          )}
        </div>
      )}

      <RulesSection>
        <SelectField
          label="题目形式"
          value={config.format}
          options={[
            { value: "standard", label: "标准计算 (e.g. 3 + 5 = ?)" },
            { value: "missing-number", label: "求未知数 (e.g. 3 + ? = 8)" },
          ]}
          onChange={(format) => set({ format })}
        />

        {isInteger && (
          <div className="space-y-2">
            <FieldLabel>排版格式</FieldLabel>
            <div className="flex gap-2">
              {(
                [
                  ["horizontal", "横式"],
                  ["vertical", "竖式"],
                ] as const
              ).map(([value, label]) => (
                <Button
                  key={value}
                  variant={config.displayFormat === value ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => set({ displayFormat: value })}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {!isInteger && (
          <SwitchField
            label="简单模式"
            hint="乘除法第二个数为整数 (如 1.2 × 3)，减法不借位"
            checked={config.decimalSimpleMode}
            onChange={(decimalSimpleMode) => set({ decimalSimpleMode })}
          />
        )}

        <div className="space-y-3">
          {has("add") && isInteger && (
            <SwitchField
              label="强制进位"
              hint="加法必须进位"
              checked={config.forceCarrying}
              onChange={(forceCarrying) => set({ forceCarrying })}
            />
          )}
          {has("subtract") && isInteger && (
            <SwitchField
              label="强制退位"
              hint="减法必须借位"
              checked={config.forceBorrowing}
              onChange={(forceBorrowing) => set({ forceBorrowing })}
            />
          )}
          {has("subtract") && (
            <SwitchField
              label="允许负数"
              hint="结果可为负"
              checked={config.allowNegative}
              onChange={(allowNegative) => set({ allowNegative })}
            />
          )}
        </div>

        {config.specialRule === "round-hundred" && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800 space-y-3">
            <div className="text-xs text-yellow-700 dark:text-yellow-400 font-medium">专项规则：整百数减两位数</div>
            <SelectField
              label="指定被减数"
              value={config.fixedFirstOperand ? String(config.fixedFirstOperand) : "random"}
              options={[
                { value: "random", label: "随机 (100-900)" },
                ...HUNDREDS.map((h) => ({ value: String(h), label: String(h) })),
              ]}
              onChange={(v) => set({ fixedFirstOperand: v === "random" ? undefined : parseInt(v) })}
            />
          </div>
        )}
      </RulesSection>
    </>
  );
}
