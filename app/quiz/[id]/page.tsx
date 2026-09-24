"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { generateQuiz, Problem, QuizConfig } from "@/lib/math-generator";
import { generatePDF } from "@/lib/pdf-generator";
import { QuizEditorSidebar } from "@/components/quiz/QuizEditorSidebar";
import { getPresetById } from "@/lib/presets";
import { QuizPreview } from "@/components/quiz/QuizPreview";

export default function QuizEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [id, setId] = useState<string | null>(null);
  const [isMobileSettingsOpen, setIsMobileSettingsOpen] = useState(false);

  // Unwrap params
  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  const [config, setConfig] = useState<QuizConfig>({
    count: 20,
    topic: "add-sub", // Updated from "arithmetic"
    numberType: "integer",
    operations: ["add", "subtract"],
    minNumber: 1,
    maxNumber: 20,
    allowNegative: false,
    decimalPlaces: 2,
    maxDenominator: 10,
    specialRule: "none",
  });

  const [batchSize, setBatchSize] = useState(1);
  const [problemBatches, setProblemBatches] = useState<Problem[][]>([]);
  const [showAnswers, setShowAnswers] = useState(true);
  const [showNumbers, setShowNumbers] = useState(true);
  const [displayFormat, setDisplayFormat] = useState<"horizontal" | "vertical">("horizontal");

  const [worksheetTitle, setWorksheetTitle] = useState("Math Worksheet");
  const [worksheetInstructions, setWorksheetInstructions] = useState(
    "Complete the following problems."
  );
  const [presetName, setPresetName] = useState("");
  const [allowedOps, setAllowedOps] = useState<any[] | undefined>(undefined);

  // Initialize from ID
  useEffect(() => {
    if (!id) return;

    const preset = getPresetById(id);
    if (preset) {
      setPresetName(preset.name);

      if (preset.id === "custom") {
        setAllowedOps(undefined);
      } else {
        const ops = preset.config.operations?.filter((op) =>
          ["add", "subtract", "multiply", "divide"].includes(op)
        );
        setAllowedOps(ops && ops.length > 0 ? ops : undefined);
      }

      setConfig((prev) => ({
        ...prev,
        ...preset.config,
        topic: preset.topic,
        specialRule: preset.config.specialRule || "none",
      }));
      setWorksheetTitle(preset.defaultTitle || "Math Worksheet");
      setWorksheetInstructions(
        preset.defaultInstructions || "Complete the following problems."
      );

      // Initial generate (1 batch)
      const initialConfig = {
        ...config,
        ...preset.config,
        topic: preset.topic,
        specialRule: preset.config.specialRule || "none",
      } as QuizConfig;

      const probs = generateQuiz(initialConfig);
      setProblemBatches([probs]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleGenerate = () => {
    const newBatches: Problem[][] = [];
    for (let i = 0; i < batchSize; i++) {
      newBatches.push(generateQuiz(config));
    }
    setProblemBatches(newBatches);
    setIsMobileSettingsOpen(false);
  };

  const handleDownloadPDF = (content: "all" | "problems" | "answers" = "all") => {
    const now = new Date();
    const timestamp = now.getFullYear().toString() + 
                      (now.getMonth() + 1).toString().padStart(2, '0') + 
                      now.getDate().toString().padStart(2, '0') + 
                      '-' +
                      now.getHours().toString().padStart(2, '0') +
                      now.getMinutes().toString().padStart(2, '0') +
                      now.getSeconds().toString().padStart(2, '0');
    
    const formattedFilename = `${presetName}-${timestamp}-${content}.pdf`;

    generatePDF(problemBatches, {
      title: worksheetTitle,
      description: worksheetInstructions,
      includeAnswers: content === "problems" ? false : true,
      content: content,
      showNumbers,
      displayFormat,
    }, 'download', formattedFilename);
  };

  const handlePrintPDF = (content: "all" | "problems" | "answers" = "all") => {
    generatePDF(problemBatches, {
      title: worksheetTitle,
      description: worksheetInstructions,
      includeAnswers: content === "problems" ? false : true,
      content: content,
      showNumbers,
      displayFormat,
    }, 'print');
  };

  if (!id) return <div className="p-8">Loading...</div>;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-full">
        <QuizEditorSidebar
          presetName={presetName}
          config={config}
          setConfig={setConfig}
          allowedOperations={allowedOps}
          batchSize={batchSize}
          setBatchSize={setBatchSize}
          worksheetTitle={worksheetTitle}
          setWorksheetTitle={setWorksheetTitle}
          worksheetInstructions={worksheetInstructions}
          setWorksheetInstructions={setWorksheetInstructions}
          displayFormat={displayFormat}
          setDisplayFormat={setDisplayFormat}
          onGenerate={handleGenerate}
        />
      </div>

      {/* Mobile Settings Sheet */}
      <Sheet open={isMobileSettingsOpen} onOpenChange={setIsMobileSettingsOpen}>
        <SheetContent side="left" className="p-0 w-80 overflow-hidden">
          <SheetHeader>
            <SheetTitle className="sr-only">设置</SheetTitle>
          </SheetHeader>
          <QuizEditorSidebar
            presetName={presetName}
            config={config}
            setConfig={setConfig}
            allowedOperations={allowedOps}
            batchSize={batchSize}
            setBatchSize={setBatchSize}
            worksheetTitle={worksheetTitle}
            setWorksheetTitle={setWorksheetTitle}
            worksheetInstructions={worksheetInstructions}
            setWorksheetInstructions={setWorksheetInstructions}
            displayFormat={displayFormat}
            setDisplayFormat={setDisplayFormat}
            onGenerate={handleGenerate}
          />
        </SheetContent>
      </Sheet>

      <QuizPreview
        problemBatches={problemBatches}
        worksheetTitle={worksheetTitle}
        worksheetInstructions={worksheetInstructions}
        onDownloadPDF={handleDownloadPDF}
        onPrintPDF={handlePrintPDF}
        onMobileSettingsClick={() => setIsMobileSettingsOpen(true)}
        showAnswers={showAnswers}
        setShowAnswers={setShowAnswers}
        showNumbers={showNumbers}
        setShowNumbers={setShowNumbers}
        displayFormat={displayFormat}
      />
    </div>
  );
}
