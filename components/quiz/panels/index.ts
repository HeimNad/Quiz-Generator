import { createElement, type ComponentType } from "react";
import type { ConfigOf, ProblemTypeId } from "@/lib/problems/registry";
import type { BaseConfig } from "@/lib/problems/types";
import { ArithmeticPanel } from "./ArithmeticPanel";
import { BaseTenPanel } from "./BaseTenPanel";
import { ComparePanel } from "./ComparePanel";
import { CountingPanel } from "./CountingPanel";
import { FractionPanel } from "./FractionPanel";
import { NumberWordsPanel } from "./NumberWordsPanel";
import { PercentPanel } from "./PercentPanel";
import { RoundingPanel } from "./RoundingPanel";
import type { PanelProps } from "./fields";

/** Settings panel per problem type; the mapped type makes a missing panel a compile error */
const PANELS: { [Id in ProblemTypeId]: ComponentType<PanelProps<ConfigOf<Id>>> } = {
  arithmetic: ArithmeticPanel,
  fraction: FractionPanel,
  compare: ComparePanel,
  rounding: RoundingPanel,
  percent: PercentPanel,
  counting: CountingPanel,
  "number-words": NumberWordsPanel,
  "base-ten": BaseTenPanel,
};

/** Renders the settings panel of the given problem type */
export function ProblemPanel({ typeId, ...props }: PanelProps<BaseConfig> & { typeId: ProblemTypeId }) {
  // Safe: the editor passes each panel the config its own type produced
  const panel = PANELS[typeId] as unknown as ComponentType<PanelProps<BaseConfig>>;
  return createElement(panel, props);
}
