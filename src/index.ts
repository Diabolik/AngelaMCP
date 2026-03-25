import path from "node:path";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { WorkspaceConfigLoader } from "./config/workspace-config-loader.js";
import { createAngelaMcpServer } from "./server/mcp-server.js";
import { ToolOrchestrator } from "./server/tool-orchestrator.js";
import { ToolRegistry } from "./server/tool-registry.js";
import { Logger, LogLevel } from "./utils/logger.js";

function resolveWorkspaceConfigPath(): string {
  return process.env.ANGELA_WORKSPACE_CONFIG
    ? path.resolve(process.env.ANGELA_WORKSPACE_CONFIG)
    : path.resolve(process.cwd(), "config/angela-workspace.yaml");
}

function resolveLogLevel(): LogLevel {
  const value = process.env.LOG_LEVEL;

  if (value === "debug" || value === "info" || value === "warn" || value === "error") {
    return value;
  }

  return "info";
}

async function main(): Promise<void> {
  const logger = new Logger(resolveLogLevel());
  const workspaceConfigPath = resolveWorkspaceConfigPath();
  const workspaceConfigLoader = new WorkspaceConfigLoader();

  await workspaceConfigLoader.load(workspaceConfigPath);

  const server = createAngelaMcpServer({
    toolRegistry: new ToolRegistry(),
    toolOrchestrator: new ToolOrchestrator(workspaceConfigLoader, logger),
    workspaceConfigPath
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info("Angela MCP server started", {
    transport: "stdio",
    workspaceConfigPath
  });
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown startup error.";
  process.stderr.write(`[FATAL] ${message}\n`);
  process.exit(1);
});
