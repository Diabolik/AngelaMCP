import { exec } from "node:child_process";
import { promisify } from "node:util";
import { WorkspaceConfig } from "../config/workspace-config-loader.js";

const execAsync = promisify(exec);

export interface BranchResult {
  name: string;
  created: boolean;
  collision_detected: boolean;
}

export interface BranchCheckResult {
  name: string;
  exists: boolean;
}

export class BranchManager {
  // Creates the task branch respecting the collision strategy from workspace config.
  // If the base branch name exists, appends an incrementing suffix (_1, _2, ...).
  public async createBranch(
    config: WorkspaceConfig,
    ticket: string
  ): Promise<BranchResult> {
    const policy = config.defaults.branch_policy;

    if (!policy.enabled) {
      return { name: "", created: false, collision_detected: false };
    }

    const baseName = policy.pattern.replace("{ticket}", ticket);
    const collision = policy.collision_strategy;

    const existingBranches = await this.listBranches();
    const collisionDetected = existingBranches.includes(baseName);

    let branchName = baseName;

    if (collisionDetected && collision.enabled) {
      let suffix = collision.start_at;
      while (existingBranches.includes(`${baseName}${collision.separator}${suffix}`)) {
        suffix++;
      }
      branchName = `${baseName}${collision.separator}${suffix}`;
    }

    await execAsync(`git checkout -b ${branchName}`);

    return {
      name: branchName,
      created: true,
      collision_detected: collisionDetected
    };
  }

  // Checks whether a branch already exists (used by resume_task).
  public async checkBranch(
    config: WorkspaceConfig,
    ticket: string
  ): Promise<BranchCheckResult> {
    const policy = config.defaults.branch_policy;
    const expectedName = policy.pattern.replace("{ticket}", ticket);
    const existingBranches = await this.listBranches();

    return {
      name: expectedName,
      exists: existingBranches.includes(expectedName)
    };
  }

  private async listBranches(): Promise<string[]> {
    const { stdout } = await execAsync("git branch --format=%(refname:short)");
    return stdout
      .split("\n")
      .map((b) => b.trim())
      .filter(Boolean);
  }
}
