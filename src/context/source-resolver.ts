import { WorkspaceConfig } from "../config/workspace-config-loader.js";
import { GlobalResourceScope, ProfileDirectives } from "./load-profiles.js";

// Indices into workspace.global_resources (order defined in angela-workspace.yaml)
const MINIMAL_GLOBAL_RESOURCE_COUNT = 2;
const ENGINEERING_RULES_INDEX = 1;

export interface SourcePlan {
  globalResourcePaths: string[];
  projectContextPaths: string[];
  globalLessonsPath: string | null;
  projectLessonsPath: string | null;
  taskNotesPath: string | null;
  sherlockAnalysisPath: string | null;
}

export function resolveSourcePlan(
  config: WorkspaceConfig,
  directives: ProfileDirectives,
  projectKey?: string,
  ticket?: string
): SourcePlan {
  const globalResourcePaths = resolveGlobalResources(
    config.workspace.global_resources,
    directives.globalResources
  );

  const projectContextPaths =
    directives.projectContext && projectKey
      ? (config.projects[projectKey]?.context_resources ?? [])
      : [];

  const globalLessonsPath = directives.globalLessons
    ? config.workspace.global_lessons_file
    : null;

  const projectLessonsPath =
    directives.projectLessons && projectKey
      ? (config.projects[projectKey]?.project_lessons_file ?? null)
      : null;

  const taskNotesPath =
    directives.taskNotes && ticket
      ? `${config.workspace.tasks_root}/${ticket}/${config.defaults.task_workspace.main_notes_file}`
      : null;

  const sherlockAnalysisPath =
    directives.sherlockAnalysis && ticket
      ? `${config.workspace.tasks_root}/${ticket}/${config.defaults.task_workspace.sherlock_file}`
      : null;

  return {
    globalResourcePaths,
    projectContextPaths,
    globalLessonsPath,
    projectLessonsPath,
    taskNotesPath,
    sherlockAnalysisPath
  };
}

function resolveGlobalResources(
  globalResources: string[],
  scope: GlobalResourceScope
): string[] {
  switch (scope) {
    case "none":
      return [];
    case "minimal":
      return globalResources.slice(0, MINIMAL_GLOBAL_RESOURCE_COUNT);
    case "rules_only": {
      const rulesFile = globalResources[ENGINEERING_RULES_INDEX];
      return rulesFile !== undefined ? [rulesFile] : [];
    }
    case "full":
      return [...globalResources];
  }
}
