// Load profiles define what context each tool needs.
// The philosophy is: start lean, load deep only when needed.

export type LoadProfile =
  | "light_bootstrap"
  | "heavy_resume"
  | "exploration"
  | "heavy_analysis"
  | "quality_gate"
  | "closure";

// Controls which global resource files are included.
// Global resources are expected in this order in workspace.global_resources:
//   [0] angela-context.md
//   [1] angela-engineering-rules.md
//   [2] sherlock-v3.md
//   [3] lessons-system.md
//
// "minimal"    → first 2 (context + rules)
// "rules_only" → index 1 only (engineering rules)
// "full"       → all entries
// "none"       → nothing
export type GlobalResourceScope = "minimal" | "rules_only" | "full" | "none";

export interface ProfileDirectives {
  globalResources: GlobalResourceScope;
  globalLessons: boolean;
  projectContext: boolean;
  projectLessons: boolean;
  taskNotes: boolean;
  sherlockAnalysis: boolean;
}

export const PROFILE_DIRECTIVES: Record<LoadProfile, ProfileDirectives> = {
  light_bootstrap: {
    globalResources: "minimal",
    globalLessons: false,
    projectContext: true,
    projectLessons: false,
    taskNotes: false,
    sherlockAnalysis: false
  },
  heavy_resume: {
    globalResources: "minimal",
    globalLessons: false,
    projectContext: true,
    projectLessons: false,
    taskNotes: true,
    sherlockAnalysis: true
  },
  exploration: {
    globalResources: "minimal",
    globalLessons: false,
    projectContext: true,
    projectLessons: false,
    taskNotes: false,
    sherlockAnalysis: false
  },
  heavy_analysis: {
    globalResources: "full",
    globalLessons: true,
    projectContext: true,
    projectLessons: true,
    taskNotes: true,
    sherlockAnalysis: true
  },
  quality_gate: {
    globalResources: "rules_only",
    globalLessons: true,
    projectContext: true,
    projectLessons: true,
    taskNotes: true,
    sherlockAnalysis: true
  },
  closure: {
    globalResources: "none",
    globalLessons: false,
    projectContext: false,
    projectLessons: false,
    taskNotes: true,
    sherlockAnalysis: true
  }
};
