"use client";

import { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Loader2 } from "lucide-react";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  url: string | null;
  isLoading?: boolean;
}

export default function PDFViewer({ url, isLoading }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Resize observer to handle responsive PDF width
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  return (
    <div className="flex-1 relative w-full h-full bg-slate-200 dark:bg-slate-900 overflow-hidden flex flex-col items-center">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      )}

      {/* Scrollable Container */}
      <div
        ref={containerRef}
        className="flex-1 w-full overflow-y-auto p-4 md:p-8 flex flex-col items-center gap-6"
      >
        {url ? (
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            className="flex flex-col gap-6 items-center"
            loading={null}
            error={<div className="text-red-500 mt-10">无法加载 PDF 预览</div>}
          >
            {Array.from(new Array(numPages), (el, index) => (
              <div key={`page_${index + 1}`} className="shadow-lg bg-white">
                <Page
                  pageNumber={index + 1}
                  width={
                    containerWidth > 0
                      ? Math.min(containerWidth - 40, 794)
                      : undefined
                  }
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="bg-white"
                />
              </div>
            ))}
          </Document>
        ) : (
          !isLoading && (
            <div className="text-slate-500 mt-10">正在生成预览...</div>
          )
        )}
      </div>
    </div>
  );
}
