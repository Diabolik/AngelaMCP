import { WorkspaceConfig } from "../config/workspace-config-loader.js";
import { readFileIfExists } from "../utils/file-io.js";

export interface LoadedLessons {
  globalContent: string | null;
  projectContent: string | null;
  documentsRead: string[];
}

export class LessonsLoader {
  // Loads global and project lesson files as raw content for model context.
  // Files may not exist yet if no lessons have been promoted — that is expected.
  public async load(config: WorkspaceConfig, projectKey: string): Promise<LoadedLessons> {
    const globalPath = config.workspace.global_lessons_file;
    const projectPath = config.projects[projectKey]?.project_lessons_file ?? null;

    const [globalContent, projectContent] = await Promise.all([
      readFileIfExists(globalPath),
      projectPath !== null ? readFileIfExists(projectPath) : Promise.resolve(null)
    ]);

    const documentsRead: string[] = [];
    if (globalContent !== null) documentsRead.push("global-lessons.md");
    if (projectContent !== null) documentsRead.push("project-lessons.md");

    return { globalContent, projectContent, documentsRead };
  }
}
