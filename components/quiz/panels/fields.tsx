"use client";

import type { ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SafeNumberInput } from "@/components/ui/safe-number-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Settings2 } from "lucide-react";
import type { NumberRange } from "@/lib/problems/shared";
import { toggleInList } from "@/lib/problems/shared";

export interface PanelProps<C> {
  config: C;
  onChange: (config: C) => void;
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <Label className="text-xs text-slate-500 uppercase font-semibold">{children}</Label>;
}

/** Divider + "规则与难度" heading used by every panel */
export function RulesSection({ children }: { children: ReactNode }) {
  return (
    <>
      <Separator />
      <div className="space-y-4">
        <h4 className="text-sm font-medium flex items-center text-slate-500">
          <Settings2 className="mr-2 h-4 w-4" /> 规则与难度
        </h4>
        {children}
      </div>
    </>
  );
}

export function NumberField(props: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  defaultValue?: number;
}) {
  return (
    <div className="space-y-2">
      <Label>{props.label}</Label>
      <SafeNumberInput
        value={props.value}
        onValueChange={props.onChange}
        min={props.min}
        max={props.max}
        defaultValue={props.defaultValue ?? props.value}
      />
    </div>
  );
}

export function SwitchField(props: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label className="text-sm">{props.label}</Label>
        {props.hint && <p className="text-[10px] text-slate-500">{props.hint}</p>}
      </div>
      <Switch checked={props.checked} onCheckedChange={props.onChange} />
    </div>
  );
}

export function SelectField<T extends string>(props: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-2">
      <FieldLabel>{props.label}</FieldLabel>
      <Select value={props.value} onValueChange={(v) => props.onChange(v as T)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {props.options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Multi-select checkboxes that always keep at least one item selected */
export function CheckboxGroup<T extends string | number>(props: {
  id: string;
  label?: ReactNode;
  options: { value: T; label: string }[];
  selected: T[];
  onChange: (v: T[]) => void;
  columns?: 1 | 2 | 3;
  /** Extra control to show next to a selected option */
  renderExtra?: (value: T) => ReactNode;
}) {
  const cols = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3" }[props.columns ?? 1];
  return (
    <div className="space-y-2">
      {props.label && <FieldLabel>{props.label}</FieldLabel>}
      <div className={`grid ${cols} gap-2`}>
        {props.options.map(({ value, label }) => {
          const id = `${props.id}-${value}`;
          const checked = props.selected.includes(value);
          return (
            <div key={String(value)} className="flex items-center gap-2">
              <Checkbox
                id={id}
                checked={checked}
                disabled={checked && props.selected.length === 1}
                onCheckedChange={(c) => props.onChange(toggleInList(props.selected, value, c === true))}
              />
              <Label htmlFor={id} className="flex-1 text-sm font-normal cursor-pointer">
                {label}
              </Label>
              {checked && props.renderExtra?.(value)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BoundField(props: {
  id: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  inclusive?: { checked: boolean; onChange: (v: boolean) => void };
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{props.label}</Label>
        {props.inclusive && (
          <div className="flex items-center gap-1">
            <Checkbox
              id={props.id}
              checked={props.inclusive.checked}
              onCheckedChange={(c) => props.inclusive!.onChange(c === true)}
            />
            <Label htmlFor={props.id} className="text-[10px] text-slate-400 cursor-pointer font-normal">
              取得到
            </Label>
          </div>
        )}
      </div>
      <SafeNumberInput value={props.value} onValueChange={props.onChange} defaultValue={props.value} />
    </div>
  );
}

/** Min/max inputs; `withInclusive` adds the 取得到 checkboxes */
export function RangeFields(props: {
  id: string;
  range: NumberRange;
  onChange: (r: NumberRange) => void;
  minLabel?: string;
  maxLabel?: string;
  withInclusive?: boolean;
}) {
  const { range, onChange } = props;
  return (
    <div className="grid grid-cols-2 gap-3">
      <BoundField
        id={`${props.id}-min-inclusive`}
        label={props.minLabel ?? "最小值"}
        value={range.min}
        onChange={(min) => onChange({ ...range, min })}
        inclusive={
          props.withInclusive
            ? { checked: !range.minExclusive, onChange: (c) => onChange({ ...range, minExclusive: !c }) }
            : undefined
        }
      />
      <BoundField
        id={`${props.id}-max-inclusive`}
        label={props.maxLabel ?? "最大值"}
        value={range.max}
        onChange={(max) => onChange({ ...range, max })}
        inclusive={
          props.withInclusive
            ? { checked: !range.maxExclusive, onChange: (c) => onChange({ ...range, maxExclusive: !c }) }
            : undefined
        }
      />
    </div>
  );
}

/** A number input that may be left empty (undefined = use the default) */
export function OptionalNumberInput(props: { value: number | undefined; onChange: (v: number | undefined) => void }) {
  return (
    <Input
      type="number"
      placeholder="默认"
      value={props.value ?? ""}
      onChange={(e) => props.onChange(e.target.value === "" ? undefined : parseInt(e.target.value))}
    />
  );
}
