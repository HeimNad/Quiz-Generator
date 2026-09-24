"use client";

import { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { QuizEditorSidebar } from "@/components/quiz/QuizEditorSidebar";
import { QuizPreview } from "@/components/quiz/QuizPreview";
import { getPresetById, presetConfig } from "@/lib/presets";
import { getProblemType } from "@/lib/problems/registry";
import type { BaseConfig, BaseProblem } from "@/lib/problems/types";
import { createRng } from "@/lib/random";
import { downloadPdf, printPdf, type PdfJob, type PdfOptions } from "@/lib/pdf/build";

type Content = PdfOptions["content"];

function timestamp(now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}` +
    `-${p(now.getHours())}${p(now.getMinutes())}${p(now.getSeconds())}`
  );
}

export function QuizEditor({ presetId }: { presetId: string }) {
  // The page only renders this for ids that exist
  const preset = getPresetById(presetId)!;
  const type = getProblemType(preset.type);

  const [config, setConfig] = useState<BaseConfig>(() => presetConfig(preset));
  const [batchSize, setBatchSize] = useState(1);
  const [batches, setBatches] = useState<BaseProblem[][]>(() => [type.generate(presetConfig(preset), createRng())]);
  const [showAnswers, setShowAnswers] = useState(true);
  const [showNumbers, setShowNumbers] = useState(true);
  const [title, setTitle] = useState(preset.defaultTitle);
  const [instructions, setInstructions] = useState(preset.defaultInstructions);
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);

  const handleGenerate = () => {
    const rng = createRng();
    setBatches(Array.from({ length: batchSize }, () => type.generate(config, rng)));
    setMobileSettingsOpen(false);
  };

  const makeJob = (content: Content, includeAnswers: boolean): PdfJob => ({
    type,
    config,
    batches,
    options: { title, description: instructions, content, includeAnswers, showNumbers },
  });

  const previewJob = useMemo<PdfJob>(
    () => ({
      type,
      config,
      batches,
      options: { title, description: instructions, content: "all", includeAnswers: showAnswers, showNumbers },
    }),
    [type, config, batches, title, instructions, showAnswers, showNumbers]
  );

  const sidebar = (
    <QuizEditorSidebar
      presetName={preset.name}
      presetNameEn={preset.nameEn}
      typeId={preset.type}
      config={config}
      onConfigChange={setConfig}
      batchSize={batchSize}
      setBatchSize={setBatchSize}
      worksheetTitle={title}
      setWorksheetTitle={setTitle}
      worksheetInstructions={instructions}
      setWorksheetInstructions={setInstructions}
      onGenerate={handleGenerate}
    />
  );

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden flex-col md:flex-row">
      <div className="hidden md:flex h-full">{sidebar}</div>

      <Sheet open={mobileSettingsOpen} onOpenChange={setMobileSettingsOpen}>
        <SheetContent side="left" className="p-0 w-80 overflow-hidden">
          <SheetHeader>
            <SheetTitle className="sr-only">设置</SheetTitle>
          </SheetHeader>
          {sidebar}
        </SheetContent>
      </Sheet>

      <QuizPreview
        job={previewJob}
        onDownload={(content) =>
          downloadPdf(makeJob(content, content !== "problems"), `${preset.name}-${timestamp()}-${content}.pdf`)
        }
        onPrint={(content) => printPdf(makeJob(content, content !== "problems"))}
        onMobileSettingsClick={() => setMobileSettingsOpen(true)}
        showAnswers={showAnswers}
        setShowAnswers={setShowAnswers}
        showNumbers={showNumbers}
        setShowNumbers={setShowNumbers}
      />
    </div>
  );
}
