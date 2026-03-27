import path from "node:path";
import { WorkspaceConfig } from "../config/workspace-config-loader.js";
import { parseTaskNotes } from "../notes/notes-parser.js";
import { readFileIfExists } from "../utils/file-io.js";

// Section titles to look for in markdown files
const LESSON_CANDIDATES_SECTION = "Lesson Candidates";

export interface RawCandidateSection {
  source: "task_notes" | "sherlock";
  content: string;
}

export class CandidateExtractor {
  // Reads the specified sources and extracts content from their Lesson Candidates sections.
  // Returns raw section content for the model to parse and classify.
  public async extract(
    config: WorkspaceConfig,
    ticket: string,
    sources: Array<"task_notes" | "sherlock">
  ): Promise<RawCandidateSection[]> {
    const results: RawCandidateSection[] = [];

    for (const source of sources) {
      const filePath = this.resolveSourcePath(config, ticket, source);
      const raw = await readFileIfExists(filePath);

      if (raw === null) continue;

      const parsed = parseTaskNotes(raw);
      const section = parsed.sections.find((s) => s.title === LESSON_CANDIDATES_SECTION);

      if (section !== undefined && section.content.trim().length > 0) {
        results.push({ source, content: section.content.trim() });
      }
    }

    return results;
  }

  private resolveSourcePath(
    config: WorkspaceConfig,
    ticket: string,
    source: "task_notes" | "sherlock"
  ): string {
    const taskWorkspace = path.join(config.workspace.tasks_root, ticket);

    if (source === "task_notes") {
      return path.join(taskWorkspace, config.defaults.task_workspace.main_notes_file);
    }

    return path.join(taskWorkspace, config.defaults.task_workspace.sherlock_file);
  }
}
