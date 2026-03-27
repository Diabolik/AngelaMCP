import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { WorkspaceConfig } from "../config/workspace-config-loader.js";
import { readFileIfExists } from "../utils/file-io.js";
import { formatTimestamp } from "../utils/time-utils.js";

export interface LessonEntry {
  title: string;
  lesson: string;
  reason: string;
  scope: "global" | "project";
  tags: string[];
  example?: string;
  project?: string;
  source_task?: string;
}

export interface WrittenLesson {
  id: string;
  file: string;
  written_at: string;
}

export class LessonsWriter {
  // Writes a new lesson entry to the appropriate file (newest first).
  // Generates the lesson ID based on existing entries in the file.
  public async writeLesson(
    config: WorkspaceConfig,
    entry: LessonEntry,
    projectKey?: string
  ): Promise<WrittenLesson> {
    const filePath = this.resolveLessonsFile(config, entry.scope, projectKey);
    const existing = await readFileIfExists(filePath);
    const id = this.generateId(existing);
    const timestamp = formatTimestamp();

    const lessonBlock = this.renderLessonBlock(id, timestamp, entry);
    const updated = this.prependToFile(existing, lessonBlock);

    await writeFile(filePath, updated, "utf8");

    return { id, file: filePath, written_at: timestamp };
  }

  // Marks a lesson as deprecated by replacing its status line.
  public async deprecateLesson(
    config: WorkspaceConfig,
    lessonId: string,
    scope: "global" | "project",
    projectKey?: string
  ): Promise<void> {
    const filePath = this.resolveLessonsFile(config, scope, projectKey);
    const raw = await readFile(filePath, "utf8");
    const updated = raw.replace(
      new RegExp(`(###\\s+${lessonId}[\\s\\S]*?\\*\\*Status:\\*\\*)\\s*active`),
      "$1 deprecated"
    );
    await writeFile(filePath, updated, "utf8");
  }

  // --- Private helpers ---

  private resolveLessonsFile(
    config: WorkspaceConfig,
    scope: "global" | "project",
    projectKey?: string
  ): string {
    if (scope === "global") {
      return config.workspace.global_lessons_file;
    }

    const projectLessonsFile = projectKey !== undefined
      ? config.projects[projectKey]?.project_lessons_file
      : undefined;

    if (projectLessonsFile === undefined) {
      throw new Error(`Cannot resolve project lessons file: projectKey '${projectKey}' not found.`);
    }

    return projectLessonsFile;
  }

  // Generates a lesson ID in the format LL-YYYY-NNN (newest_first, so we scan for the highest N).
  private generateId(existingContent: string | null): string {
    const year = new Date().getFullYear();
    const prefix = `LL-${year}-`;

    if (existingContent === null) {
      return `${prefix}001`;
    }

    const matches = [...existingContent.matchAll(new RegExp(`${prefix}(\\d+)`, "g"))];
    const numbers = matches.map((m) => parseInt(m[1]!, 10));
    const highest = numbers.length > 0 ? Math.max(...numbers) : 0;

    return `${prefix}${String(highest + 1).padStart(3, "0")}`;
  }

  private renderLessonBlock(id: string, timestamp: string, entry: LessonEntry): string {
    const lines: string[] = [
      "---",
      "",
      `### ${id} — ${entry.title}`,
      "",
      `**Lesson:** ${entry.lesson}`,
      "",
      `**Reason:** ${entry.reason}`,
      ""
    ];

    if (entry.example !== undefined) {
      lines.push(`**Example:** ${entry.example}`, "");
    }

    const meta: string[] = [
      `**Tags:** ${entry.tags.join(", ")}`,
      `**Scope:** ${entry.scope}`
    ];
    if (entry.project !== undefined) meta.push(`**Project:** ${entry.project}`);
    if (entry.source_task !== undefined) meta.push(`**Source task:** ${entry.source_task}`);
    meta.push(`**Added:** ${timestamp}`);
    meta.push(`**Status:** active`);

    lines.push(meta.join(" | "), "");

    return lines.join("\n");
  }

  private prependToFile(existing: string | null, newBlock: string): string {
    if (existing === null || existing.trim().length === 0) {
      return `# Lessons\n\n${newBlock}\n`;
    }

    // Insert after the first heading line (if present), otherwise prepend
    const headingMatch = existing.match(/^(#[^\n]*\n)/);
    if (headingMatch) {
      return existing.replace(headingMatch[0], `${headingMatch[0]}\n${newBlock}\n`);
    }

    return `${newBlock}\n${existing}`;
  }
}
