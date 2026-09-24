"use client";

import { MAX_WORDS_NUMBER, type NumberWordsConfig, type NumberWordsKind } from "@/lib/problems/number-words";
import { CheckboxGroup, RangeFields, type PanelProps } from "./fields";

const KINDS: { value: NumberWordsKind; label: string }[] = [
  { value: "to-words", label: "数字写英文 (Write 93 in words)" },
  { value: "to-number", label: "英文写数字 (Write the number: fourteen)" },
];

export function NumberWordsPanel({ config, onChange }: PanelProps<NumberWordsConfig>) {
  const set = (patch: Partial<NumberWordsConfig>) => onChange({ ...config, ...patch });
  return (
    <>
      <CheckboxGroup id="kind" label="题目类型" options={KINDS} selected={config.kinds} onChange={(kinds) => set({ kinds })} />
      <RangeFields id="range" range={config.range} onChange={(range) => set({ range })} />
      <p className="text-[10px] text-slate-500">支持 0 – {MAX_WORDS_NUMBER}，1000 以上每行一题</p>
    </>
  );
}
