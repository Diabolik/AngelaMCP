import path from "node:path";
import { WorkspaceConfig } from "../config/workspace-config-loader.js";
import { readFileIfExists } from "../utils/file-io.js";
import { CandidateExtractor } from "./candidate-extractor.js";
import { LessonsLoader } from "./lessons-loader.js";

export interface SuggestionBundle extends Record<string, unknown> {
  project: string;
  ticket: string;
  sources_read: Array<"task_notes" | "sherlock">;
  raw_candidates: Array<{ source: string; content: string }>;
  documents_read: string[];
  documents: Array<{ label: string; content: string }>;
}

export interface ClosureBundle extends Record<string, unknown> {
  project: string;
  ticket: string;
  task_workspace: string;
  notes_reviewed: boolean;
  sherlock_reviewed: boolean;
  lesson_candidates_reviewed: boolean;
  promotions_pending: number;
  documents_read: string[];
  documents: Array<{ label: string; content: string }>;
}

export class LessonsManager {
  private readonly loader = new LessonsLoader();
  private readonly extractor = new CandidateExtractor();

  // Loads existing lessons and extracts raw candidates from the specified sources.
  // Returns a bundle for the model to classify and suggest.
  public async prepareSuggestionBundle(
    config: WorkspaceConfig,
    project: string,
    ticket: string,
    sources: Array<"task_notes" | "sherlock">
  ): Promise<SuggestionBundle> {
    const [lessonsLoaded, rawCandidates] = await Promise.all([
      this.loader.load(config, project),
      this.extractor.extract(config, ticket, sources)
    ]);

    const documents: Array<{ label: string; content: string }> = [];

    if (lessonsLoaded.globalContent !== null) {
      documents.push({ label: "global-lessons.md", content: lessonsLoaded.globalContent });
    }

    if (lessonsLoaded.projectContent !== null) {
      documents.push({ label: "project-lessons.md", content: lessonsLoaded.projectContent });
    }

    return {
      project,
      ticket,
      sources_read: sources,
      raw_candidates: rawCandidates,
      documents_read: lessonsLoaded.documentsRead,
      documents
    };
  }

  // Loads all closure artifacts: task notes, sherlock, lesson candidates, and existing lessons.
  // Returns a bundle for the model to review before closing the task.
  public async prepareClosureBundle(
    config: WorkspaceConfig,
    project: string,
    ticket: string
  ): Promise<ClosureBundle> {
    const taskWorkspace = path.join(config.workspace.tasks_root, ticket);
    const notesPath = path.join(taskWorkspace, config.defaults.task_workspace.main_notes_file);
    const sherlockPath = path.join(taskWorkspace, config.defaults.task_workspace.sherlock_file);

    const [taskNotesContent, sherlockContent, lessonsLoaded, candidates] = await Promise.all([
      readFileIfExists(notesPath),
      readFileIfExists(sherlockPath),
      this.loader.load(config, project),
      this.extractor.extract(config, ticket, ["task_notes", "sherlock"])
    ]);

    const documents: Array<{ label: string; content: string }> = [];
    const documentsRead: string[] = [];

    if (taskNotesContent !== null) {
      documents.push({ label: "task-notes.md", content: taskNotesContent });
      documentsRead.push("task-notes.md");
    }

    if (sherlockContent !== null) {
      documents.push({ label: "sherlock-analysis.md", content: sherlockContent });
      documentsRead.push("sherlock-analysis.md");
    }

    if (lessonsLoaded.globalContent !== null) {
      documents.push({ label: "global-lessons.md", content: lessonsLoaded.globalContent });
      documentsRead.push("global-lessons.md");
    }

    if (lessonsLoaded.projectContent !== null) {
      documents.push({ label: "project-lessons.md", content: lessonsLoaded.projectContent });
      documentsRead.push("project-lessons.md");
    }

    // Count candidate entries across all sources (each non-empty line starting with "-")
    const promotionsPending = candidates.reduce((total, section) => {
      const bulletCount = section.content
        .split("\n")
        .filter((l) => l.trim().startsWith("-")).length;
      return total + bulletCount;
    }, 0);

    return {
      project,
      ticket,
      task_workspace: taskWorkspace,
      notes_reviewed: taskNotesContent !== null,
      sherlock_reviewed: sherlockContent !== null,
      lesson_candidates_reviewed: candidates.length > 0,
      promotions_pending: promotionsPending,
      documents_read: documentsRead,
      documents
    };
  }
}
