import { randomUUID } from "node:crypto";
import { WorkspaceConfigLoader } from "../config/workspace-config-loader.js";
import {
  StandardToolResponse,
  ToolArgumentsByName,
  ToolDefinition,
  ToolExecutionContext,
  ToolName
} from "../models/tool-contracts.js";
import { Logger } from "../utils/logger.js";

export class ToolOrchestrator {
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

      return this.dispatch(definition, argumentsForTool, context, workspaceConfig.workspace.tasks_root);
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
    tasksRoot: string
  ): Promise<StandardToolResponse> {
    const baseData = {
      request_id: context.requestId,
      tool: definition.name,
      load_profile: definition.loadProfile,
      modules_involved: definition.modulesInvolved,
      write_access: definition.writeAccess
    };

    switch (definition.name) {
      case "bootstrap_task": {
        const typedArgs = args as ToolArgumentsByName["bootstrap_task"];
        const taskWorkspace = `${tasksRoot}/${typedArgs.ticket}`;
        return {
          status: "partial",
          data: {
            ...baseData,
            project: typedArgs.project,
            ticket: typedArgs.ticket,
            mode: "new",
            task_workspace: taskWorkspace,
            task_notes_file: `${taskWorkspace}/task-notes.md`,
            branch: {
              name: `feature/${typedArgs.ticket}`,
              created: false,
              collision_detected: false
            },
            ready: false
          },
          warnings: [
            "Scaffold response only. Workspace creation and branch operations are not implemented yet."
          ],
          errors: []
        };
      }
      case "resume_task": {
        const typedArgs = args as ToolArgumentsByName["resume_task"];
        return {
          status: "partial",
          data: {
            ...baseData,
            project: typedArgs.project,
            ticket: typedArgs.ticket,
            mode: "resume",
            task_workspace: `${tasksRoot}/${typedArgs.ticket}`,
            ready: false
          },
          warnings: ["Scaffold response only. Resume flow is not implemented yet."],
          errors: []
        };
      }
      case "start_exploration": {
        const typedArgs = args as ToolArgumentsByName["start_exploration"];
        return {
          status: "partial",
          data: {
            ...baseData,
            project: typedArgs.project,
            topic: typedArgs.topic ?? typedArgs.question ?? null,
            mode: "exploration"
          },
          warnings: ["Scaffold response only. Exploration flow is not implemented yet."],
          errors: []
        };
      }
      case "read_project_context":
      case "read_task_notes":
      case "update_task_notes":
      case "run_sherlock_analysis":
      case "suggest_lesson_candidates":
      case "draft_commit_message":
      case "draft_pr_description":
      case "run_code_review":
      case "task_closure":
        return {
          status: "partial",
          data: {
            ...baseData,
            arguments: args
          },
          warnings: [`${definition.name} is registered, validated, and routed, but its domain module is not implemented yet.`],
          errors: []
        };
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
