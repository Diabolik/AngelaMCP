import { z } from "zod";

export const ToolNameSchema = z.enum([
  "bootstrap_task",
  "resume_task",
  "start_exploration",
  "read_project_context",
  "read_task_notes",
  "update_task_notes",
  "run_sherlock_analysis",
  "suggest_lesson_candidates",
  "draft_commit_message",
  "draft_pr_description",
  "run_code_review",
  "task_closure"
]);

export type ToolName = z.infer<typeof ToolNameSchema>;

export const StandardToolResponseSchema = z.object({
  status: z.enum(["success", "partial", "error"]),
  data: z.record(z.unknown()),
  warnings: z.array(z.string()),
  errors: z.array(z.string())
});

export type StandardToolResponse = z.infer<typeof StandardToolResponseSchema>;

export const BootstrapTaskArgsSchema = z.object({
  project: z.string().min(1),
  ticket: z.string().min(1)
});

export const ResumeTaskArgsSchema = BootstrapTaskArgsSchema;

export const StartExplorationArgsSchema = z.object({
  project: z.string().min(1),
  topic: z.string().min(1)
});

export const ReadProjectContextArgsSchema = z.object({
  project: z.string().min(1),
  section: z.string().min(1).optional()
});

export const ReadTaskNotesArgsSchema = z.object({
  ticket: z.string().min(1),
  section: z.string().min(1).optional()
});

export const UpdateTaskNotesArgsSchema = z.object({
  project: z.string().min(1),
  ticket: z.string().min(1),
  section: z.enum([
    "research_summary",
    "hypotheses",
    "findings",
    "decisions",
    "blockers",
    "next_steps",
    "local_test_evidence"
  ]),
  content: z.unknown()
});

export const RunSherlockAnalysisArgsSchema = z.object({
  project: z.string().min(1),
  ticket: z.string().min(1),
  reason: z.string().min(1),
  sherlock_version: z.string().min(1).optional(),
  analysis_result: z.object({
    content: z.string().min(1),
    final_confidence: z.number().min(0).max(1),
    open_questions_present: z.boolean(),
    lesson_candidates_present: z.boolean()
  }).optional()
});

export const SuggestLessonCandidatesArgsSchema = z.object({
  project: z.string().min(1),
  ticket: z.string().min(1),
  sources: z.array(z.enum(["task_notes", "sherlock"])).min(1)
});

export const DraftCommitMessageArgsSchema = z.object({
  ticket: z.string().min(1),
  summary: z.string().min(1),
  size: z.string().min(1).optional()
});

export const DraftPrDescriptionArgsSchema = z.object({
  project: z.string().min(1),
  ticket: z.string().min(1),
  sources: z.array(z.enum(["task_notes", "sherlock"])).min(1)
});

export const RunCodeReviewArgsSchema = z.object({
  project: z.string().min(1),
  ticket: z.string().min(1),
  review_scope: z.enum(["pre_pr", "pre_merge"]).default("pre_pr")
});

export const TaskClosureArgsSchema = z.object({
  project: z.string().min(1),
  ticket: z.string().min(1)
});

export type ToolSchemaMap = {
  bootstrap_task: typeof BootstrapTaskArgsSchema;
  resume_task: typeof ResumeTaskArgsSchema;
  start_exploration: typeof StartExplorationArgsSchema;
  read_project_context: typeof ReadProjectContextArgsSchema;
  read_task_notes: typeof ReadTaskNotesArgsSchema;
  update_task_notes: typeof UpdateTaskNotesArgsSchema;
  run_sherlock_analysis: typeof RunSherlockAnalysisArgsSchema;
  suggest_lesson_candidates: typeof SuggestLessonCandidatesArgsSchema;
  draft_commit_message: typeof DraftCommitMessageArgsSchema;
  draft_pr_description: typeof DraftPrDescriptionArgsSchema;
  run_code_review: typeof RunCodeReviewArgsSchema;
  task_closure: typeof TaskClosureArgsSchema;
};

export const TOOL_SCHEMAS: ToolSchemaMap = {
  bootstrap_task: BootstrapTaskArgsSchema,
  resume_task: ResumeTaskArgsSchema,
  start_exploration: StartExplorationArgsSchema,
  read_project_context: ReadProjectContextArgsSchema,
  read_task_notes: ReadTaskNotesArgsSchema,
  update_task_notes: UpdateTaskNotesArgsSchema,
  run_sherlock_analysis: RunSherlockAnalysisArgsSchema,
  suggest_lesson_candidates: SuggestLessonCandidatesArgsSchema,
  draft_commit_message: DraftCommitMessageArgsSchema,
  draft_pr_description: DraftPrDescriptionArgsSchema,
  run_code_review: RunCodeReviewArgsSchema,
  task_closure: TaskClosureArgsSchema
};

export type ToolArgumentsByName = {
  [K in keyof ToolSchemaMap]: z.infer<ToolSchemaMap[K]>;
};

export interface ToolDefinition<K extends ToolName = ToolName> {
  name: K;
  title: string;
  description: string;
  inputSchema: ToolSchemaMap[K];
  loadProfile: "light_bootstrap" | "heavy_resume" | "exploration" | "heavy_analysis" | "quality_gate" | "closure";
  writeAccess: boolean;
  modulesInvolved: string[];
}

export interface ToolExecutionContext {
  workspaceConfigPath: string;
  requestId: string;
}
