import { WorkspaceConfig } from "../config/workspace-config-loader.js";

const FALLBACK_SHERLOCK_VERSION = "v3";

export class SherlockRegistry {
  // Resolves the active Sherlock version.
  // Priority: explicit request arg → env override → fallback default.
  public resolveVersion(config: WorkspaceConfig, requestedVersion?: string): string {
    if (requestedVersion !== undefined && requestedVersion.length > 0) {
      return requestedVersion;
    }
    return process.env["DEFAULT_SHERLOCK_VERSION"] ?? FALLBACK_SHERLOCK_VERSION;
  }

  // Returns the output file name for Sherlock analysis from workspace config.
  public resolveOutputFileName(config: WorkspaceConfig): string {
    return config.defaults.sherlock_v3.output_file;
  }

  // Returns the reflection threshold from workspace config.
  public resolveReflectionThreshold(config: WorkspaceConfig): number {
    return config.defaults.sherlock_v3.reflection_threshold;
  }
}
