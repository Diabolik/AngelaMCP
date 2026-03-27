import { randomUUID } from "node:crypto";
import path from "node:path";
import { WorkspaceConfigLoader } from "../config/workspace-config-loader.js";
import { readFile } from "../utils/file-io.js";
import { ContextLoader } from "../context/context-loader.js";
import {
  StandardToolResponse,
  ToolArgumentsByName,
  ToolDefinition,
  ToolExecutionContext,
  ToolName
} from "../models/tool-contracts.js";
import { Logger } from "../utils/logger.js";
import { DeliveryFormatter } from "../delivery/delivery-formatter.js";
import { CodeReviewEngine } from "../review/code-review-engine.js";
import { LessonsManager } from "../lessons/lessons-manager.js";
import { TaskNotesManager } from "../notes/task-notes-manager.js";
import { SherlockEngine } from "../sherlock/sherlock-engine.js";
import { BranchManager } from "../workspace/branch-manager.js";
import { WorkspaceManager } from "../workspace/workspace-manager.js";

export class ToolOrchestrator {
  private readonly contextLoader = new ContextLoader();
  private readonly workspaceManager = new WorkspaceManager();
  private readonly branchManager = new BranchManager();
  private readonly taskNotesManager = new TaskNotesManager();
  private readonly sherlockEngine = new SherlockEngine();
  private readonly lessonsManager = new LessonsManager();
  private readonly deliveryFormatter = new DeliveryFormatter();
  private readonly codeReviewEngine = new CodeReviewEngine();

  public constructor(
    private readonly workspaceConfigLoader: WorkspaceConfigLoader,
    private readonly logger: Logger
  ) {}

  public async execute<K extends ToolName>(
    definition: ToolDefinition<K>,
    rawArguments: unknown,
    context: ToolExecutionContext
  ): Promise<StandardToolResponse> {
    try {
      const argumentsForTool = definition.inputSchema.parse(rawArguments) as ToolArgumentsByName[K];
      const workspaceConfig = await this.workspaceConfigLoader.load(context.workspaceConfigPath);

      this.logger.info("Executing tool", {
        requestId: context.requestId,
        tool: definition.name,
        loadProfile: definition.loadProfile
      });

      return this.dispatch(definition, argumentsForTool, context, workspaceConfig);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown execution error.";

      this.logger.error("Tool execution failed", {
        requestId: context.requestId,
        tool: definition.name,
        error: message
      });

      return {
        status: "error",
        data: {},
        warnings: [],
        errors: [message]
      };
    }
  }

  public createExecutionContext(workspaceConfigPath: string): ToolExecutionContext {
    return {
      workspaceConfigPath,
      requestId: randomUUID()
    };
  }

  private async dispatch<K extends ToolName>(
    definition: ToolDefinition<K>,
    args: ToolArgumentsByName[K],
    context: ToolExecutionContext,
    workspaceConfig: Awaited<ReturnType<WorkspaceConfigLoader["load"]>>
  ): Promise<StandardToolResponse> {
    switch (definition.name) {
      case "bootstrap_task": {
        const typedArgs = args as ToolArgumentsByName["bootstrap_task"];

        const [loaded, workspace, branch] = await Promise.all([
          this.contextLoader.load(workspaceConfig, "light_bootstrap", typedArgs.project),
          this.workspaceManager.ensureTaskWorkspace(workspaceConfig, typedArgs.ticket),
          this.branchManager.createBranch(workspaceConfig, typedArgs.ticket)
        ]);

        await this.taskNotesManager.ensureTaskNotesExists(workspaceConfig, typedArgs.ticket);

        this.logger.debug("Bootstrap complete", {
          requestId: context.requestId,
          documentsRead: loaded.documentsRead,
          taskWorkspace: workspace.task_workspace,
          branch: branch.name
        });

        return {
          status: "success",
          data: {
            project: typedArgs.project,
            ticket: typedArgs.ticket,
            mode: "new",
            documents_read: loaded.documentsRead,
            documents: loaded.documents.map((d) => ({ label: d.label, content: d.content })),
            task_workspace: workspace.task_workspace,
            task_notes_file: workspace.task_notes_file,
            branch,
            ready: true
          },
          warnings: [],
          errors: []
        };
      }
      case "resume_task": {
        const typedArgs = args as ToolArgumentsByName["resume_task"];

        const [loaded, branch, notesSummary] = await Promise.all([
          this.contextLoader.load(
            workspaceConfig,
            "heavy_resume",
            typedArgs.project,
            typedArgs.ticket
          ),
          this.branchManager.checkBranch(workspaceConfig, typedArgs.ticket),
          this.taskNotesManager.summarizeNotes(workspaceConfig, typedArgs.ticket)
        ]);

        const paths = this.workspaceManager.resolveTaskWorkspacePaths(
          workspaceConfig,
          typedArgs.ticket
        );

        this.logger.debug("Resume complete", {
          requestId: context.requestId,
          documentsRead: loaded.documentsRead,
          branchExists: branch.exists
        });

        return {
          status: "success",
          data: {
            project: typedArgs.project,
            ticket: typedArgs.ticket,
            documents_read: loaded.documentsRead,
            documents: loaded.documents.map((d) => ({ label: d.label, content: d.content })),
            task_workspace: paths.task_workspace,
            branch,
            task_notes_summary: {
              ...notesSummary,
              sherlock_present: loaded.documentsRead.includes("sherlock-analysis.md")
            },
            ready: true
          },
          warnings: [],
          errors: []
        };
      }
      case "start_exploration": {
        const typedArgs = args as ToolArgumentsByName["start_exploration"];

        const loaded = await this.contextLoader.load(
          workspaceConfig,
          "exploration",
          typedArgs.project
        );

        this.logger.debug("Context loaded", {
          requestId: context.requestId,
          profile: "exploration",
          documentsRead: loaded.documentsRead
        });

        return {
          status: "success",
          data: {
            project: typedArgs.project,
            topic: typedArgs.topic,
            documents_read: loaded.documentsRead,
            documents: loaded.documents.map((d) => ({ label: d.label, content: d.content })),
            branch_created: false,
            workspace_created: false,
            ready: true
          },
          warnings: [],
          errors: []
        };
      }
      case "read_task_notes": {
        const typedArgs = args as ToolArgumentsByName["read_task_notes"];
        const result = await this.taskNotesManager.readNotes(
          workspaceConfig,
          typedArgs.ticket,
          typedArgs.section
        );
        return { status: "success", data: result, warnings: [], errors: [] };
      }
      case "update_task_notes": {
        const typedArgs = args as ToolArgumentsByName["update_task_notes"];
        const result = await this.taskNotesManager.appendNoteEntry(
          workspaceConfig,
          typedArgs.ticket,
          typedArgs.section,
          typedArgs.content
        );
        return { status: "success", data: result, warnings: [], errors: [] };
      }
      case "run_sherlock_analysis": {
        const typedArgs = args as ToolArgumentsByName["run_sherlock_analysis"];

        if (typedArgs.analysis_result === undefined) {
          // Phase 1: load context and return bundle for model to perform analysis
          const bundle = await this.sherlockEngine.prepareBundle(
            workspaceConfig,
            typedArgs.project,
            typedArgs.ticket,
            typedArgs.sherlock_version
          );
          return { status: "success", data: bundle, warnings: [], errors: [] };
        }

        // Phase 2: persist the analysis produced by the model
        const result = await this.sherlockEngine.persistAnalysis(
          workspaceConfig,
          typedArgs.project,
          typedArgs.ticket,
          typedArgs.analysis_result,
          typedArgs.sherlock_version
        );
        return {
          status: "success",
          data: result,
          warnings: result.warnings,
          errors: []
        };
      }
      case "suggest_lesson_candidates": {
        const typedArgs = args as ToolArgumentsByName["suggest_lesson_candidates"];
        const bundle = await this.lessonsManager.prepareSuggestionBundle(
          workspaceConfig,
          typedArgs.project,
          typedArgs.ticket,
          typedArgs.sources
        );
        return { status: "success", data: bundle, warnings: [], errors: [] };
      }
      case "draft_commit_message": {
        const typedArgs = args as ToolArgumentsByName["draft_commit_message"];
        const result = this.deliveryFormatter.draftCommit(
          workspaceConfig,
          typedArgs.ticket,
          typedArgs.summary,
          typedArgs.size
        );
        return { status: "success", data: result, warnings: [], errors: [] };
      }
      case "draft_pr_description": {
        const typedArgs = args as ToolArgumentsByName["draft_pr_description"];
        const result = await this.deliveryFormatter.draftPr(
          workspaceConfig,
          typedArgs.project,
          typedArgs.ticket,
          typedArgs.sources
        );
        return { status: "success", data: result, warnings: [], errors: [] };
      }
      case "run_code_review": {
        const typedArgs = args as ToolArgumentsByName["run_code_review"];
        const bundle = await this.codeReviewEngine.prepareBundle(
          workspaceConfig,
          typedArgs.project,
          typedArgs.ticket,
          typedArgs.review_scope
        );
        return { status: "success", data: bundle, warnings: [], errors: [] };
      }
      case "read_project_context": {
        const typedArgs = args as ToolArgumentsByName["read_project_context"];
        const projectConfig = workspaceConfig.projects[typedArgs.project];

        if (projectConfig === undefined) {
          return {
            status: "error",
            data: {},
            warnings: [],
            errors: [`Project '${typedArgs.project}' not found in workspace config.`]
          };
        }

        const documents: Array<{ label: string; content: string }> = [];
        for (const filePath of projectConfig.context_resources) {
          const content = await readFile(filePath);
          documents.push({ label: path.basename(filePath), content });
        }

        return {
          status: "success",
          data: {
            project: typedArgs.project,
            section: typedArgs.section ?? null,
            documents_read: documents.map((d) => d.label),
            documents
          },
          warnings: [],
          errors: []
        };
      }
      case "task_closure": {
        const typedArgs = args as ToolArgumentsByName["task_closure"];
        const [closureBundle, notesSummary] = await Promise.all([
          this.lessonsManager.prepareClosureBundle(
            workspaceConfig,
            typedArgs.project,
            typedArgs.ticket
          ),
          this.taskNotesManager.summarizeNotes(workspaceConfig, typedArgs.ticket)
        ]);

        const closureReady = closureBundle.notes_reviewed && !notesSummary.blockers_present;
        const warnings: string[] = [];

        if (notesSummary.blockers_present) {
          warnings.push("Task has unresolved blockers. Review before closing.");
        }
        if (closureBundle.promotions_pending > 0) {
          warnings.push(
            `${closureBundle.promotions_pending} lesson candidate(s) pending review for promotion.`
          );
        }

        return {
          status: "success",
          data: { ...closureBundle, closure_ready: closureReady },
          warnings,
          errors: []
        };
      }
      default:
        return {
          status: "error",
          data: {},
          warnings: [],
          errors: [`Unsupported tool: ${String(definition.name)}`]
        };
    }
  }
}
