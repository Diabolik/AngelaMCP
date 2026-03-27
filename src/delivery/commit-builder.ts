import { WorkspaceConfig } from "../config/workspace-config-loader.js";

export interface CommitDraft extends Record<string, unknown> {
  subject: string;
  body: string;
}

export class CommitBuilder {
  public build(
    config: WorkspaceConfig,
    ticket: string,
    summary: string,
    size?: string
  ): CommitDraft {
    const policy = config.defaults.commit_policy;
    const subject = policy.subject_format
      .replace("{ticket}", ticket)
      .replace("{summary}", summary);

    const isLarge = size === "large" || size === "xl";
    const bodySections: string[] = [];

    if (isLarge && policy.body.optional_sections_for_large_changes.includes("Problem")) {
      bodySections.push("Problem:\n[Describe the problem this commit addresses]");
    }

    bodySections.push("Changes:\n- [Describe each change]");

    return {
      subject,
      body: bodySections.join("\n\n")
    };
  }
}
