"use client";

import { QuizConfig } from "@/lib/math-generator";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RuleConfigProps {
  config: QuizConfig;
  setConfig: (config: QuizConfig) => void;
}

export function RoundHundredConfig({ config, setConfig }: RuleConfigProps) {
  return (
    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800 space-y-3">
      <div className="text-xs text-yellow-700 dark:text-yellow-400 font-medium">
        专项规则：整百数减两位数
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-yellow-800 dark:text-yellow-300">
          指定被减数
        </Label>
        <Select
          value={config.fixedFirstOperand?.toString() || "random"}
          onValueChange={(v) =>
            setConfig({
              ...config,
              fixedFirstOperand: v === "random" ? undefined : parseInt(v),
            })
          }
        >
          <SelectTrigger className="h-8 bg-white dark:bg-slate-950">
            <SelectValue placeholder="随机" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="random">随机 (100-900)</SelectItem>
            <SelectItem value="100">100</SelectItem>
            <SelectItem value="200">200</SelectItem>
            <SelectItem value="300">300</SelectItem>
            <SelectItem value="400">400</SelectItem>
            <SelectItem value="500">500</SelectItem>
            <SelectItem value="600">600</SelectItem>
            <SelectItem value="700">700</SelectItem>
            <SelectItem value="800">800</SelectItem>
            <SelectItem value="900">900</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
