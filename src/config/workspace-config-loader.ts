import { readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "yaml";
import { z } from "zod";

const BranchCollisionStrategySchema = z.object({
  enabled: z.boolean(),
  separator: z.string().min(1),
  start_at: z.number().int().nonnegative(),
  mode: z.enum(["increment"])
});

const WorkspaceProjectSchema = z.object({
  display_name: z.string().min(1),
  context_resources: z.array(z.string().min(1)).default([]),
  project_lessons_file: z.string().min(1)
});

const BootstrapConfigSchema = z.object({
  load_global_resources: z.boolean(),
  load_global_lessons: z.boolean(),
  load_project_contexts: z.boolean(),
  load_project_lessons: z.boolean()
});

const WorkspaceConfigSchema = z.object({
  version: z.number().int().positive(),
  workspace: z.object({
    name: z.string().min(1),
    maintainers: z.array(z.string().min(1)).default([]),
    tasks_root: z.string().min(1),
    global_resources: z.array(z.string().min(1)).default([]),
    global_lessons_file: z.string().min(1)
  }),
  bootstrap: BootstrapConfigSchema,
  modes: z.object({
    new: z.object({
      create_branch: z.boolean(),
      load_previous_task_context: z.boolean(),
      persist_research: z.boolean()
    }),
    resume: z.object({
      create_branch: z.boolean(),
      load_previous_task_context: z.boolean(),
      persist_research: z.boolean()
    }),
    exploration: z.object({
      create_branch: z.boolean(),
      load_previous_task_context: z.boolean(),
      persist_research: z.boolean()
    })
  }),
  defaults: z.object({
    branch_policy: z.object({
      enabled: z.boolean(),
      pattern: z.string().min(1),
      collision_strategy: BranchCollisionStrategySchema
    }),
    commit_policy: z.object({
      subject_format: z.string().min(1),
      language: z.string().min(1),
      body: z.object({
        required: z.boolean(),
        required_sections: z.array(z.string().min(1)).default([]),
        optional_sections_for_large_changes: z.array(z.string().min(1)).default([])
      })
    }),
    pr_policy: z.object({
      title_format: z.string().min(1),
      language: z.string().min(1),
      required_sections: z.array(z.string().min(1)).default([]),
      optional_sections: z.array(z.string().min(1)).default([]),
      rules: z.object({
        omit_empty_sections: z.boolean(),
        testing_only_when_manual: z.boolean(),
        evidence_only_when_exists: z.boolean()
      })
    }),
    task_workspace: z.object({
      folder_name_pattern: z.string().min(1),
      main_notes_file: z.string().min(1),
      sherlock_file: z.string().min(1),
      use_single_living_notes_document: z.boolean()
    }),
    task_notes: z.object({
      dynamic_sections_only: z.boolean(),
      timestamp_format: z.string().min(1),
      timezone: z.string().min(1),
      append_new_entries_to_existing_section: z.boolean(),
      sections: z.array(z.object({
        key: z.string().min(1),
        title: z.string().min(1)
      })).default([]),
      blocker_fields: z.array(z.string().min(1)).default([])
    }),
    sherlock_v3: z.object({
      explicit_request_or_agent_judgment: z.boolean(),
      output_file: z.string().min(1),
      final_confidence_required: z.boolean(),
      confidence_scale: z.string().min(1),
      reflection_threshold: z.number().positive(),
      open_questions_optional: z.boolean(),
      lesson_candidates_optional: z.boolean()
    }),
    lessons: z.object({
      scopes: z.array(z.string().min(1)).default([]),
      language: z.string().min(1),
      style: z.string().min(1),
      order: z.string().min(1),
      deprecated_instead_of_delete: z.boolean(),
      files: z.object({
        global: z.string().min(1)
      })
    }),
    lesson_candidates: z.object({
      enabled_in_task_notes: z.boolean(),
      enabled_in_sherlock: z.boolean(),
      confirm_on_task_completion: z.boolean(),
      update_existing_when_reinforced: z.boolean()
    })
  }),
  projects: z.record(WorkspaceProjectSchema)
});

export type WorkspaceConfig = z.infer<typeof WorkspaceConfigSchema>;
export type WorkspaceProject = z.infer<typeof WorkspaceProjectSchema>;
export type BootstrapConfig = z.infer<typeof BootstrapConfigSchema>;

export class WorkspaceConfigLoader {
  public async load(configPath: string): Promise<WorkspaceConfig> {
    const absolutePath = path.resolve(configPath);
    const raw = await readFile(absolutePath, "utf8");
    const parsed = parse(raw);

    return WorkspaceConfigSchema.parse(parsed);
  }

  public async loadProject(configPath: string, projectKey: string): Promise<WorkspaceProject> {
    const config = await this.load(configPath);
    const project = config.projects[projectKey];

    if (!project) {
      throw new Error(`Project '${projectKey}' is not defined in workspace config.`);
    }

    return project;
  }
}
