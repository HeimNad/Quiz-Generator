"use client";

import { Problem } from "@/lib/math-generator";
import { generatePDF } from "@/lib/pdf-generator";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Printer, Settings2, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// 动态导入 PDFViewer，禁用 SSR (Server-Side Rendering)
// 这样可以避免 "DOMMatrix is not defined" 错误
const PDFViewer = dynamic(() => import("./PDFViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex justify-center items-center text-slate-500 bg-slate-200 dark:bg-slate-900">
      加载预览组件...
    </div>
  ),
});

interface QuizPreviewProps {
  problemBatches: Problem[][];
  worksheetTitle: string;
  worksheetInstructions: string;
  onDownloadPDF: (content: "all" | "problems" | "answers") => void;
  onPrintPDF: (content: "all" | "problems" | "answers") => void;
  onMobileSettingsClick?: () => void;
  showAnswers: boolean;
  setShowAnswers: (show: boolean) => void;
  showNumbers: boolean;
  setShowNumbers: (show: boolean) => void;
  displayFormat?: "horizontal" | "vertical";
}

export function QuizPreview({
  problemBatches,
  worksheetTitle,
  worksheetInstructions,
  onDownloadPDF,
  onPrintPDF,
  onMobileSettingsClick,
  showAnswers,
  setShowAnswers,
  showNumbers,
  setShowNumbers,
  displayFormat,
}: QuizPreviewProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;
    let currentPdfUrl: string | null = null;

    const loadPdf = async () => {
      if (!problemBatches || problemBatches.length === 0) return;
      
      setIsLoading(true);
      try {
        // 生成包含所有内容的 PDF
        const url = await generatePDF(
          problemBatches,
          {
            title: worksheetTitle,
            description: worksheetInstructions,
            includeAnswers: showAnswers,
            content: "all",
            showNumbers,
            displayFormat,
          },
          "blob-url"
        );
        
        if (active && typeof url === "string") {
            setPdfUrl(url);
            currentPdfUrl = url;
        }

      } catch (error) {
        console.error("Failed to generate PDF preview", error);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadPdf();

    return () => {
      active = false;
      if (currentPdfUrl) URL.revokeObjectURL(currentPdfUrl);
    };
  }, [problemBatches, worksheetTitle, worksheetInstructions, showAnswers, showNumbers, displayFormat]);

  return (
    <div className="flex-1 bg-slate-100 dark:bg-slate-950 flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="bg-white dark:bg-slate-900 shadow-sm p-3 flex flex-wrap justify-between items-center z-10 border-b border-slate-200 dark:border-slate-800 gap-2 shrink-0">
        {/* Left Side: Mobile Trigger */}
        <div className="flex items-center gap-2">
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={onMobileSettingsClick}
            >
              <Settings2 className="h-5 w-5" />
            </Button>
          </div>
          <span className="text-sm font-medium text-slate-500 hidden sm:inline-block">
            Preview
          </span>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-2 ml-auto">
          <div className="flex items-center space-x-2 mx-2">
            <Switch
              id="show-nums"
              checked={showNumbers}
              onCheckedChange={setShowNumbers}
            />
            <Label htmlFor="show-nums" className="text-xs">
              显示题号
            </Label>
          </div>

          <div className="flex items-center space-x-2 mx-2">
            <Switch
              id="show-ans"
              checked={showAnswers}
              onCheckedChange={setShowAnswers}
            />
            <Label htmlFor="show-ans" className="text-xs">
              包含答案
            </Label>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
                下载
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onDownloadPDF("all")}>
                全部 (题目+答案)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDownloadPDF("problems")}>
                仅题目
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDownloadPDF("answers")}>
                仅答案
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm">
                <Printer className="h-4 w-4" />
                打印
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onPrintPDF("all")}>
                全部 (题目+答案)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPrintPDF("problems")}>
                仅题目
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPrintPDF("answers")}>
                仅答案
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* PDF Viewer Area */}
      <PDFViewer url={pdfUrl} isLoading={isLoading} />
    </div>
  );
}