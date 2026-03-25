import {
  DraftCommitMessageArgsSchema,
  DraftPrDescriptionArgsSchema,
  ReadProjectContextArgsSchema,
  ReadTaskNotesArgsSchema,
  RunCodeReviewArgsSchema,
  RunSherlockAnalysisArgsSchema,
  StartExplorationArgsSchema,
  SuggestLessonCandidatesArgsSchema,
  TaskClosureArgsSchema,
  TOOL_SCHEMAS,
  ToolDefinition,
  ToolName,
  UpdateTaskNotesArgsSchema
} from "../models/tool-contracts.js";

const TOOL_DEFINITIONS: Record<ToolName, ToolDefinition> = {
  bootstrap_task: {
    name: "bootstrap_task",
    title: "Bootstrap Task",
    description: "Initialize a new task workspace with lean context and branch preparation.",
    inputSchema: TOOL_SCHEMAS.bootstrap_task,
    loadProfile: "light_bootstrap",
    writeAccess: true,
    modulesInvolved: ["tool_orchestrator", "workspace_config_loader", "context_loader", "workspace_manager", "task_notes_manager"]
  },
  resume_task: {
    name: "resume_task",
    title: "Resume Task",
    description: "Resume an existing task workspace with notes and prior analysis when available.",
    inputSchema: TOOL_SCHEMAS.resume_task,
    loadProfile: "heavy_resume",
    writeAccess: false,
    modulesInvolved: ["tool_orchestrator", "workspace_config_loader", "context_loader", "task_notes_manager"]
  },
  start_exploration: {
    name: "start_exploration",
    title: "Start Exploration",
    description: "Start project exploration without creating a task workspace or branch.",
    inputSchema: StartExplorationArgsSchema,
    loadProfile: "exploration",
    writeAccess: false,
    modulesInvolved: ["tool_orchestrator", "workspace_config_loader", "context_loader"]
  },
  read_project_context: {
    name: "read_project_context",
    title: "Read Project Context",
    description: "Read or summarize project context resources for the active project.",
    inputSchema: ReadProjectContextArgsSchema,
    loadProfile: "light_bootstrap",
    writeAccess: false,
    modulesInvolved: ["tool_orchestrator", "workspace_config_loader", "context_loader"]
  },
  read_task_notes: {
    name: "read_task_notes",
    title: "Read Task Notes",
    description: "Read or summarize the single living task-notes document.",
    inputSchema: ReadTaskNotesArgsSchema,
    loadProfile: "heavy_resume",
    writeAccess: false,
    modulesInvolved: ["tool_orchestrator", "task_notes_manager"]
  },
  update_task_notes: {
    name: "update_task_notes",
    title: "Update Task Notes",
    description: "Append structured content to the correct task-notes section.",
    inputSchema: UpdateTaskNotesArgsSchema,
    loadProfile: "heavy_resume",
    writeAccess: true,
    modulesInvolved: ["tool_orchestrator", "task_notes_manager"]
  },
  run_sherlock_analysis: {
    name: "run_sherlock_analysis",
    title: "Run Sherlock Analysis",
    description: "Execute deeper analysis with selective heavy context loading.",
    inputSchema: RunSherlockAnalysisArgsSchema,
    loadProfile: "heavy_analysis",
    writeAccess: true,
    modulesInvolved: ["tool_orchestrator", "context_loader", "sherlock_engine", "lessons_manager"]
  },
  suggest_lesson_candidates: {
    name: "suggest_lesson_candidates",
    title: "Suggest Lesson Candidates",
    description: "Extract and classify reusable lesson candidates without auto-promoting them.",
    inputSchema: SuggestLessonCandidatesArgsSchema,
    loadProfile: "heavy_analysis",
    writeAccess: false,
    modulesInvolved: ["tool_orchestrator", "lessons_manager"]
  },
  draft_commit_message: {
    name: "draft_commit_message",
    title: "Draft Commit Message",
    description: "Generate a commit message aligned with ticket and delivery rules.",
    inputSchema: DraftCommitMessageArgsSchema,
    loadProfile: "heavy_resume",
    writeAccess: false,
    modulesInvolved: ["tool_orchestrator", "delivery_formatter"]
  },
  draft_pr_description: {
    name: "draft_pr_description",
    title: "Draft PR Description",
    description: "Generate a PR description aligned with the delivery policy.",
    inputSchema: DraftPrDescriptionArgsSchema,
    loadProfile: "heavy_resume",
    writeAccess: false,
    modulesInvolved: ["tool_orchestrator", "delivery_formatter"]
  },
  run_code_review: {
    name: "run_code_review",
    title: "Run Code Review",
    description: "Apply the late quality gate with engineering rules and relevant lessons.",
    inputSchema: RunCodeReviewArgsSchema,
    loadProfile: "quality_gate",
    writeAccess: false,
    modulesInvolved: ["tool_orchestrator", "context_loader", "code_review_engine", "lessons_manager"]
  },
  task_closure: {
    name: "task_closure",
    title: "Task Closure",
    description: "Review the task state and prepare final closure readiness.",
    inputSchema: TaskClosureArgsSchema,
    loadProfile: "closure",
    writeAccess: false,
    modulesInvolved: ["tool_orchestrator", "task_notes_manager", "lessons_manager", "sherlock_engine"]
  }
};

export class ToolRegistry {
  public getAll(): ToolDefinition[] {
    return Object.values(TOOL_DEFINITIONS);
  }

  public get(toolName: ToolName): ToolDefinition {
    return TOOL_DEFINITIONS[toolName];
  }
}
