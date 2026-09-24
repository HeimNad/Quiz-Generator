import { jsPDF } from "jspdf";
import autoTable, { type CellHookData } from "jspdf-autotable";
import type { AnyProblemType } from "@/lib/problems/registry";
import type { BaseConfig, BaseProblem, CardLayout, DrawContext, GridLayout } from "@/lib/problems/types";
import { loadPdfAssets, type PdfAssets } from "./assets";
import { drawTokens, drawVertical } from "./draw";
import { plainText } from "./tokens";

export interface PdfOptions {
  title: string;
  description?: string;
  content: "all" | "problems" | "answers";
  /** With content "all": append the answer keys */
  includeAnswers: boolean;
  showNumbers: boolean;
}

export interface PdfJob {
  type: AnyProblemType;
  config: BaseConfig;
  /** One worksheet per batch */
  batches: BaseProblem[][];
  options: PdfOptions;
}

// Letter paper, mm
const PAGE_HEIGHT = 279.4;
const X_OFFSET = 5; // everything sits 5mm right of the default margin
const SHEET_TOP = 55; // below the header
const BOTTOM_MARGIN = 20;
const ANSWER_TOP = 30;

// Cells are addressed by index so drawing never depends on row.index across page breaks
const cellRef = (i: number) => `[[${i}]]`;
const refIndex = (raw: unknown): number | null => {
  const m = typeof raw === "string" ? raw.match(/^\[\[(\d+)\]\]$/) : null;
  return m ? parseInt(m[1]) : null;
};

function createDoc(options: PdfOptions, assets: PdfAssets): DrawContext {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
  doc.setProperties({ title: options.title, author: "Math Generator" });
  let font = "helvetica";
  if (assets.font) {
    doc.addFileToVFS("NotoSansSC-Regular.ttf", assets.font);
    doc.addFont("NotoSansSC-Regular.ttf", "NotoSansSC", "normal");
    doc.addFont("NotoSansSC-Regular.ttf", "NotoSansSC", "bold");
    font = "NotoSansSC";
  }
  doc.setFont(font);
  return { doc, font };
}

function drawHeaderFooter(ctx: DrawContext, job: PdfJob, assets: PdfAssets, batchIndex: number, page: number) {
  const { doc, font } = ctx;
  const { title, description } = job.options;
  doc.setTextColor(0);
  doc.setFont(font, "normal");
  doc.setFontSize(10);
  doc.text("Name: __________________________", 15 + X_OFFSET, 15);
  doc.text("Date: __________________", 95 + X_OFFSET, 15);
  doc.text("Score: ____________", 160 + X_OFFSET, 15);
  if (assets.logo) doc.addImage(assets.logo, "JPEG", 15 + X_OFFSET, 25, 15, 15);

  doc.setFontSize(22);
  doc.setFont(font, "bold");
  doc.text(title, 105 + X_OFFSET, 30, { align: "center" });
  doc.setFont(font, "normal");
  if (description) {
    doc.setFontSize(11);
    doc.text(doc.splitTextToSize(description, 170), 105 + X_OFFSET, 40, { align: "center" });
  }
  doc.setLineWidth(0.5);
  doc.line(15 + X_OFFSET, 50, 195 + X_OFFSET, 50);

  doc.setFontSize(8);
  doc.setTextColor(150);
  const label = job.batches.length > 1 ? `${batchIndex + 1}-Page${page}` : `Page ${page}`;
  doc.text(label, 105 + X_OFFSET, 265, { align: "center" });
  doc.setTextColor(0);
}

/** Pad a flat list of cell refs into rows of `cols` */
function toRows(count: number, cols: number): string[][] {
  const rows: string[][] = [];
  for (let i = 0; i < count; i += cols) {
    rows.push(Array.from({ length: cols }, (_, c) => (i + c < count ? cellRef(i + c) : "")));
  }
  return rows;
}

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

function renderGridSheet(
  ctx: DrawContext,
  job: PdfJob,
  layout: GridLayout<BaseConfig, BaseProblem>,
  problems: BaseProblem[],
  onPage: () => void
) {
  const vertical = layout.isVertical?.(job.config) ?? false;
  const hasLong = problems.some((p) => plainText(layout.question(p)).length > 25);
  const cols = vertical ? 3 : hasLong ? 2 : 3;
  // Size rows to fill the page: vertical ≤7 rows, 3 columns ≤10, 2 columns ≤15
  const rowsPerPage = vertical ? 7 : cols === 3 ? 10 : 15;
  const rowsOnPage = Math.min(Math.ceil(problems.length / cols), rowsPerPage);
  const fill = rowsOnPage > 0 ? Math.floor((PAGE_HEIGHT - SHEET_TOP - BOTTOM_MARGIN) / rowsOnPage) : 20;
  const minHeight = vertical ? clamp(fill, 26, 38) : clamp(fill, 12, 22);
  const fontSize = 12;

  autoTable(ctx.doc, {
    startY: SHEET_TOP,
    body: toRows(problems.length, cols),
    theme: "plain",
    styles: { fontSize, cellPadding: 4, valign: "middle", font: ctx.font, lineWidth: 0, minCellHeight: minHeight },
    margin: { top: SHEET_TOP, bottom: BOTTOM_MARGIN, left: 10 + X_OFFSET },
    didParseCell: (data: CellHookData) => {
      if (data.section === "body") data.cell.text = [];
    },
    didDrawCell: (data: CellHookData) => {
      const i = data.section === "body" ? refIndex(data.cell.raw) : null;
      if (i === null) return;
      const p = problems[i];
      const index = job.options.showNumbers ? `${i + 1}.` : null;
      const spec = layout.vertical?.(p, job.config);
      if (spec) drawVertical(ctx, data.cell, spec, index, false, fontSize);
      else drawTokens(ctx, data.cell, layout.question(p), index, fontSize);
    },
    didDrawPage: onPage,
  });
}

function renderCardSheet(
  ctx: DrawContext,
  job: PdfJob,
  layout: CardLayout<BaseProblem>,
  problems: BaseProblem[],
  onPage: () => void
) {
  // A new section (e.g. Part A → Part B) starts on a new page
  const groups: number[][] = [];
  problems.forEach((p, i) => {
    const last = groups[groups.length - 1];
    if (last && layout.section?.(problems[last[0]]) === layout.section?.(p)) last.push(i);
    else groups.push([i]);
  });

  groups.forEach((group, g) => {
    if (g > 0) ctx.doc.addPage();
    autoTable(ctx.doc, {
      startY: SHEET_TOP,
      body: group.map((i) => [cellRef(i)]),
      theme: "plain",
      rowPageBreak: "avoid",
      styles: { fontSize: 1, cellPadding: 0, lineWidth: 0, font: ctx.font },
      margin: { top: SHEET_TOP, bottom: BOTTOM_MARGIN, left: 15 + X_OFFSET, right: 15 },
      didParseCell: (data: CellHookData) => {
        const i = data.section === "body" ? refIndex(data.cell.raw) : null;
        if (i === null) return;
        data.cell.styles.minCellHeight = layout.height(problems[i]);
        data.cell.text = [];
      },
      didDrawCell: (data: CellHookData) => {
        const i = data.section === "body" ? refIndex(data.cell.raw) : null;
        if (i === null) return;
        layout.draw(ctx, data.cell, problems[i], job.options.showNumbers ? i + 1 : null);
      },
      didDrawPage: onPage,
    });
  });
}

function renderAnswerKey(ctx: DrawContext, job: PdfJob, problems: BaseProblem[], batchIndex: number) {
  const { doc } = ctx;
  const layout = job.type.layout;
  const grid = layout.kind === "grid" ? layout : null;
  const vertical = grid?.isVertical?.(job.config) ?? false;

  doc.setFontSize(18);
  doc.setTextColor(0);
  const suffix = job.batches.length > 1 ? ` (${batchIndex + 1})` : "";
  doc.text(`${job.options.title} - ANSWER KEY${suffix}`, 105 + X_OFFSET, 20, { align: "center" });

  const cols = 3;
  const rowsOnPage = Math.min(Math.ceil(problems.length / cols), 8);
  const fill = rowsOnPage > 0 ? Math.floor((PAGE_HEIGHT - ANSWER_TOP - BOTTOM_MARGIN) / rowsOnPage) : 38;
  const minHeight = vertical ? clamp(fill, 26, 38) : 16;
  const fontSize = 11;

  autoTable(doc, {
    startY: ANSWER_TOP,
    body: toRows(problems.length, cols),
    theme: "striped",
    styles: { fontSize, cellPadding: 5, font: ctx.font, minCellHeight: minHeight, valign: "middle" },
    margin: { top: ANSWER_TOP, bottom: BOTTOM_MARGIN, left: 10 + X_OFFSET },
    didParseCell: (data: CellHookData) => {
      if (data.section === "body") data.cell.text = [];
    },
    didDrawCell: (data: CellHookData) => {
      const i = data.section === "body" ? refIndex(data.cell.raw) : null;
      if (i === null) return;
      const p = problems[i];
      const index = job.options.showNumbers ? `${i + 1}.` : null;
      const spec = grid?.vertical?.(p, job.config);
      if (spec) drawVertical(ctx, data.cell, spec, index, true, fontSize);
      else drawTokens(ctx, data.cell, layout.answer(p), index, fontSize);
    },
  });
}

export async function buildPdf(job: PdfJob): Promise<jsPDF> {
  const assets = await loadPdfAssets();
  const ctx = createDoc(job.options, assets);
  const { doc } = ctx;
  const { content, includeAnswers } = job.options;
  const layout = job.type.layout;

  if (content !== "answers") {
    job.batches.forEach((problems, b) => {
      if (b > 0) doc.addPage();
      let page = 1;
      const onPage = () => drawHeaderFooter(ctx, job, assets, b, page++);
      if (layout.kind === "grid") renderGridSheet(ctx, job, layout, problems, onPage);
      else renderCardSheet(ctx, job, layout, problems, onPage);
    });
  }

  if (content === "answers" || (content === "all" && includeAnswers)) {
    if (content === "all") {
      doc.addPage();
      doc.setFontSize(24);
      doc.setTextColor(0);
      doc.text("ANSWER KEYS", 105 + X_OFFSET, 150, { align: "center" });
    }
    job.batches.forEach((problems, b) => {
      if (content === "all" || b > 0) doc.addPage();
      renderAnswerKey(ctx, job, problems, b);
    });
  }

  return doc;
}

export async function downloadPdf(job: PdfJob, filename: string) {
  (await buildPdf(job)).save(filename);
}

export async function printPdf(job: PdfJob) {
  const blob = (await buildPdf(job)).output("blob");
  window.open(URL.createObjectURL(blob), "_blank");
}

export async function pdfBlobUrl(job: PdfJob): Promise<string> {
  return URL.createObjectURL((await buildPdf(job)).output("blob"));
}
