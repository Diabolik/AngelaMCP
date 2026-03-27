import path from "node:path";
import { WorkspaceConfig } from "../config/workspace-config-loader.js";
import { ContextLoader } from "../context/context-loader.js";
import { LessonsLoader } from "../lessons/lessons-loader.js";
import { readFileIfExists } from "../utils/file-io.js";

export interface CodeReviewBundle extends Record<string, unknown> {
  project: string;
  ticket: string;
  review_scope: string;
  documents_read: string[];
  documents: Array<{ label: string; content: string }>;
  flow_status: "ready_for_review";
}

export class CodeReviewEngine {
  private readonly contextLoader = new ContextLoader();
  private readonly lessonsLoader = new LessonsLoader();

  // Loads the quality gate context: engineering rules, project context,
  // task notes, sherlock analysis, and relevant lessons.
  // Returns a bundle for the model to perform the review.
  public async prepareBundle(
    config: WorkspaceConfig,
    project: string,
    ticket: string,
    reviewScope: string
  ): Promise<CodeReviewBundle> {
    const taskWorkspace = path.join(config.workspace.tasks_root, ticket);

    const [coreContext, lessons, taskNotesContent, sherlockContent] = await Promise.all([
      this.contextLoader.load(config, "quality_gate", project, ticket),
      this.lessonsLoader.load(config, project),
      readFileIfExists(
        path.join(taskWorkspace, config.defaults.task_workspace.main_notes_file)
      ),
      readFileIfExists(
        path.join(taskWorkspace, config.defaults.task_workspace.sherlock_file)
      )
    ]);

    const documents = [...coreContext.documents.map((d) => ({ label: d.label, content: d.content }))];
    const documentsRead = [...coreContext.documentsRead];

    if (lessons.globalContent !== null) {
      documents.push({ label: "global-lessons.md", content: lessons.globalContent });
      documentsRead.push("global-lessons.md");
    }

    if (lessons.projectContent !== null) {
      documents.push({ label: "project-lessons.md", content: lessons.projectContent });
      documentsRead.push("project-lessons.md");
    }

    if (taskNotesContent !== null && !documentsRead.includes("task-notes.md")) {
      documents.push({ label: "task-notes.md", content: taskNotesContent });
      documentsRead.push("task-notes.md");
    }

    if (sherlockContent !== null && !documentsRead.includes("sherlock-analysis.md")) {
      documents.push({ label: "sherlock-analysis.md", content: sherlockContent });
      documentsRead.push("sherlock-analysis.md");
    }

    return {
      project,
      ticket,
      review_scope: reviewScope,
      documents_read: documentsRead,
      documents,
      flow_status: "ready_for_review"
    };
  }
}
