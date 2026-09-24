"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, FileText, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SafeNumberInput } from "@/components/ui/safe-number-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ProblemPanel } from "@/components/quiz/panels";
import { getProblemType, questionCount, type ProblemTypeId } from "@/lib/problems/registry";
import type { BaseConfig } from "@/lib/problems/types";

interface QuizEditorSidebarProps {
  presetName: string;
  presetNameEn: string;
  typeId: ProblemTypeId;
  config: BaseConfig;
  onConfigChange: (config: BaseConfig) => void;
  batchSize: number;
  setBatchSize: (size: number) => void;
  worksheetTitle: string;
  setWorksheetTitle: (title: string) => void;
  worksheetInstructions: string;
  setWorksheetInstructions: (instructions: string) => void;
  onGenerate: () => void;
}

export function QuizEditorSidebar({
  presetName,
  presetNameEn,
  typeId,
  config,
  onConfigChange,
  batchSize,
  setBatchSize,
  worksheetTitle,
  setWorksheetTitle,
  worksheetInstructions,
  setWorksheetInstructions,
  onGenerate,
}: QuizEditorSidebarProps) {
  const router = useRouter();
  const type = getProblemType(typeId);

  return (
    <div className="bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-dvh z-20 shadow-xl shrink-0 sm:mt-0 -mt-10 md:mt-0">
      <div className="p-4 border-b flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex flex-col overflow-hidden">
          <span className="font-semibold truncate">{presetName}</span>
          <span className="text-xs text-slate-400 truncate">{presetNameEn}</span>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="p-5 space-y-6 pb-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>题目数量</Label>
                  {type.totalCount ? (
                    // This type sets counts per sub-type; show the total
                    <Input value={questionCount(type, config)} disabled />
                  ) : (
                    <SafeNumberInput
                      value={config.count}
                      onValueChange={(count) => onConfigChange({ ...config, count })}
                      defaultValue={10}
                      min={1}
                      max={100}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>生成份数 (Copies)</Label>
                  <SafeNumberInput value={batchSize} onValueChange={setBatchSize} defaultValue={1} min={1} max={50} />
                </div>
              </div>

              <ProblemPanel typeId={typeId} config={config} onChange={onConfigChange} />
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center text-slate-500">
                <FileText className="mr-2 h-4 w-4" /> 试卷表头
              </h4>
              <div className="space-y-2">
                <Label>标题</Label>
                <Input value={worksheetTitle} onChange={(e) => setWorksheetTitle(e.target.value)} />
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
