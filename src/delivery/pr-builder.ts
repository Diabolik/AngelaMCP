import { WorkspaceConfig } from "../config/workspace-config-loader.js";

export interface PrDraft extends Record<string, unknown> {
  title: string;
  description: string;
}

export interface PrSources {
  taskNotesContent?: string | undefined;
  sherlockContent?: string | undefined;
}

export class PrBuilder {
  public build(
    config: WorkspaceConfig,
    ticket: string,
    summary: string,
    sources: PrSources
  ): PrDraft {
    const policy = config.defaults.pr_policy;
    const title = policy.title_format
      .replace("{ticket}", ticket)
      .replace("{summary}", summary);

    const sections: string[] = [`# ${title}`];

    // Required sections
    sections.push("## Summary\n[Summarize the change and its intent]");
    sections.push("## Problem\n[Describe the problem or motivation]");
    sections.push("## Solution\n[Describe the solution applied]");

    // Optional sections based on available sources
    const hasSherlockAnalysis =
      sources.sherlockContent !== undefined && sources.sherlockContent.trim().length > 0;

    if (hasSherlockAnalysis && policy.optional_sections.includes("Root cause")) {
      sections.push("## Root cause\n[Describe the root cause if identified]");
    }

    if (policy.optional_sections.includes("Changes Made")) {
      sections.push("## Changes Made\n- [List significant changes]");
    }

    // Testing section only when manual testing was performed (per policy)
    // Left as placeholder — model decides whether to include based on evidence
    // (policy.rules.testing_only_when_manual)

    const description = sections.join("\n\n");

    return { title, description };
  }
}
