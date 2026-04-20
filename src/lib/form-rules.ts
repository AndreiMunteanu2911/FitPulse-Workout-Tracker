import patternsJson from "@/lib/form-patterns.json";
import type {
  ExerciseFormRules,
  ExerciseFormRuleOverrideSet,
  FormRuleApplicability,
  FormRulePhase,
  FormRulePrimaryMetric,
  FormRuleSeverity,
  FormRuleView,
} from "@/types";

export interface FormPatternRule {
  id: string;
  landmarks: [number, number, number];
  phase: FormRulePhase;
  min: number;
  max: number;
  severity: FormRuleSeverity;
  holdFrames: number;
  visibilityThreshold: number;
  cue: string;
}

export interface FormPatternTempo {
  eccentricSeconds: number;
  pauseSeconds: number;
  concentricSeconds: number;
}

export interface FormPatternDefinition {
  id: string;
  label: string;
  applicability: FormRuleApplicability;
  view: FormRuleView;
  primaryMetric: FormRulePrimaryMetric;
  rules: FormPatternRule[];
  universalChecks: {
    spine: boolean;
    symmetry: boolean;
    stability: boolean;
  };
  tempo?: FormPatternTempo;
}

export interface ResolvedFormRule extends FormPatternRule {
  sourcePatternId: string;
}

export interface ResolvedExerciseFormRules {
  pattern: FormPatternDefinition;
  applicability: FormRuleApplicability;
  view: FormRuleView;
  confidence: number;
  primaryMetric: FormRulePrimaryMetric;
  rules: ResolvedFormRule[];
  review: ExerciseFormRules["review"];
}

const patternCatalog = patternsJson as FormPatternDefinition[];

export const FORM_PATTERNS = patternCatalog;
export const FORM_PATTERN_IDS = new Set(FORM_PATTERNS.map((pattern) => pattern.id));

export function getFormPatternById(patternId: string): FormPatternDefinition | null {
  return FORM_PATTERNS.find((pattern) => pattern.id === patternId) ?? null;
}

export function createEmptyOverrides(): ExerciseFormRuleOverrideSet {
  return {
    disabledRuleIds: [],
    ruleThresholds: [],
    cueOverrides: [],
  };
}

export function resolveExerciseFormRules(
  formRules: ExerciseFormRules | null | undefined,
): ResolvedExerciseFormRules | null {
  if (!formRules) return null;

  const pattern = getFormPatternById(formRules.patternId);
  if (!pattern) return null;

  const thresholdOverrides = new Map(
    formRules.overrides.ruleThresholds.map((override) => [override.ruleId, override]),
  );
  const cueOverrides = new Map(
    formRules.overrides.cueOverrides.map((override) => [override.ruleId, override.cue]),
  );
  const disabledRuleIds = new Set(formRules.overrides.disabledRuleIds);

  const rules = pattern.rules
    .filter((rule) => !disabledRuleIds.has(rule.id))
    .map((rule) => {
      const thresholdOverride = thresholdOverrides.get(rule.id);
      return {
        ...rule,
        min: thresholdOverride?.min ?? rule.min,
        max: thresholdOverride?.max ?? rule.max,
        cue: cueOverrides.get(rule.id) ?? rule.cue,
        sourcePatternId: pattern.id,
      };
    });

  return {
    pattern,
    applicability: formRules.applicability,
    view: formRules.view,
    confidence: formRules.confidence,
    primaryMetric: formRules.primaryMetric,
    rules,
    review: formRules.review,
  };
}
