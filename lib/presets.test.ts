import { beforeAll, describe, expect, it, vi } from "vitest";
import { buildPdf } from "@/lib/pdf/build";
import { PRESETS, presetConfig } from "@/lib/presets";
import { getProblemType, questionCount } from "@/lib/problems/registry";
import { createRng } from "@/lib/random";

beforeAll(() => {
  // No dev server in tests: asset fetches fail and the PDF falls back to Helvetica
  vi.stubGlobal("fetch", async () => ({ ok: false }));
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe.each(PRESETS.map((p) => [p.id, p] as const))("preset %s", (_, preset) => {
  const type = getProblemType(preset.type);
  const config = presetConfig(preset);

  it("generates a full worksheet", () => {
    const problems = type.generate(config, createRng(1));
    expect(problems).toHaveLength(questionCount(type, config));
  });

  it("builds a PDF with worksheets and answer keys", async () => {
    const rng = createRng(2);
    const doc = await buildPdf({
      type,
      config,
      batches: [type.generate(config, rng), type.generate(config, rng)],
      options: { title: preset.defaultTitle, content: "all", includeAnswers: true, showNumbers: true },
    });
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(4);
  });
});
