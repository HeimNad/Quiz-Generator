import type { Cell, DrawContext, VerticalSpec } from "@/lib/problems/types";
import { plainText, type Token } from "./tokens";

const TOKEN_SPACING = 2.5; // mm between tokens
const MIN_SCALE = 0.6; // shrink long equations at most this far
const FRACTION_SCALE = 0.75; // numerator/denominator size relative to the line

/** Underline a student writes on */
export function drawBlank(ctx: DrawContext, x: number, baseline: number, width: number) {
  const { doc } = ctx;
  doc.setDrawColor(160, 180, 200);
  doc.setLineWidth(0.3);
  doc.line(x, baseline + 0.8, x + width, baseline + 0.8);
  doc.setDrawColor(0);
}

function tokenWidth(ctx: DrawContext, tk: Token, fontSize: number): number {
  const { doc } = ctx;
  if (tk.t === "frac") {
    doc.setFontSize(fontSize * FRACTION_SCALE);
    const w = Math.max(doc.getTextWidth(String(Math.abs(tk.n))), doc.getTextWidth(String(tk.d))) + 1;
    doc.setFontSize(fontSize);
    return tk.n < 0 ? w + doc.getTextWidth("-") + 0.5 : w;
  }
  doc.setFontSize(fontSize);
  return doc.getTextWidth(plainText([tk]));
}

/**
 * Draws a row of tokens in a table cell: optional index on the left, then the
 * equation, shrunk (down to 60%) when it would overflow the cell.
 */
export function drawTokens(
  ctx: DrawContext,
  cell: Cell & { padding(side: "left" | "right"): number },
  tokens: Token[],
  index: string | null,
  fontSize: number
) {
  const { doc } = ctx;
  const startX = cell.x + cell.padding("left");
  const centerY = cell.y + cell.height / 2;

  doc.setFontSize(fontSize);
  if (index) doc.text(index, startX, centerY + fontSize * 0.15);

  const indexWidth = index ? doc.getTextWidth(index) + 4 : 0;
  const available = cell.width - cell.padding("left") - cell.padding("right") - indexWidth;
  const widths = tokens.map((tk) => tokenWidth(ctx, tk, fontSize));
  const total = widths.reduce((a, b) => a + b, 0) + TOKEN_SPACING * Math.max(0, tokens.length - 1);
  const scale = total > available ? Math.max(MIN_SCALE, available / total) : 1;
  const size = fontSize * scale;

  let cursorX = startX + indexWidth;
  tokens.forEach((tk, i) => {
    const w = widths[i] * scale;
    if (tk.t === "frac") {
      let x = cursorX;
      if (tk.n < 0) {
        doc.setFontSize(size);
        doc.text("-", x, centerY + size * 0.15);
        x += doc.getTextWidth("-") + 0.5 * scale;
      }
      const numStr = String(Math.abs(tk.n));
      const denStr = String(tk.d);
      const partW = w - (x - cursorX);
      doc.setFontSize(size * FRACTION_SCALE);
      const numW = doc.getTextWidth(numStr);
      const denW = doc.getTextWidth(denStr);
      doc.text(numStr, x + (partW - numW) / 2, centerY - size * 0.2);
      doc.text(denStr, x + (partW - denW) / 2, centerY + size * 0.55);
      const barW = Math.max(numW, denW) + scale;
      const barX = x + (partW - barW) / 2;
      doc.setLineWidth(0.25 * scale);
      doc.setDrawColor(0);
      doc.line(barX, centerY, barX + barW, centerY);
    } else {
      doc.setFontSize(size);
      const s = plainText([tk]);
      doc.text(s, cursorX + (w - doc.getTextWidth(s)) / 2, centerY + size * 0.15);
    }
    cursorX += w + TOKEN_SPACING * scale;
  });

  doc.setFontSize(fontSize);
}

/** Column arithmetic (竖式): numbers right-aligned over a bar, index in grey at top-left */
export function drawVertical(
  ctx: DrawContext,
  cell: Cell & { padding(side: "left" | "right" | "top" | "bottom"): number },
  spec: VerticalSpec,
  index: string | null,
  showAnswer: boolean,
  fontSize: number
) {
  const { doc } = ctx;
  doc.setFontSize(fontSize);

  const topW = doc.getTextWidth(spec.top);
  const bottomW = doc.getTextWidth(spec.bottom);
  const opW = doc.getTextWidth(spec.op);
  const ansW = showAnswer ? doc.getTextWidth(spec.answer) : 0;
  // Wide enough for the widest row (op + gap + bottom number)
  const blockWidth = Math.max(topW, opW + 2 + bottomW, ansW) + 3;

  const indexW = index ? doc.getTextWidth(index) + 2 : 0;
  const innerW = cell.width - cell.padding("left") - cell.padding("right");
  const blockOffset = Math.max(2, (innerW - indexW - blockWidth) / 2);
  const blockStartX = cell.x + cell.padding("left") + indexW + blockOffset;
  const blockEndX = blockStartX + blockWidth;

  // Center the three rows vertically in the cell
  const fh = fontSize * 0.32; // approx. glyph height (mm)
  const ls = fontSize * 0.42; // line spacing (mm)
  const contentH = fh + ls * 2.25 + 1;
  const innerH = cell.height - cell.padding("top") - cell.padding("bottom");
  const row1Y = cell.y + cell.padding("top") + Math.max(0, (innerH - contentH) / 2) + fh;
  const row2Y = row1Y + ls;
  const barY = row2Y + ls * 0.45;
  const row3Y = barY + ls * 0.8;

  if (index) {
    doc.setFontSize(fontSize * 0.85);
    doc.setTextColor(140, 140, 140);
    doc.text(index, cell.x + cell.padding("left"), row1Y);
    doc.setFontSize(fontSize);
    doc.setTextColor(0, 0, 0);
  }

  doc.text(spec.top, blockEndX - topW, row1Y);
  doc.text(spec.op, blockStartX, row2Y);
  doc.text(spec.bottom, blockEndX - bottomW, row2Y);

  doc.setLineWidth(0.35);
  doc.setDrawColor(0, 0, 0);
  doc.line(blockStartX, barY, blockEndX, barY);

  if (showAnswer) doc.text(spec.answer, blockEndX - ansW, row3Y);
}
