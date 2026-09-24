import { QuizConfig } from "./math-generator";
import { RoundHundredConfig } from "@/components/quiz/rules/RoundHundredConfig";

export interface SpecialRuleDef {
  id: string;
  name: string;
  // UI Component to render in sidebar for configuration
  ConfigComponent?: React.ComponentType<{
    config: QuizConfig;
    setConfig: (c: QuizConfig) => void;
  }>;
}

// Registry map: ruleID -> Definition
export const SPECIAL_RULES: Record<string, SpecialRuleDef> = {
  'round-hundred-minus-two-digit': {
     id: 'round-hundred-minus-two-digit',
     name: '整百减两位数',
     ConfigComponent: RoundHundredConfig
  },
  'missing-number': {
      id: 'missing-number',
      name: '填空题',
      // No extra config UI for now, but we could add one later
  },
  'none': {
      id: 'none',
      name: '无',
  }
};
