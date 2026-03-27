import path from "node:path";
import { WorkspaceConfig } from "../config/workspace-config-loader.js";
import { readFile, readFileIfExists } from "../utils/file-io.js";
import { LoadProfile, PROFILE_DIRECTIVES } from "./load-profiles.js";
import { resolveSourcePlan } from "./source-resolver.js";

export interface LoadedDocument {
  path: string;
  label: string;
  content: string;
}

export interface LoadedContext {
  profile: LoadProfile;
  documentsRead: string[];
  documents: LoadedDocument[];
}

export class ContextLoader {
  // Loads context files according to the tool's load profile.
  //
  // Mandatory files (global resources, project context) throw if missing.
  // Optional files (task notes, sherlock, lessons) are silently skipped.
  public async load(
    config: WorkspaceConfig,
    profile: LoadProfile,
    projectKey?: string,
    ticket?: string
  ): Promise<LoadedContext> {
    const directives = PROFILE_DIRECTIVES[profile];
    const plan = resolveSourcePlan(config, directives, projectKey, ticket);
    const documents: LoadedDocument[] = [];

    for (const filePath of plan.globalResourcePaths) {
      const content = await readFile(filePath);
      documents.push({ path: filePath, label: path.basename(filePath), content });
    }

    for (const filePath of plan.projectContextPaths) {
      const content = await readFile(filePath);
      documents.push({ path: filePath, label: path.basename(filePath), content });
    }

    if (plan.globalLessonsPath !== null) {
      const content = await readFileIfExists(plan.globalLessonsPath);
      if (content !== null) {
        documents.push({
          path: plan.globalLessonsPath,
          label: path.basename(plan.globalLessonsPath),
          content
        });
      }
    }

    if (plan.projectLessonsPath !== null) {
      const content = await readFileIfExists(plan.projectLessonsPath);
      if (content !== null) {
        documents.push({
          path: plan.projectLessonsPath,
          label: path.basename(plan.projectLessonsPath),
          content
        });
      }
    }

    if (plan.taskNotesPath !== null) {
      const content = await readFileIfExists(plan.taskNotesPath);
      if (content !== null) {
        documents.push({
          path: plan.taskNotesPath,
          label: path.basename(plan.taskNotesPath),
          content
        });
      }
    }

    if (plan.sherlockAnalysisPath !== null) {
      const content = await readFileIfExists(plan.sherlockAnalysisPath);
      if (content !== null) {
        documents.push({
          path: plan.sherlockAnalysisPath,
          label: path.basename(plan.sherlockAnalysisPath),
          content
        });
      }
    }

    return {
      profile,
      documentsRead: documents.map((d) => d.label),
      documents
    };
  }
}
