import { drawBlank } from "@/lib/pdf/draw";
import type { Cell, DrawContext } from "../types";
import type { CountingProblem, ShapeType } from "./index";

const SHAPES_PER_ROW = 10;
const SHAPE_COL_GAP = 7; // mm
const SHAPE_ROW_GAP = 5.5; // mm
const SHAPE_SIZE = 3.4; // mm

const SHAPE_NAMES: Record<ShapeType, string> = {
  circle: "circles",
  square: "squares",
  triangle: "triangles",
  diamond: "diamonds",
};

export function countingCardHeight(p: CountingProblem): number {
  if (p.kind === "count-shapes") {
    return 15 + Math.ceil(Math.max(p.count, 1) / SHAPES_PER_ROW) * SHAPE_ROW_GAP;
  }
  return 13;
}

function drawShape(ctx: DrawContext, shape: ShapeType, cx: number, cy: number) {
  const { doc } = ctx;
  const h = SHAPE_SIZE / 2;
  switch (shape) {
    case "circle":
      doc.circle(cx, cy, h, "S");
      break;
    case "square":
      doc.rect(cx - h, cy - h, SHAPE_SIZE, SHAPE_SIZE, "S");
      break;
    case "triangle":
      doc.triangle(cx, cy - h, cx - h, cy + h, cx + h, cy + h, "S");
      break;
    case "diamond":
      doc.lines([[h, h], [-h, h], [-h, -h], [h, -h]], cx, cy - h, [1, 1], "S", true);
      break;
  }
}

/** One full-width card: light rounded box, number, prompt and the drawing */
export function drawCountingCard(ctx: DrawContext, cell: Cell, p: CountingProblem, number: number | null) {
  const { doc, font } = ctx;
  const x = cell.x;
  const y = cell.y + 1;
  const w = cell.width;

  doc.setFillColor(246, 248, 251);
  doc.setDrawColor(221, 227, 235);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, w, cell.height - 2, 2, 2, "FD");
  doc.setDrawColor(0);
  doc.setTextColor(0);

  const lineY = y + 7.5;
  let textX = x + 4;
  if (number !== null) {
    doc.setFont(font, "bold");
    doc.setFontSize(11);
    doc.text(`${number}.`, textX, lineY);
    textX += 10;
  }
  doc.setFont(font, "normal");
  doc.setFontSize(10.5);

  const setBigNumbers = () => {
    doc.setFont(font, "bold");
    doc.setFontSize(13);
  };

  switch (p.kind) {
    case "count-shapes": {
      doc.text(`Count the ${SHAPE_NAMES[p.shape]}.`, textX, lineY);
      doc.text("Answer:", x + w - 38, lineY);
      drawBlank(ctx, x + w - 23, lineY, 18);
      doc.setLineWidth(0.3);
      for (let i = 0; i < p.count; i++) {
        const cx = textX + 2 + (i % SHAPES_PER_ROW) * SHAPE_COL_GAP;
        const cy = y + 13 + Math.floor(i / SHAPES_PER_ROW) * SHAPE_ROW_GAP;
        drawShape(ctx, p.shape, cx, cy);
      }
      break;
    }
    case "missing-sequence": {
      doc.text("Fill in the missing number(s):", textX, lineY);
      const slotW = 17;
      const startX = x + 78;
      setBigNumbers();
      p.sequence.forEach((n, i) => {
        const slotX = startX + i * slotW;
        if (n === null) {
          drawBlank(ctx, slotX + 2, lineY, slotW - 4);
        } else {
          const s = String(n);
          doc.text(s, slotX + (slotW - doc.getTextWidth(s)) / 2, lineY);
        }
      });
      break;
    }
    case "count-sequence": {
      doc.text(`Count ${p.direction}. Write the next ${p.steps} numbers:`, textX, lineY);
      const startX = x + 98;
      setBigNumbers();
      doc.text(`${p.start},`, startX, lineY);
      for (let i = 0; i < p.steps; i++) drawBlank(ctx, startX + 14 + i * 17, lineY, 13);
      break;
    }
  }

  doc.setFont(font, "normal");
  doc.setFontSize(12);
}
