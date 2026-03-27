import { mkdir } from "node:fs/promises";
import path from "node:path";
import { WorkspaceConfig } from "../config/workspace-config-loader.js";
import { fileExists } from "../utils/file-io.js";

export interface TaskWorkspaceResult {
  task_workspace: string;
  task_notes_file: string;
  created: boolean;
  already_existed: boolean;
}

export class WorkspaceManager {
  // Creates the task workspace folder at {tasks_root}/{ticket}/.
  // Safe to call if the folder already exists (idempotent).
  public async ensureTaskWorkspace(
    config: WorkspaceConfig,
    ticket: string
  ): Promise<TaskWorkspaceResult> {
    const folderName = config.defaults.task_workspace.folder_name_pattern.replace(
      "{ticket}",
      ticket
    );
    const taskWorkspace = path.join(config.workspace.tasks_root, folderName);
    const taskNotesFile = path.join(
      taskWorkspace,
      config.defaults.task_workspace.main_notes_file
    );

    const alreadyExisted = await fileExists(taskWorkspace);

    if (!alreadyExisted) {
      await mkdir(taskWorkspace, { recursive: true });
    }

    return {
      task_workspace: taskWorkspace,
      task_notes_file: taskNotesFile,
      created: !alreadyExisted,
      already_existed: alreadyExisted
    };
  }

  // Returns the resolved paths for an existing task workspace without creating it.
  public resolveTaskWorkspacePaths(
    config: WorkspaceConfig,
    ticket: string
  ): { task_workspace: string; task_notes_file: string; sherlock_file: string } {
    const taskWorkspace = path.join(config.workspace.tasks_root, ticket);

    return {
      task_workspace: taskWorkspace,
      task_notes_file: path.join(taskWorkspace, config.defaults.task_workspace.main_notes_file),
      sherlock_file: path.join(taskWorkspace, config.defaults.task_workspace.sherlock_file)
    };
  }
}
