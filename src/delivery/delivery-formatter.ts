import path from "node:path";
import { WorkspaceConfig } from "../config/workspace-config-loader.js";
import { readFileIfExists } from "../utils/file-io.js";
import { CommitBuilder } from "./commit-builder.js";
import { PrBuilder } from "./pr-builder.js";

export interface CommitDraftResult extends Record<string, unknown> {
  ticket: string;
  subject: string;
  body: string;
}

export interface PrDraftResult extends Record<string, unknown> {
  ticket: string;
  title: string;
  description: string;
  sources_read: string[];
  documents: Array<{ label: string; content: string }>;
}

export class DeliveryFormatter {
  private readonly commitBuilder = new CommitBuilder();
  private readonly prBuilder = new PrBuilder();

  public draftCommit(
    config: WorkspaceConfig,
    ticket: string,
    summary: string,
    size?: string
  ): CommitDraftResult {
    const draft = this.commitBuilder.build(config, ticket, summary, size);
    return { ticket, subject: draft.subject, body: draft.body };
  }

  public async draftPr(
    config: WorkspaceConfig,
    project: string,
    ticket: string,
    sources: Array<"task_notes" | "sherlock">
  ): Promise<PrDraftResult> {
    const taskWorkspace = path.join(config.workspace.tasks_root, ticket);

    const [taskNotesContent, sherlockContent] = await Promise.all([
      sources.includes("task_notes")
        ? readFileIfExists(path.join(taskWorkspace, config.defaults.task_workspace.main_notes_file))
        : Promise.resolve(null),
      sources.includes("sherlock")
        ? readFileIfExists(path.join(taskWorkspace, config.defaults.task_workspace.sherlock_file))
        : Promise.resolve(null)
    ]);

    // Extract a one-line summary from task notes research_summary if available
    const summary = this.extractSummaryHint(taskNotesContent);

    const draft = this.prBuilder.build(config, ticket, summary, {
      taskNotesContent: taskNotesContent ?? undefined,
      sherlockContent: sherlockContent ?? undefined
    });

    const documents: Array<{ label: string; content: string }> = [];
    const sourcesRead: string[] = [];

    if (taskNotesContent !== null) {
      documents.push({ label: "task-notes.md", content: taskNotesContent });
      sourcesRead.push("task-notes.md");
    }
    if (sherlockContent !== null) {
      documents.push({ label: "sherlock-analysis.md", content: sherlockContent });
      sourcesRead.push("sherlock-analysis.md");
    }

    return {
      ticket,
      title: draft.title,
      description: draft.description,
      sources_read: sourcesRead,
      documents
    };
  }

  // Extracts the first meaningful line from task notes as a summary hint for the PR title.
  private extractSummaryHint(taskNotesContent: string | null): string {
    if (taskNotesContent === null) return "{summary}";

    const firstBullet = taskNotesContent
      .split("\n")
      .find((l) => l.trim().startsWith("- "));

    return firstBullet?.trim().replace(/^- /, "") ?? "{summary}";
  }
}
