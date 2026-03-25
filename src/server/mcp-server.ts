import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ToolRegistry } from "./tool-registry.js";
import { ToolOrchestrator } from "./tool-orchestrator.js";

export interface AngelaMcpServerDependencies {
  toolRegistry: ToolRegistry;
  toolOrchestrator: ToolOrchestrator;
  workspaceConfigPath: string;
}

export function createAngelaMcpServer(
  dependencies: AngelaMcpServerDependencies
): McpServer {
  const server = new McpServer({
    name: "Angela MCP",
    version: "0.1.0"
  });

  for (const definition of dependencies.toolRegistry.getAll()) {
    server.tool(
      definition.name,
      definition.inputSchema.shape,
      async (argumentsForTool) => {
        const context = dependencies.toolOrchestrator.createExecutionContext(
          dependencies.workspaceConfigPath
        );

        const response = await dependencies.toolOrchestrator.execute(
          definition,
          argumentsForTool,
          context
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }
    );
  }

  return server;
}
