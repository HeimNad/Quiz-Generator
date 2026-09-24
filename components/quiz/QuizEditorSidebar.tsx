"use client";

import {
  QuizConfig,
  Operation,
  COUNTING_OPERATIONS,
  DEFAULT_COUNTING_COUNT,
  isCountingOperation,
  ShapeType,
  CountDirection,
} from "@/lib/math-generator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SafeNumberInput } from "@/components/ui/safe-number-input"; // Import SafeNumberInput
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  Settings2,
  FileText,
  RefreshCcw,
  Calculator,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { SPECIAL_RULES } from "@/lib/special-rules-registry";

interface QuizEditorSidebarProps {
  presetName: string;
  config: QuizConfig;
  setConfig: (config: QuizConfig) => void;
  allowedOperations?: Operation[];
  batchSize: number;
  setBatchSize: (size: number) => void;
  worksheetTitle: string;
  setWorksheetTitle: (title: string) => void;
  worksheetInstructions: string;
  setWorksheetInstructions: (instructions: string) => void;
  displayFormat: "horizontal" | "vertical";
  setDisplayFormat: (format: "horizontal" | "vertical") => void;
  onGenerate: () => void;
}

export function QuizEditorSidebar({
  presetName,
  config,
  setConfig,
  allowedOperations,
  batchSize,
  setBatchSize,
  worksheetTitle,
  setWorksheetTitle,
  worksheetInstructions,
  setWorksheetInstructions,
  displayFormat,
  setDisplayFormat,
  onGenerate,
}: QuizEditorSidebarProps) {
  const router = useRouter();

  const toggleOperation = (op: Operation) => {
    const currentOps = config.operations;
    const newOps = currentOps.includes(op)
      ? currentOps.filter((o) => o !== op)
      : [...currentOps, op];

    // Ensure at least one op remains
    if (newOps.length === 0) return;

    setConfig({ ...config, operations: newOps });
  };

  // Determine which ops to show
  const arithmeticOps: Operation[] = ["add", "subtract", "multiply", "divide"];
  const visibleOps = allowedOperations
    ? arithmeticOps.filter((op) => allowedOperations.includes(op))
    : arithmeticOps;

  const isCounting = config.operations.some(isCountingOperation);
  const countingTotal = COUNTING_OPERATIONS.filter((op) => config.operations.includes(op)).reduce(
    (sum, op) => sum + (config.countingCounts?.[op] ?? DEFAULT_COUNTING_COUNT),
    0
  );
  const showArithmeticSelector = visibleOps.length > 0 && config.topic !== "percent" && !isCounting;

  // Resolve dynamic rule component
  const activeRuleDef = SPECIAL_RULES[config.specialRule || "none"];
  const RuleConfigComponent = activeRuleDef?.ConfigComponent;

  return (
    <div className="bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-dvh z-20 shadow-xl shrink-0  sm:mt-0 -mt-10 md:mt-0">
      <div className="p-4 border-b flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex flex-col overflow-hidden">
          <span className="font-semibold truncate">{presetName}</span>
          <span className="text-xs text-slate-500">Editor Mode</span>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="p-5 space-y-6 pb-4">
            {/* Basic Settings */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>题目数量</Label>
                  {isCounting ? (
                    // 数数题按类型分别设置数量，这里只显示合计
                    <Input value={countingTotal} disabled />
                  ) : (
                    <SafeNumberInput
                      value={config.count}
                      onValueChange={(val) =>
                        setConfig({ ...config, count: val })
                      }
                      defaultValue={10}
                      min={1}
                      max={100}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>生成份数 (Copies)</Label>
                  <SafeNumberInput
                    value={batchSize}
                    onValueChange={setBatchSize}
                    defaultValue={1}
                    min={1}
                    max={50}
                  />
                </div>
              </div>

              {/* Operations Selector */}
              {showArithmeticSelector && (
                <div className="space-y-3 pt-2">
                  <Label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1">
                    <Calculator className="h-3 w-3" /> 运算类型
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {visibleOps.map((op) => (
                      <div key={op} className="flex items-center space-x-2">
                        <Checkbox
                          id={`op-${op}`}
                          checked={config.operations.includes(op)}
                          onCheckedChange={() => toggleOperation(op)}
                          // If it's the last one selected, disable unchecking (optional UX, but good)
                          disabled={
                            config.operations.length === 1 &&
                            config.operations.includes(op)
                          }
                        />
                        <Label
                          htmlFor={`op-${op}`}
                          className="cursor-pointer font-normal text-sm"
                        >
                          {op === "add"
                            ? "加法 (+)"
                            : op === "subtract"
                            ? "减法 (-)"
                            : op === "multiply"
                            ? "乘法 (×)"
                            : "除法 (÷)"}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {config.numberType !== "fraction" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>最小值</Label>
                        <div className="flex items-center gap-1">
                          <Checkbox
                            id="min-inclusive"
                            checked={!config.minExclusive}
                            onCheckedChange={(c) => setConfig({ ...config, minExclusive: !c })}
                          />
                          <Label htmlFor="min-inclusive" className="text-[10px] text-slate-400 cursor-pointer font-normal">取得到</Label>
                        </div>
                      </div>
                      <SafeNumberInput
                        value={config.minNumber}
                        onValueChange={(val) => setConfig({ ...config, minNumber: val })}
                        defaultValue={0}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>最大值</Label>
                        <div className="flex items-center gap-1">
                          <Checkbox
                            id="max-inclusive"
                            checked={!config.maxExclusive}
                            onCheckedChange={(c) => setConfig({ ...config, maxExclusive: !c })}
                          />
                          <Label htmlFor="max-inclusive" className="text-[10px] text-slate-400 cursor-pointer font-normal">取得到</Label>
                        </div>
                      </div>
                      <SafeNumberInput
                        value={config.maxNumber}
                        onValueChange={(val) => setConfig({ ...config, maxNumber: val })}
                        defaultValue={10}
                      />
                    </div>
                  </div>

                  {/* Fine-grained control for operand 2 */}
                  <div className="pt-2">
                    <Label className="text-xs font-semibold text-slate-500 uppercase mb-2 block">
                      第二个数范围 (可选)
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-slate-400">最小值 (Num2)</Label>
                          {config.minNumber2 !== undefined && (
                            <div className="flex items-center gap-1">
                              <Checkbox
                                id="min2-inclusive"
                                checked={!config.minExclusive2}
                                onCheckedChange={(c) => setConfig({ ...config, minExclusive2: !c })}
                              />
                              <Label htmlFor="min2-inclusive" className="text-[10px] text-slate-400 cursor-pointer font-normal">取得到</Label>
                            </div>
                          )}
                        </div>
                        <Input
                          type="number"
                          placeholder="默认"
                          value={config.minNumber2 ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setConfig({ ...config, minNumber2: val === "" ? undefined : parseInt(val) });
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-slate-400">最大值 (Num2)</Label>
                          {config.maxNumber2 !== undefined && (
                            <div className="flex items-center gap-1">
                              <Checkbox
                                id="max2-inclusive"
                                checked={!config.maxExclusive2}
                                onCheckedChange={(c) => setConfig({ ...config, maxExclusive2: !c })}
                              />
                              <Label htmlFor="max2-inclusive" className="text-[10px] text-slate-400 cursor-pointer font-normal">取得到</Label>
                            </div>
                          )}
                        </div>
                        <Input
                          type="number"
                          placeholder="默认"
                          value={config.maxNumber2 ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setConfig({ ...config, maxNumber2: val === "" ? undefined : parseInt(val) });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {config.numberType === "decimal" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>小数位数</Label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400">分开左右</span>
                      <Switch
                        checked={config.separateDecimalPlaces ?? false}
                        onCheckedChange={(c) =>
                          setConfig({
                            ...config,
                            separateDecimalPlaces: c,
                            // initialise right side from left side when turning on
                            decimalPlacesNum2: c ? (config.decimalPlaces || 1) : config.decimalPlacesNum2,
                            maxDecimalPlacesNum2: c ? (config.maxDecimalPlaces ?? config.decimalPlaces ?? 1) : config.maxDecimalPlacesNum2,
                          })
                        }
                      />
                    </div>
                  </div>

                  {!config.separateDecimalPlaces ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-400">最少</Label>
                        <SafeNumberInput
                          value={config.decimalPlaces ?? 1}
                          onValueChange={(val) => setConfig({ ...config, decimalPlaces: val })}
                          min={0} max={4} defaultValue={1}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-400">最多</Label>
                        <SafeNumberInput
                          value={config.maxDecimalPlaces ?? config.decimalPlaces ?? 1}
                          onValueChange={(val) => setConfig({ ...config, maxDecimalPlaces: val })}
                          min={0} max={4} defaultValue={1}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs text-slate-500 mb-1 block">左边 (num1)</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs text-slate-400">最少</Label>
                            <SafeNumberInput
                              value={config.decimalPlaces ?? 1}
                              onValueChange={(val) => setConfig({ ...config, decimalPlaces: val })}
                              min={0} max={4} defaultValue={1}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-slate-400">最多</Label>
                            <SafeNumberInput
                              value={config.maxDecimalPlaces ?? config.decimalPlaces ?? 1}
                              onValueChange={(val) => setConfig({ ...config, maxDecimalPlaces: val })}
                              min={0} max={4} defaultValue={1}
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-slate-500 mb-1 block">右边 (num2)</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs text-slate-400">最少</Label>
                            <SafeNumberInput
                              value={config.decimalPlacesNum2 ?? config.decimalPlaces ?? 1}
                              onValueChange={(val) => setConfig({ ...config, decimalPlacesNum2: val })}
                              min={0} max={4} defaultValue={1}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-slate-400">最多</Label>
                            <SafeNumberInput
                              value={config.maxDecimalPlacesNum2 ?? config.decimalPlacesNum2 ?? config.decimalPlaces ?? 1}
                              onValueChange={(val) => setConfig({ ...config, maxDecimalPlacesNum2: val })}
                              min={0} max={4} defaultValue={1}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* Advanced Rules */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center text-slate-500">
                <Settings2 className="mr-2 h-4 w-4" /> 规则与难度
              </h4>

              {/* Counting Settings */}
              {isCounting && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-500 uppercase font-semibold">
                      题目类型
                    </Label>
                    {(
                      [
                        { op: "count-shapes", label: "数图形 (Count the Shapes)" },
                        { op: "missing-sequence", label: "填缺数 (Missing Numbers)" },
                        { op: "count-sequence", label: "顺数/倒数 (Count Forward/Backward)" },
                      ] as const
                    ).map(({ op, label }) => (
                      <div key={op} className="flex items-center gap-2">
                        <Checkbox
                          id={`count-op-${op}`}
                          checked={config.operations.includes(op)}
                          disabled={
                            config.operations.length === 1 &&
                            config.operations.includes(op)
                          }
                          onCheckedChange={() => toggleOperation(op)}
                        />
                        <Label
                          htmlFor={`count-op-${op}`}
                          className="flex-1 text-sm font-normal cursor-pointer"
                        >
                          {label}
                        </Label>
                        {config.operations.includes(op) && (
                          <SafeNumberInput
                            className="w-16 h-8"
                            value={config.countingCounts?.[op] ?? DEFAULT_COUNTING_COUNT}
                            onValueChange={(val) =>
                              setConfig({
                                ...config,
                                countingCounts: { ...config.countingCounts, [op]: val },
                              })
                            }
                            defaultValue={DEFAULT_COUNTING_COUNT}
                            min={1}
                            max={100}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  {config.operations.includes("count-shapes") && (
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-500 uppercase font-semibold">
                        使用的图形
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        {(
                          [
                            { shape: "circle", label: "圆形 ○" },
                            { shape: "square", label: "正方形 □" },
                            { shape: "triangle", label: "三角形 △" },
                            { shape: "diamond", label: "菱形 ◇" },
                          ] as { shape: ShapeType; label: string }[]
                        ).map(({ shape, label }) => {
                          const current: ShapeType[] =
                            config.shapeTypes ?? ["circle", "square", "triangle", "diamond"];
                          return (
                            <div key={shape} className="flex items-center space-x-2">
                              <Checkbox
                                id={`shape-${shape}`}
                                checked={current.includes(shape)}
                                onCheckedChange={(checked) => {
                                  const next = checked
                                    ? [...current, shape]
                                    : current.filter((s) => s !== shape);
                                  if (next.length === 0) return;
                                  setConfig({ ...config, shapeTypes: next });
                                }}
                              />
                              <Label
                                htmlFor={`shape-${shape}`}
                                className="text-sm font-normal cursor-pointer"
                              >
                                {label}
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {(config.operations.includes("missing-sequence") ||
                    config.operations.includes("count-sequence")) && (
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-500 uppercase font-semibold">
                        数数方向
                      </Label>
                      <Select
                        value={config.countDirection ?? "both"}
                        onValueChange={(v) =>
                          setConfig({ ...config, countDirection: v as CountDirection })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="both">顺数 + 倒数</SelectItem>
                          <SelectItem value="forward">只顺数 (3, 4, 5…)</SelectItem>
                          <SelectItem value="backward">只倒数 (5, 4, 3…)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    {config.operations.includes("missing-sequence") && (
                      <div className="space-y-2">
                        <Label>最多空几个</Label>
                        <SafeNumberInput
                          value={config.maxBlanks ?? 2}
                          onValueChange={(val) => setConfig({ ...config, maxBlanks: val })}
                          min={1}
                          max={3}
                          defaultValue={2}
                        />
                      </div>
                    )}
                    {config.operations.includes("count-sequence") && (
                      <div className="space-y-2">
                        <Label>往后写几个数</Label>
                        <SafeNumberInput
                          value={config.countNextCount ?? 3}
                          onValueChange={(val) => setConfig({ ...config, countNextCount: val })}
                          min={1}
                          max={5}
                          defaultValue={3}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Percent Settings */}
              {config.topic === "percent" && (
                <div className="space-y-4">
                  {/* Sub-type selector */}
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-500 uppercase font-semibold">
                      题目类型
                    </Label>
                    {(
                      [
                        { op: "percent-of", label: "X% of N = ?" },
                        { op: "fraction-to-percent", label: "分数转百分数 (1/2 = ?%)" },
                        { op: "decimal-to-percent", label: "小数转百分数 (0.5 = ?%)" },
                      ] as const
                    ).map(({ op, label }) => (
                      <div key={op} className="flex items-center space-x-2">
                        <Checkbox
                          id={`percent-op-${op}`}
                          checked={config.operations.includes(op)}
                          disabled={
                            config.operations.length === 1 &&
                            config.operations.includes(op)
                          }
                          onCheckedChange={(checked) => {
                            const next = checked
                              ? [...config.operations, op]
                              : config.operations.filter((o) => o !== op);
                            if (next.length === 0) return;
                            setConfig({ ...config, operations: next });
                          }}
                        />
                        <Label
                          htmlFor={`percent-op-${op}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {label}
                        </Label>
                      </div>
                    ))}
                  </div>

                  {/* Percentage values — only when percent-of is active */}
                  {config.operations.includes("percent-of") && (
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-500 uppercase font-semibold">
                        使用的百分数 (X% of N)
                      </Label>
                      <div className="grid grid-cols-3 gap-2">
                        {[5, 10, 15, 20, 25, 30, 50, 60, 75, 90].map((pct) => {
                          const active = (
                            config.percentages ?? [10, 20, 25, 50]
                          ).includes(pct);
                          return (
                            <div key={pct} className="flex items-center space-x-2">
                              <Checkbox
                                id={`pct-${pct}`}
                                checked={active}
                                onCheckedChange={(checked) => {
                                  const current =
                                    config.percentages ?? [10, 20, 25, 50];
                                  const next = checked
                                    ? [...current, pct]
                                    : current.filter((p) => p !== pct);
                                  if (next.length === 0) return;
                                  setConfig({ ...config, percentages: next });
                                }}
                              />
                              <Label
                                htmlFor={`pct-${pct}`}
                                className="text-sm font-normal cursor-pointer"
                              >
                                {pct}%
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Simple mode toggle — only when percent-of is active */}
                  {config.operations.includes("percent-of") && (
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm">简单模式</Label>
                        <p className="text-[10px] text-slate-500">
                          底数只取10的整倍数 (如50, 100)
                        </p>
                      </div>
                      <Switch
                        checked={config.percentRoundBase ?? true}
                        onCheckedChange={(c) =>
                          setConfig({ ...config, percentRoundBase: c })
                        }
                      />
                    </div>
                  )}

                  {/* Decimal places — only when decimal-to-percent is active */}
                  {config.operations.includes("decimal-to-percent") && (
                    <div className="space-y-2">
                      <Label>小数位数 (小数转百分数)</Label>
                      <SafeNumberInput
                        value={config.decimalPlaces || 1}
                        onValueChange={(val) =>
                          setConfig({ ...config, decimalPlaces: val })
                        }
                        min={1}
                        max={2}
                        defaultValue={1}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Problem Format */}
              {(config.topic === "add-sub" || config.topic === "mul-div") && (
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500 uppercase font-semibold">
                    题目形式
                  </Label>
                  <Select
                    value={
                      config.specialRule === "missing-number"
                        ? "missing"
                        : "standard"
                    }
                    onValueChange={(v) =>
                      setConfig({
                        ...config,
                        specialRule:
                          v === "missing" ? "missing-number" : "none",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">
                        标准计算 (e.g. 3 + 5 = ?)
                      </SelectItem>
                      <SelectItem value="missing">
                        求未知数 (e.g. 3 + ? = 8)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Display Format: 横式 / 竖式 */}
              {config.numberType !== "fraction" &&
                config.numberType !== "decimal" &&
                (config.topic === "add-sub" || config.topic === "mul-div") && (
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-500 uppercase font-semibold">
                      排版格式
                    </Label>
                    <div className="flex gap-2">
                      <Button
                        variant={displayFormat === "horizontal" ? "default" : "outline"}
                        size="sm"
                        className="flex-1"
                        onClick={() => setDisplayFormat("horizontal")}
                      >
                        横式
                      </Button>
                      <Button
                        variant={displayFormat === "vertical" ? "default" : "outline"}
                        size="sm"
                        className="flex-1"
                        onClick={() => setDisplayFormat("vertical")}
                      >
                        竖式
                      </Button>
                    </div>
                  </div>
                )}

              {/* Fraction Rules */}
              {config.numberType === "fraction" && (
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500 uppercase font-semibold">
                    分数题型
                  </Label>
                  <Select
                    value={
                      config.specialRule &&
                      [
                        "integer-fraction",
                        "related-denominators",
                        "fraction-mixed-ops-3",
                      ].includes(config.specialRule)
                        ? config.specialRule
                        : "none"
                    }
                    onValueChange={(v) =>
                      setConfig({
                        ...config,
                        specialRule: v as any,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">标准分数计算</SelectItem>
                      <SelectItem value="integer-fraction">
                        分数与整数混合 (乘除)
                      </SelectItem>
                      <SelectItem value="related-denominators">
                        异分母 (倍数关系) 加减
                      </SelectItem>
                      <SelectItem value="fraction-mixed-ops-3">
                        分数加减混合 (3项)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Decimal Rounding Targets */}
              {config.numberType === "decimal" && config.operations.includes("round") && (
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500 uppercase font-semibold">
                    四舍五入到
                  </Label>
                  {[
                    { value: 0, label: "整数位 (whole number)" },
                    { value: 1, label: "十分位 (tenth)" },
                    { value: 2, label: "百分位 (hundredth)" },
                    { value: 3, label: "千分位 (thousandth)" },
                  ]
                    .filter(({ value }) => value < (config.decimalPlaces || 2))
                    .map(({ value, label }) => {
                      const targets = config.roundingTargets ?? [1];
                      return (
                        <div key={value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`rt-${value}`}
                            checked={targets.includes(value)}
                            disabled={targets.length === 1 && targets.includes(value)}
                            onCheckedChange={(checked) => {
                              const next = checked
                                ? [...targets, value]
                                : targets.filter((t) => t !== value);
                              if (next.length === 0) return;
                              setConfig({ ...config, roundingTargets: next });
                            }}
                          />
                          <Label htmlFor={`rt-${value}`} className="text-sm font-normal cursor-pointer">
                            {label}
                          </Label>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* Decimal Simple Mode */}
              {config.numberType === "decimal" && (
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm">简单模式</Label>
                    <p className="text-[10px] text-slate-500">
                      乘除法第二个数为整数 (如 1.2 × 3)
                    </p>
                  </div>
                  <Switch
                    checked={config.decimalSimpleMode ?? false}
                    onCheckedChange={(c) =>
                      setConfig({ ...config, decimalSimpleMode: c })
                    }
                  />
                </div>
              )}

              {/* Operation Specific Rules */}
              <div className="space-y-3">
                {config.operations.includes("add") &&
                  config.numberType === "integer" && (
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm">强制进位</Label>
                        <p className="text-[10px] text-slate-500">
                          加法必须进位
                        </p>
                      </div>
                      <Switch
                        checked={config.forceCarrying}
                        onCheckedChange={(c) =>
                          setConfig({ ...config, forceCarrying: c })
                        }
                      />
                    </div>
                  )}

                {config.operations.includes("subtract") && (
                  <>
                    {config.numberType === "integer" && (
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-sm">强制退位</Label>
                          <p className="text-[10px] text-slate-500">
                            减法必须借位
                          </p>
                        </div>
                        <Switch
                          checked={config.forceBorrowing}
                          onCheckedChange={(c) =>
                            setConfig({ ...config, forceBorrowing: c })
                          }
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm">允许负数</Label>
                        <p className="text-[10px] text-slate-500">结果可为负</p>
                      </div>
                      <Switch
                        checked={config.allowNegative}
                        onCheckedChange={(c) =>
                          setConfig({ ...config, allowNegative: c })
                        }
                      />
                    </div>
                  </>
                )}

                {/* Dynamic Rule Configuration */}
                {RuleConfigComponent && (
                  <RuleConfigComponent config={config} setConfig={setConfig} />
                )}
              </div>
            </div>

            <Separator />

            {/* Header Settings */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center text-slate-500">
                <FileText className="mr-2 h-4 w-4" /> 试卷表头
              </h4>
              <div className="space-y-2">
                <Label>标题</Label>
                <Input
                  value={worksheetTitle}
                  onChange={(e) => setWorksheetTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>说明/指令</Label>
                <Textarea
                  value={worksheetInstructions}
                  onChange={(e) => setWorksheetInstructions(e.target.value)}
                  className="min-h-20"
                />
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
      <div className="p-5 border-t bg-white dark:bg-slate-900">
        <Button className="w-full" size="lg" onClick={onGenerate}>
          <RefreshCcw className="mr-2 h-4 w-4" /> 重新生成
        </Button>
      </div>
    </div>
  );
}
