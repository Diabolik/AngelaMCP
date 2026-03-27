import { writeFile } from "node:fs/promises";
import path from "node:path";
import { WorkspaceConfig } from "../config/workspace-config-loader.js";
import { fileExists } from "../utils/file-io.js";
import { formatTimestamp } from "../utils/time-utils.js";

export interface SherlockWriteResult {
  output_file: string;
  written_at: string;
}

export class SherlockDocumentWriter {
  // Persists the model-produced analysis content into sherlock-analysis.md.
  // Validates that the task workspace exists before writing.
  public async write(
    config: WorkspaceConfig,
    ticket: string,
    content: string
  ): Promise<SherlockWriteResult> {
    const taskWorkspace = path.join(config.workspace.tasks_root, ticket);

    if (!(await fileExists(taskWorkspace))) {
      throw new Error(
        `Task workspace '${taskWorkspace}' does not exist. Run bootstrap_task first.`
      );
    }

    const outputFile = path.join(taskWorkspace, config.defaults.sherlock_v3.output_file);
    const writtenAt = formatTimestamp();

    await writeFile(outputFile, content, "utf8");

    return { output_file: outputFile, written_at: writtenAt };
  }
}
