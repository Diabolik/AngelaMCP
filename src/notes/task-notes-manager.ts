import { writeFile } from "node:fs/promises";
import path from "node:path";
import { WorkspaceConfig } from "../config/workspace-config-loader.js";
import { fileExists, readFile, readFileIfExists } from "../utils/file-io.js";
import { formatTimestamp } from "../utils/time-utils.js";
import { parseTaskNotes, serializeTaskNotes } from "./notes-parser.js";
import { renderEntryBlock } from "./notes-renderer.js";

export interface ReadNotesResult extends Record<string, unknown> {
  ticket: string;
  section: string | null;
  summary: string[];
  sections_present: string[];
}

export interface AppendNoteResult extends Record<string, unknown> {
  ticket: string;
  section: string;
  timestamp_applied: string;
  file_updated: string;
  section_created: boolean;
}

export interface NotesSummary {
  highlights: string[];
  blockers_present: boolean;
  next_steps_present: boolean;
}

export class TaskNotesManager {
  // Creates task-notes.md if it does not exist. Returns the file path.
  public async ensureTaskNotesExists(config: WorkspaceConfig, ticket: string): Promise<string> {
    const filePath = this.resolveNotesPath(config, ticket);

    if (!(await fileExists(filePath))) {
      const timestamp = formatTimestamp();
      const header = `# Task Notes — ${ticket}\n\n_Created: ${timestamp}_`;
      await writeFile(filePath, header + "\n", "utf8");
    }

    return filePath;
  }

  // Reads notes for a ticket, optionally filtered to a single section.
  // Returns a summary array (one item per line of content) and the present section keys.
  public async readNotes(
    config: WorkspaceConfig,
    ticket: string,
    sectionKey?: string
  ): Promise<ReadNotesResult> {
    const filePath = this.resolveNotesPath(config, ticket);
    const raw = await readFileIfExists(filePath);
    const sectionsPresent = this.getSectionKeysPresent(config, raw ?? "");

    if (raw === null) {
      return { ticket, section: sectionKey ?? null, summary: [], sections_present: sectionsPresent };
    }

    const parsed = parseTaskNotes(raw);

    if (sectionKey !== undefined) {
      const title = this.keyToTitle(config, sectionKey);
      const found = parsed.sections.find((s) => s.title === title);
      const lines = found?.content
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean) ?? [];
      return { ticket, section: sectionKey, summary: lines, sections_present: sectionsPresent };
    }

    // No section specified: return highlights from all sections
    const highlights: string[] = [];
    for (const section of parsed.sections) {
      const firstLine = section.content.split("\n").find((l) => l.trim().length > 0);
      if (firstLine !== undefined) {
        highlights.push(`[${section.title}] ${firstLine.trim()}`);
      }
    }

    return { ticket, section: null, summary: highlights, sections_present: sectionsPresent };
  }

  // Returns a summary for use in resume_task response.
  public async summarizeNotes(config: WorkspaceConfig, ticket: string): Promise<NotesSummary> {
    const filePath = this.resolveNotesPath(config, ticket);
    const raw = await readFileIfExists(filePath);

    if (raw === null) {
      return { highlights: [], blockers_present: false, next_steps_present: false };
    }

    const parsed = parseTaskNotes(raw);
    const presentTitles = new Set(parsed.sections.map((s) => s.title));

    const blockersTitle = this.keyToTitle(config, "blockers");
    const nextStepsTitle = this.keyToTitle(config, "next_steps");
    const researchTitle = this.keyToTitle(config, "research_summary");

    const researchSection = parsed.sections.find((s) => s.title === researchTitle);
    const highlights = researchSection?.content
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.startsWith("-"))
      .slice(0, 3) ?? [];

    return {
      highlights,
      blockers_present: presentTitles.has(blockersTitle),
      next_steps_present: presentTitles.has(nextStepsTitle)
    };
  }

  // Appends a structured content entry to the given section, creating it if needed.
  public async appendNoteEntry(
    config: WorkspaceConfig,
    ticket: string,
    sectionKey: string,
    content: unknown
  ): Promise<AppendNoteResult> {
    const filePath = await this.ensureTaskNotesExists(config, ticket);
    const raw = await readFile(filePath);
    const parsed = parseTaskNotes(raw);
    const timestamp = formatTimestamp();
    const entryBlock = renderEntryBlock(sectionKey, content, timestamp);
    const sectionTitle = this.keyToTitle(config, sectionKey);

    const existingIndex = parsed.sections.findIndex((s) => s.title === sectionTitle);
    let sectionCreated = false;

    if (existingIndex !== -1) {
      const section = parsed.sections[existingIndex]!;
      section.content = section.content.length > 0
        ? `${section.content}\n\n${entryBlock}`
        : entryBlock;
    } else {
      // Insert the new section in canonical order
      const insertAt = this.resolveInsertPosition(config, parsed.sections, sectionKey);
      parsed.sections.splice(insertAt, 0, { title: sectionTitle, content: entryBlock });
      sectionCreated = true;
    }

    await writeFile(filePath, serializeTaskNotes(parsed), "utf8");

    return {
      ticket,
      section: sectionKey,
      timestamp_applied: timestamp,
      file_updated: filePath,
      section_created: sectionCreated
    };
  }

  // --- Private helpers ---

  private resolveNotesPath(config: WorkspaceConfig, ticket: string): string {
    return path.join(
      config.workspace.tasks_root,
      ticket,
      config.defaults.task_workspace.main_notes_file
    );
  }

  // Maps a section key to its display title using the workspace config.
  private keyToTitle(config: WorkspaceConfig, key: string): string {
    const section = config.defaults.task_notes.sections.find((s) => s.key === key);
    return section?.title ?? key;
  }

  // Returns the section keys that have content in the current notes file.
  private getSectionKeysPresent(config: WorkspaceConfig, raw: string): string[] {
    if (raw.length === 0) return [];
    const parsed = parseTaskNotes(raw);
    const presentTitles = new Set(parsed.sections.map((s) => s.title));
    return config.defaults.task_notes.sections
      .filter((s) => presentTitles.has(s.title))
      .map((s) => s.key);
  }

  // Finds the correct insertion index for a new section based on canonical order.
  private resolveInsertPosition(
    config: WorkspaceConfig,
    currentSections: Array<{ title: string }>,
    newSectionKey: string
  ): number {
    const canonicalKeys = config.defaults.task_notes.sections.map((s) => s.key);
    const canonicalTitles = config.defaults.task_notes.sections.map((s) => s.title);
    const newKeyIndex = canonicalKeys.indexOf(newSectionKey);

    // Find the last existing section whose canonical index is less than the new one
    let insertAfter = -1;
    for (let i = 0; i < currentSections.length; i++) {
      const existingTitle = currentSections[i]!.title;
      const existingCanonicalIndex = canonicalTitles.indexOf(existingTitle);
      if (existingCanonicalIndex !== -1 && existingCanonicalIndex < newKeyIndex) {
        insertAfter = i;
      }
    }

    return insertAfter + 1;
  }
}
