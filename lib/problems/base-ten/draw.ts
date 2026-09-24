import type { Cell, DrawContext } from "../types";
import type { BaseTenProblem } from "./index";

export const BASE_TEN_CARD_HEIGHT = 40; // mm; five cards fit on a page

// Place-value table
const COL_W = 15;
const HEADER_H = 6;
const ROW_H = 8;
const ANSWER_H = 9;
const TABLE_H = HEADER_H + ROW_H * 2 + ANSWER_H;

// Blocks
const ROD_W = 3;
const ROD_H = 25; // ten units of 2.5mm
const ROD_GAP = 4.2;
const CUBE = 2.5; // one unit, same as a rod segment
const CUBE_GAP = 3.4;
const CUBES_PER_ROW = 3;
const PLUS_W = 10;

function drawRod(ctx: DrawContext, x: number, y: number) {
  const { doc } = ctx;
  doc.rect(x, y, ROD_W, ROD_H, "S");
  for (let i = 1; i < 10; i++) doc.line(x, y + (ROD_H / 10) * i, x + ROD_W, y + (ROD_H / 10) * i);
}

function groupWidth(n: number): number {
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  const rods = tens > 0 ? tens * ROD_GAP : 0;
  const cubes = ones > 0 ? Math.min(ones, CUBES_PER_ROW) * CUBE_GAP : 0;
  return rods + (tens > 0 && ones > 0 ? 1.5 : 0) + cubes;
}

/** Tens as rods, ones as cubes (rows of three) to the right, top-aligned */
function drawGroup(ctx: DrawContext, n: number, x: number, top: number) {
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  for (let i = 0; i < tens; i++) drawRod(ctx, x + i * ROD_GAP, top);
  const cubeX = x + (tens > 0 ? tens * ROD_GAP + 1.5 : 0);
  for (let i = 0; i < ones; i++) {
    const cx = cubeX + (i % CUBES_PER_ROW) * CUBE_GAP;
    const cy = top + Math.floor(i / CUBES_PER_ROW) * CUBE_GAP;
    ctx.doc.rect(cx, cy, CUBE, CUBE, "S");
  }
}

function drawPlaceValueTable(ctx: DrawContext, p: BaseTenProblem, x: number, top: number) {
  const { doc, font } = ctx;
  const [a, b] = p.operands;
  const midX = x + COL_W;

  doc.setDrawColor(60);
  doc.setLineWidth(0.3);
  doc.setFillColor(255, 255, 255);
  doc.rect(x, top, COL_W * 2, TABLE_H, "FD");
  doc.line(midX, top, midX, top + TABLE_H);
  doc.line(x, top + HEADER_H, x + COL_W * 2, top + HEADER_H);
  // Bar above the answer row
  doc.setLineWidth(0.5);
  doc.line(x, top + HEADER_H + ROW_H * 2, x + COL_W * 2, top + HEADER_H + ROW_H * 2);
  doc.setLineWidth(0.3);

  const centered = (s: string, colX: number, baseline: number) =>
    doc.text(s, colX + (COL_W - doc.getTextWidth(s)) / 2, baseline);

  doc.setFont(font, "bold");
  doc.setFontSize(7.5);
  centered("TENS", x, top + 4.3);
  centered("ONES", midX, top + 4.3);

  doc.setFont(font, "normal");
  doc.setFontSize(13);
  const row1 = top + HEADER_H + 6;
  const row2 = row1 + ROW_H;
  centered(String(Math.floor(a / 10)), x, row1);
  centered(String(a % 10), midX, row1);
  centered(String(Math.floor(b / 10)), x, row2);
  centered(String(b % 10), midX, row2);
  doc.setFontSize(10);
  doc.text("+", x + 1.5, row2);
}

export function drawBaseTenCard(ctx: DrawContext, cell: Cell, p: BaseTenProblem, number: number | null) {
  const { doc, font } = ctx;
  const x = cell.x;
  const y = cell.y + 1;
  const w = cell.width;
  const h = cell.height - 2;

  doc.setFillColor(246, 248, 251);
  doc.setDrawColor(221, 227, 235);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, w, h, 2, 2, "FD");
  doc.setTextColor(0);

  if (number !== null) {
    doc.setFont(font, "bold");
    doc.setFontSize(11);
    doc.text(`${number}.`, x + 4, y + 8);
  }

  const tableX = x + 13;
  drawPlaceValueTable(ctx, p, tableX, y + (h - TABLE_H) / 2);

  // Blocks: [a] + [b], centred in the space right of the table
  const [a, b] = p.operands;
  const areaX = tableX + COL_W * 2 + 8;
  const areaW = x + w - 6 - areaX;
  const total = groupWidth(a) + PLUS_W + groupWidth(b);
  const startX = areaX + Math.max(0, (areaW - total) / 2);
  const top = y + (h - ROD_H) / 2;

  doc.setDrawColor(40);
  doc.setLineWidth(0.25);
  drawGroup(ctx, a, startX, top);
  const plusX = startX + groupWidth(a) + PLUS_W / 2;
  doc.setFont(font, "normal");
  doc.setFontSize(13);
  doc.text("+", plusX - doc.getTextWidth("+") / 2, top + ROD_H / 2 + 1.5);
  drawGroup(ctx, b, startX + groupWidth(a) + PLUS_W, top);

  doc.setDrawColor(0);
  doc.setFontSize(12);
}
