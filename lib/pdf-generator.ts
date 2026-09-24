import jsPDF from "jspdf";
import autoTable, { CellHookData } from "jspdf-autotable";
import { Problem } from "./math-generator";

const GLOBAL_X_OFFSET = 5; // Global offset to shift content to the right by 5mm

export interface PDFOptions {
  title: string;
  description?: string;
  includeAnswers?: boolean;
  content?: "all" | "problems" | "answers";
  showNumbers?: boolean;
  displayFormat?: "horizontal" | "vertical";
}

export async function generatePDF(
  problemsInput: Problem[] | Problem[][],
  options: PDFOptions,
  action: "download" | "print" | "blob-url" = "download",
  filename: string = "math-worksheets-batch.pdf"
): Promise<string | void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "letter",
  });

  doc.setProperties({
    title: options.title,
    author: "Math Generator",
  });

  // --- Load Chinese Font ---
  try {
    const fontUrl = "/fonts/NotoSansSC-Regular.ttf";

    const response = await fetch(fontUrl);
    if (!response.ok) {
      throw new Error("Failed to load local font");
    }
    const fontBuffer = await response.arrayBuffer();
    const fontBase64 = arrayBufferToBase64(fontBuffer);

    doc.addFileToVFS("NotoSansSC-Regular.ttf", fontBase64);
    doc.addFont("NotoSansSC-Regular.ttf", "NotoSansSC", "normal");
    doc.addFont("NotoSansSC-Regular.ttf", "NotoSansSC", "bold");
    doc.setFont("NotoSansSC");
  } catch (e) {
    console.warn("Could not load Chinese font. Using Helvetica fallback.", e);
    doc.setFont("helvetica");
  }

  function arrayBufferToBase64(buffer: ArrayBuffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  // --- Load Logo ---
  let logoBase64: string | null = null;
  try {
    const logoRes = await fetch("/colorfulFoxLogo.jpg");
    if (logoRes.ok) {
      logoBase64 = arrayBufferToBase64(await logoRes.arrayBuffer());
    }
  } catch (e) {
    console.warn("Logo load failed", e);
  }

  // Normalize input
  let batches: Problem[][] = [];
  if (Array.isArray(problemsInput) && problemsInput.length > 0) {
    if (Array.isArray(problemsInput[0])) {
      batches = problemsInput as Problem[][];
    } else {
      batches = [problemsInput as Problem[]];
    }
  } else {
    return;
  }

  const content = options.content || "all";

  // --- 智能分词器 ---
  // 将算式字符串拆分为有意义的 Token (分数, 运算符, 数字, 占位符)
  // 解决了之前如果用户输入没空格就会导致排版炸裂的问题
  const tokenizeEquation = (text: string): string[] => {
    // Regex explanation:
    // \d+\/\d+   -> Matches fractions like 1/2
    // \(.*?\)    -> Matches parentheses with content like (      )
    // ______     -> Matches underscores
    // [\+\-\×\÷\=] -> Matches operators
    // \d+        -> Matches integers
    // [^\s]+     -> Fallback for anything else not separated by space
    const regex = /(\d+\/\d+|\d+%|\d+\.\d+|_+%|\([^)]*\)%|\([^)]*\)|_+|[\+\-\×\÷\=]|\d+,|\d+|[^\s]+)/g;
    return text.match(regex) || [];
  };

  // --- Helper: Measure Width ---
  const measureElement = (text: string, fontSize: number): number => {
    if (/^\d+\/\d+$/.test(text)) {
      const [num, den] = text.split("/");
      doc.setFontSize(fontSize * 0.75);
      const numWidth = doc.getTextWidth(num);
      const denWidth = doc.getTextWidth(den);
      doc.setFontSize(fontSize);
      return Math.max(numWidth, denWidth) + 1; // +1mm padding
    } else if (text.includes("(") || text.includes("_")) {
      // Placeholders need explicit measuring
      return doc.getTextWidth(text);
    } else {
      return doc.getTextWidth(text);
    }
  };

  // --- 核心修复: 增强版绘制逻辑 (带自动缩放) ---
  const drawMathContent = (
    cell: any,
    rawTextArr: string[],
    isAnswer: boolean = false,
    hasIndex: boolean = true
  ) => {
    const fullText = Array.isArray(rawTextArr)
      ? rawTextArr.join(" ")
      : rawTextArr;
    const baseFontSize = cell.styles.fontSize;

    // 1. 分离序号和算式
    let indexPart = "";
    let equationPart = "";

    if (hasIndex) {
      const firstSpaceIndex = fullText.indexOf(" ");
      if (firstSpaceIndex > -1) {
        indexPart = fullText.substring(0, firstSpaceIndex).trim();
        equationPart = fullText.substring(firstSpaceIndex).trim();
      } else {
        indexPart = fullText;
      }
    } else {
      equationPart = fullText;
    }

    // 使用智能分词器，而不是简单的 split(" ")
    const parts = tokenizeEquation(equationPart);

    // 2. 绘制序号 (左对齐)
    const paddingLeft = cell.padding("left");
    const paddingRight = cell.padding("right");
    const startX = cell.x + paddingLeft;
    const centerY = cell.y + cell.height / 2;

    // 先用基准字号画序号
    doc.setFontSize(baseFontSize);
    doc.text(indexPart, startX, centerY + baseFontSize * 0.15);

    // 3. 计算布局 & 自动缩放 (Scale-to-Fit)
    const indexWidthReserved = hasIndex ? doc.getTextWidth(indexPart) + 4 : 0; // 序号宽度 + 间距
    const availableWidth =
      cell.width - paddingLeft - paddingRight - indexWidthReserved;

    // 预计算总宽度
    const spacing = 2.5; // 基础间距
    let totalContentWidth = 0;
    const partWidths = parts.map((p) => {
      const w = measureElement(p, baseFontSize);
      totalContentWidth += w + spacing;
      return w;
    });
    totalContentWidth -= spacing; // 减去最后一个多余的间距

    // === 关键逻辑: 计算缩放比例 ===
    // 如果内容总宽度 > 可用宽度，计算缩放因子 (最大缩放到 0.6 倍，防止太小看不清)
    let scale = 1;
    if (totalContentWidth > availableWidth) {
      scale = Math.max(0.6, availableWidth / totalContentWidth);
    }

    // 应用缩放后的字号和间距
    const effectiveFontSize = baseFontSize * scale;
    const effectiveSpacing = spacing * scale;

    // 4. 确定起始 X 坐标
    // [修改] 改为紧跟序号左对齐，取消原来的居中逻辑，以解决“距离太远”的问题
    let cursorX = startX + indexWidthReserved;

    // 5. 循环绘制
    parts.forEach((part, i) => {
      // 获取原始宽度并缩放
      const partWidth = partWidths[i] * scale;

      if (/^\d+\/\d+$/.test(part)) {
        // 绘制分数
        const [num, den] = part.split("/");

        // 分数内部字号再缩小一点 (0.75)
        const fractionFontSize = effectiveFontSize * 0.75;
        doc.setFontSize(fractionFontSize);

        const numW = doc.getTextWidth(num);
        const denW = doc.getTextWidth(den);

        const numX = cursorX + (partWidth - numW) / 2;
        const denX = cursorX + (partWidth - denW) / 2;

        // 垂直微调
        doc.text(num, numX, centerY - effectiveFontSize * 0.2);
        doc.text(den, denX, centerY + effectiveFontSize * 0.55);

        // 分数线
        const barWidth = Math.max(numW, denW) + 1 * scale;
        const barStart = cursorX + (partWidth - barWidth) / 2;

        doc.setLineWidth(0.25 * scale); // 线条也随缩放变细
        doc.setDrawColor(0);
        doc.line(barStart, centerY, barStart + barWidth, centerY);
      } else {
        // 绘制普通文本/符号
        doc.setFontSize(effectiveFontSize);
        const textW = doc.getTextWidth(part);
        const textX = cursorX + (partWidth - textW) / 2;

        // 微调 y 轴，保证视觉居中
        doc.text(part, textX, centerY + effectiveFontSize * 0.15);
      }

      cursorX += partWidth + effectiveSpacing;
    });

    // 恢复字号，以免影响后续
    doc.setFontSize(baseFontSize);
  };

  // --- 竖式绘制函数 ---
  const drawVerticalProblem = (
    cell: any,
    problem: Problem,
    showAnswer: boolean,
    hasIndex: boolean,
    problemNumber: number
  ) => {
    const baseFontSize = cell.styles.fontSize;
    const question = problem.question;

    // 尝试解析标准算式: "num1 op num2 =" (整数或小数)
    const match = question.match(
      /^(-?[\d.]+)\s*([\+\-×÷])\s*(-?[\d.]+)\s*=?\s*$/
    );
    if (!match) {
      // 不符合竖式格式，回退到横式
      const textArr = hasIndex
        ? [`${problemNumber}. ${question}`]
        : [question];
      drawMathContent(cell, textArr, showAnswer, hasIndex);
      return;
    }

    const num1Str = match[1];
    const opStr = match[2];
    const num2Str = match[3];
    const ansStr = problem.answer;

    doc.setFontSize(baseFontSize);

    const paddingLeft = cell.padding("left");
    const paddingTop = cell.padding("top");
    const paddingRight = cell.padding("right");

    // 计算各部分宽度
    const num1W = doc.getTextWidth(num1Str);
    const num2W = doc.getTextWidth(num2Str);
    const opW = doc.getTextWidth(opStr);
    const ansW = showAnswer ? doc.getTextWidth(ansStr) : 0;

    // 竖式块宽度: 足够容纳最宽的行 (op + gap + num2)
    const row2ContentW = opW + 2 + num2W;
    const blockWidth = Math.max(num1W, row2ContentW, ansW) + 3;

    // 序号标签
    const indexLabel = hasIndex ? `${problemNumber}.` : "";
    const indexW = hasIndex ? doc.getTextWidth(indexLabel) + 2 : 0;

    // 水平定位: 序号在左，竖式块居中于剩余空间
    const totalAvailW = cell.width - paddingLeft - paddingRight;
    const spaceForBlock = totalAvailW - indexW;
    const blockOffset = Math.max(2, (spaceForBlock - blockWidth) / 2);
    const blockStartX = cell.x + paddingLeft + indexW + blockOffset;
    const blockEndX = blockStartX + blockWidth;

    // 竖直定位: 计算内容块总高，在格子内居中
    const paddingBottom = cell.padding("bottom");
    const fh = baseFontSize * 0.32; // 字体高度近似 (mm)
    const ls = baseFontSize * 0.42; // 行间距 (mm)
    // 内容块高度: 从第一行文字顶到第三行文字底 (fh + ls + ls*0.45 + ls*0.8 + 1mm descent)
    const contentH = fh + ls * 2.25 + 1;
    const cellAvailH = cell.height - paddingTop - paddingBottom;
    const yOffset = Math.max(0, (cellAvailH - contentH) / 2);
    const row1Y = cell.y + paddingTop + yOffset + fh; // 第一行 (num1) 基线
    const row2Y = row1Y + ls;                          // 第二行 (op + num2) 基线
    const barY = row2Y + ls * 0.45;                    // 横线 y
    const row3Y = barY + ls * 0.8;                     // 第三行 (答案) 基线

    // 绘制序号 (灰色，左上角，与 num1 同行)
    if (hasIndex) {
      doc.setFontSize(baseFontSize * 0.85);
      doc.setTextColor(140, 140, 140);
      doc.text(indexLabel, cell.x + paddingLeft, row1Y);
      doc.setFontSize(baseFontSize);
      doc.setTextColor(0, 0, 0);
    }

    // 绘制第一行: num1 (右对齐至 blockEndX)
    doc.text(num1Str, blockEndX - num1W, row1Y);

    // 绘制第二行: op (左起) + num2 (右对齐)
    doc.text(opStr, blockStartX, row2Y);
    doc.text(num2Str, blockEndX - num2W, row2Y);

    // 绘制横线
    doc.setLineWidth(0.35);
    doc.setDrawColor(0, 0, 0);
    doc.line(blockStartX, barY, blockEndX, barY);

    // 绘制答案 (右对齐) 或空白
    if (showAnswer && ansStr) {
      doc.setTextColor(0, 0, 0);
      doc.text(ansStr, blockEndX - ansW, row3Y);
    }

    doc.setFontSize(baseFontSize);
  };

  const fontName = () =>
    doc.getFont().fontName === "NotoSansSC" ? "NotoSansSC" : "helvetica";

  // --- 页眉页脚 ---
  const drawHeaderFooter = (batchIndex: number, batchPage: number) => {
    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.text(
      "Name: __________________________",
      15 + GLOBAL_X_OFFSET,
      15
    );
    doc.text("Date: __________________", 95 + GLOBAL_X_OFFSET, 15);
    doc.text("Score: ____________", 160 + GLOBAL_X_OFFSET, 15);
    if (logoBase64) {
      doc.addImage(logoBase64, "JPEG", 15 + GLOBAL_X_OFFSET, 25, 15, 15);
    }
    doc.setFontSize(22);
    doc.setFont(fontName(), "bold");
    doc.text(options.title, 105 + GLOBAL_X_OFFSET, 30, {
      align: "center",
    });
    if (options.description) {
      doc.setFontSize(11);
      doc.setFont(fontName(), "normal");
      const splitText = doc.splitTextToSize(options.description, 170);
      doc.text(splitText, 105 + GLOBAL_X_OFFSET, 40, { align: "center" });
    }
    doc.setLineWidth(0.5);
    doc.line(15 + GLOBAL_X_OFFSET, 50, 195 + GLOBAL_X_OFFSET, 50);

    doc.setFontSize(8);
    doc.setTextColor(150);
    const pageLabel = batches.length > 1
      ? `${batchIndex + 1}-Page${batchPage}`
      : `Page ${batchPage}`;
    doc.text(pageLabel, 105 + GLOBAL_X_OFFSET, 265, { align: "center" });
    doc.setTextColor(0);
  };

  // --- 数数题 (一年级) ---
  const SHAPES_PER_ROW = 10;
  const SHAPE_COL_GAP = 7;
  const SHAPE_ROW_GAP = 5.5;

  const countingCardHeight = (p: Problem): number => {
    if (p.kind === "count-shapes") {
      const shapeRows = Math.ceil((p.shapeCount || 1) / SHAPES_PER_ROW);
      return 15 + shapeRows * SHAPE_ROW_GAP;
    }
    return 13;
  };

  const drawShape = (shape: string, cx: number, cy: number, s: number) => {
    const h = s / 2;
    if (shape === "circle") {
      doc.circle(cx, cy, h, "S");
    } else if (shape === "square") {
      doc.rect(cx - h, cy - h, s, s, "S");
    } else if (shape === "triangle") {
      doc.triangle(cx, cy - h, cx - h, cy + h, cx + h, cy + h, "S");
    } else {
      doc.lines([[h, h], [-h, h], [-h, -h], [h, -h]], cx, cy - h, [1, 1], "S", true);
    }
  };

  // Blank line for the student to write on
  const drawBlank = (x: number, baseline: number, w: number) => {
    doc.setDrawColor(160, 180, 200);
    doc.setLineWidth(0.3);
    doc.line(x, baseline + 0.8, x + w, baseline + 0.8);
    doc.setDrawColor(0);
  };

  const drawCountingCard = (cell: any, p: Problem, number: number, hasIndex: boolean) => {
    const x = cell.x;
    const y = cell.y + 1;
    const w = cell.width;
    const h = cell.height - 2;

    doc.setFillColor(246, 248, 251);
    doc.setDrawColor(221, 227, 235);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, w, h, 2, 2, "FD");
    doc.setDrawColor(0);

    const lineY = y + 7.5;
    let textX = x + 4;
    doc.setTextColor(0);
    if (hasIndex) {
      doc.setFontSize(11);
      doc.setFont(fontName(), "bold");
      doc.text(`${number}.`, textX, lineY);
      textX += 10;
    }
    doc.setFont(fontName(), "normal");
    doc.setFontSize(10.5);

    if (p.kind === "count-shapes") {
      doc.text(p.question, textX, lineY);
      doc.text("Answer:", x + w - 38, lineY);
      drawBlank(x + w - 23, lineY, 18);

      const n = p.shapeCount || 0;
      const size = 3.4;
      doc.setLineWidth(0.3);
      for (let i = 0; i < n; i++) {
        const col = i % SHAPES_PER_ROW;
        const row = Math.floor(i / SHAPES_PER_ROW);
        const cx = textX + 2 + col * SHAPE_COL_GAP;
        const cy = y + 13 + row * SHAPE_ROW_GAP;
        drawShape(p.shape || "circle", cx, cy, size);
      }
    } else if (p.kind === "missing-sequence") {
      doc.text("Fill in the missing number(s):", textX, lineY);
      const slotW = 17;
      const startX = x + 78;
      doc.setFontSize(13);
      doc.setFont(fontName(), "bold");
      (p.sequence || []).forEach((n, i) => {
        const slotX = startX + i * slotW;
        if (n === null) {
          drawBlank(slotX + 2, lineY, slotW - 4);
        } else {
          const s = n.toString();
          doc.text(s, slotX + (slotW - doc.getTextWidth(s)) / 2, lineY);
        }
      });
    } else if (p.kind === "count-sequence") {
      const verb = p.direction === "backward" ? "backward" : "forward";
      const blanks = (p.sequence || []).length - 1;
      doc.text(`Count ${verb}. Write the next ${blanks} numbers:`, textX, lineY);
      const startX = x + 98;
      doc.setFontSize(13);
      doc.setFont(fontName(), "bold");
      const startStr = `${p.sequence?.[0]},`;
      doc.text(startStr, startX, lineY);
      for (let i = 0; i < blanks; i++) {
        drawBlank(startX + 14 + i * 17, lineY, 13);
      }
    } else {
      doc.text(p.question, textX, lineY);
    }

    doc.setFont(fontName(), "normal");
    doc.setFontSize(12);
  };

  const renderCountingSheet = (problems: Problem[], batchIndex: number) => {
    let batchPage = 1;
    const showIdx = options.showNumbers !== false;

    // 题目类型变了就另起一页
    const groups: number[][] = [];
    problems.forEach((p, i) => {
      const last = groups[groups.length - 1];
      if (last && problems[last[0]].kind === p.kind) last.push(i);
      else groups.push([i]);
    });

    groups.forEach((group, gi) => {
      if (gi > 0) doc.addPage();
      autoTable(doc, {
        startY: 55,
        body: group.map((i) => [`[[${i}]]`]),
        theme: "plain",
        rowPageBreak: "avoid",
        styles: { fontSize: 1, cellPadding: 0, lineWidth: 0, font: fontName() },
        margin: { top: 55, bottom: 20, left: 15 + GLOBAL_X_OFFSET, right: 15 },
        didParseCell: (data: CellHookData) => {
          if (data.section !== "body") return;
          const raw = Array.isArray(data.cell.text) ? data.cell.text.join("") : String(data.cell.text);
          const m = raw.match(/^\[\[(\d+)\]\]/);
          if (!m) return;
          const idx = parseInt(m[1]);
          (data.cell as any)._problemIdx = idx;
          data.cell.styles.minCellHeight = countingCardHeight(problems[idx]);
          data.cell.text = [];
        },
        didDrawCell: (data: CellHookData) => {
          if (data.section !== "body") return;
          const idx = (data.cell as any)._problemIdx as number | undefined;
          if (idx === undefined) return;
          drawCountingCard(data.cell, problems[idx], idx + 1, showIdx);
        },
        didDrawPage: () => {
          drawHeaderFooter(batchIndex, batchPage);
          batchPage++;
        },
      });
    });
  };

  // --- 1. Generate Worksheets ---
  const showNums = options.showNumbers !== false;
  const isVertical = options.displayFormat === "vertical";

  if (content === "all" || content === "problems") {
    batches.forEach((problems, batchIndex) => {
      if (batchIndex > 0) doc.addPage();

      if (problems.some((p) => p.kind)) {
        renderCountingSheet(problems, batchIndex);
        return;
      }

      let batchPage = 1;
      const hasLongQuestions = problems.some((p) => p.question.length > 25);
      const colCount = isVertical ? 3 : (hasLongQuestions ? 2 : 3);
      // (letter: 279.4mm, startY=55, bottomMargin=20 → 可用 204mm)
      const pageAvailH = 279.4 - 55 - 20;
      const numRows = Math.ceil(problems.length / colCount);
      // 竖式最多7行/页，横排3列最多10行/页，横排2列最多15行/页
      const targetRowsPerPage = isVertical ? 7 : (colCount === 3 ? 10 : 15);
      const rowsForDynH = Math.min(numRows, targetRowsPerPage);
      const dynamicH = rowsForDynH > 0 ? Math.floor(pageAvailH / rowsForDynH) : 20;
      const minHeight = isVertical
        ? Math.min(Math.max(dynamicH, 26), 38)
        : Math.min(Math.max(dynamicH, 12), 22);
      const rows: string[][] = [];
      let currentRow: string[] = [];

      problems.forEach((p, index) => {
        if (isVertical) {
          // 竖式模式: 用 [[N]] 编码题目索引，避免分页时 row.index 被重置导致绘错
          currentRow.push(`[[${index}]]${showNums ? `${index + 1}. ${p.question}` : p.question}`);
        } else {
          let pdfQuestion = p.question;
          // 预处理占位符
          if (pdfQuestion.includes("___")) {
            const blankAtEnd = /_{3,}\s*$/.test(pdfQuestion);
            const blankBeforePercent = /_{3,}%/.test(pdfQuestion);
            if (!blankAtEnd && !blankBeforePercent) {
              // 填空在算式中间 (如 3 + ___ = 8) → 用括号表示空白
              if (
                !pdfQuestion.includes("+") &&
                !pdfQuestion.includes("-") &&
                !pdfQuestion.includes("×") &&
                !pdfQuestion.includes("÷") &&
                !pdfQuestion.includes(" of ")
              ) {
                pdfQuestion = pdfQuestion.replace("___", "(      )");
              } else {
                pdfQuestion = pdfQuestion.replace("___", "______");
              }
            }
            // 结尾下划线或 ______% → 保持原样
          }
          currentRow.push(showNums ? `${index + 1}. ${pdfQuestion}` : pdfQuestion);
        }
        if (currentRow.length === colCount) {
          rows.push(currentRow);
          currentRow = [];
        }
      });
      if (currentRow.length > 0) {
        while (currentRow.length < colCount) currentRow.push("");
        rows.push(currentRow);
      }

      autoTable(doc, {
        startY: 55,
        head: [],
        body: rows,
        theme: "plain",
        styles: {
          fontSize: 12,
          cellPadding: 4,
          valign: "middle",
          font:
            doc.getFont().fontName === "NotoSansSC"
              ? "NotoSansSC"
              : "helvetica",
          lineWidth: 0,
          minCellHeight: minHeight,
        },
        margin: { top: 55, bottom: 20, left: 10 + GLOBAL_X_OFFSET },
        didParseCell: (data: CellHookData) => {
          if (data.section === "body") {
            const rawJoined = Array.isArray(data.cell.text)
              ? data.cell.text.join("")
              : (data.cell.text as string);
            // 解析 [[N]] 编码（竖式模式专用，不依赖 row.index）
            const probIdxMatch = rawJoined.match(/^\[\[(\d+)\]\]/);
            if (isVertical && probIdxMatch) {
              const problemIdx = parseInt(probIdxMatch[1]);
              const p = problems[problemIdx];
              const displayText = rawJoined.replace(/^\[\[\d+\]\]/, "");
              const isArithmetic =
                /^-?[\d.]+ *[\+\-×÷] *-?[\d.]+ *=/.test(p.question);
              if (isArithmetic) {
                (data.cell as any)._isVertical = true;
                (data.cell as any)._problem = p;
                (data.cell as any)._problemIdx = problemIdx;
                (data.cell as any)._hasIndex = showNums;
                (data.cell as any)._showAnswer = false;
                data.cell.text = [];
                data.row.height = Math.max(data.row.height, minHeight);
                return;
              }
              // 非标准算式 (如填空题): 剥掉编码前缀，回退到横式绘制
              data.cell.text = [displayText];
            }
            const raw = Array.isArray(data.cell.text)
              ? data.cell.text.join("")
              : (data.cell.text as string);
            if (/\d/.test(raw)) {
              (data.cell as any)._rawText = data.cell.text;
              (data.cell as any)._hasIndex = showNums;
              data.cell.text = [];
              data.row.height = Math.max(data.row.height, minHeight);
            }
          }
        },
        didDrawCell: (data: CellHookData) => {
          if (data.section === "body") {
            if ((data.cell as any)._isVertical) {
              const p = (data.cell as any)._problem as Problem;
              const idx = (data.cell as any)._problemIdx as number;
              drawVerticalProblem(
                data.cell,
                p,
                (data.cell as any)._showAnswer,
                (data.cell as any)._hasIndex,
                idx + 1
              );
            } else if ((data.cell as any)._rawText) {
              drawMathContent(data.cell, (data.cell as any)._rawText, false, (data.cell as any)._hasIndex);
            }
          }
        },
        didDrawPage: () => {
          drawHeaderFooter(batchIndex, batchPage);
          batchPage++;
        },
      });
    });
  }

  // --- 2. Generate Answer Keys ---
  if (
    (content === "all" && options.includeAnswers !== false) ||
    content === "answers"
  ) {
    if (content === "all") {
      doc.addPage();
      doc.setFontSize(24);
      doc.setTextColor(0);
      doc.text("ANSWER KEYS", 105 + GLOBAL_X_OFFSET, 150, { align: "center" });
    }

    batches.forEach((problems, batchIndex) => {
      if (content === "all" || batchIndex > 0) doc.addPage();

      doc.setFontSize(18);
      doc.setTextColor(0);
      const ansKeyLabel = batches.length > 1
        ? `${options.title} - ANSWER KEY (${batchIndex + 1})`
        : `${options.title} - ANSWER KEY`;
      doc.text(ansKeyLabel, 105 + GLOBAL_X_OFFSET, 20, { align: "center" });

      const ansColCount = 3;
      // 答案页 startY=30，可用高度更多 (229mm)，每页最多8行
      const ansPageAvailH = 279.4 - 30 - 20;
      const ansNumRows = Math.ceil(problems.length / ansColCount);
      const ansRowsForDynH = Math.min(ansNumRows, 8);
      const ansDynamicH = ansRowsForDynH > 0 ? Math.floor(ansPageAvailH / ansRowsForDynH) : 38;
      const ansMinHeight = isVertical ? Math.min(Math.max(ansDynamicH, 26), 38) : 16;
      const answerRows: string[][] = [];
      let currentRow: string[] = [];

      problems.forEach((p, index) => {
        const cellText = isVertical
          ? `[[${index}]]${showNums ? `${index + 1}. ${p.question}` : p.question}`
          : (showNums ? `${index + 1}. ${p.answer}` : p.answer);
        currentRow.push(cellText);
        if (currentRow.length === ansColCount) {
          answerRows.push(currentRow);
          currentRow = [];
        }
      });
      if (currentRow.length > 0) {
        while (currentRow.length < ansColCount) currentRow.push("");
        answerRows.push(currentRow);
      }

      autoTable(doc, {
        startY: 30,
        body: answerRows,
        theme: "striped",
        styles: {
          fontSize: 11,
          cellPadding: 5,
          font:
            doc.getFont().fontName === "NotoSansSC"
              ? "NotoSansSC"
              : "helvetica",
          minCellHeight: ansMinHeight,
          valign: "middle",
        },
        margin: { top: 30, bottom: 20, left: 10 + GLOBAL_X_OFFSET },
        didParseCell: (data) => {
          if (data.section === "body") {
            const rawJoined = Array.isArray(data.cell.text)
              ? data.cell.text.join("")
              : (data.cell.text as string);
            const probIdxMatch = rawJoined.match(/^\[\[(\d+)\]\]/);
            if (isVertical && probIdxMatch) {
              const problemIdx = parseInt(probIdxMatch[1]);
              const p = problems[problemIdx];
              const displayText = rawJoined.replace(/^\[\[\d+\]\]/, "");
              const isArithmetic =
                /^-?[\d.]+ *[\+\-×÷] *-?[\d.]+ *=/.test(p.question);
              if (isArithmetic) {
                (data.cell as any)._isVertical = true;
                (data.cell as any)._problem = p;
                (data.cell as any)._problemIdx = problemIdx;
                (data.cell as any)._hasIndex = showNums;
                (data.cell as any)._showAnswer = true;
                data.cell.text = [];
                data.row.height = Math.max(data.row.height, ansMinHeight);
                return;
              }
              data.cell.text = [displayText];
            }
            const raw = Array.isArray(data.cell.text)
              ? data.cell.text.join("")
              : (data.cell.text as string);
            if (/\d/.test(raw)) {
              (data.cell as any)._rawText = data.cell.text;
              (data.cell as any)._hasIndex = showNums;
              data.cell.text = [];
              data.row.height = Math.max(data.row.height, ansMinHeight);
            }
          }
        },
        didDrawCell: (data) => {
          if (data.section === "body") {
            if ((data.cell as any)._isVertical) {
              const p = (data.cell as any)._problem as Problem;
              const idx = (data.cell as any)._problemIdx as number;
              drawVerticalProblem(
                data.cell,
                p,
                (data.cell as any)._showAnswer,
                (data.cell as any)._hasIndex,
                idx + 1
              );
            } else if ((data.cell as any)._rawText) {
              drawMathContent(data.cell, (data.cell as any)._rawText, true, (data.cell as any)._hasIndex);
            }
          }
        },
      });
    });
  }

  if (action === "print") {
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  } else if (action === "blob-url") {
    return doc.output("bloburl").toString();
  } else {
    doc.save(filename);
  }
}