# Angela MCP

Angela MCP is the Model Context Protocol server that orchestrates Angela’s workspace workflows, from context loading to analytics bundles, lesson management, and delivery formatting.

## Key capabilities

- **MCP server and tool registration** – `src/index.ts` boots a `@modelcontextprotocol/sdk` `McpServer`, loads workspace configuration, and registers a dozen tools through `src/server/mcp-server.ts` with shared Zod schemas.
- **Context-aware orchestration** – `src/server/tool-orchestrator.ts` centralizes tool execution, invoking context loaders, workspace/branch managers, notes, Sherlock, lessons, delivery, and review helpers while returning typed `StandardToolResponse` payloads.
- **Config-driven context loading** – `config/angela-workspace.yaml` defines global resources, lesson files, task workspace defaults, branch/commit/PR policies, and load profiles that `ContextLoader`, `load-profiles.ts`, and `source-resolver.ts` interpret for every tool.
- **Artifact managers** – Task notes (`src/notes/task-notes-manager.ts`), Sherlock writers, lesson extraction/promotion, delivery formatting, and commit/PR builders encapsulate the workspace artifacts that tools consume or produce.
- **Tool catalog** – `src/server/tool-registry.ts` exposes tool metadata, Zod schemas from `src/models/tool-contracts.ts`, and load profiles for bootstrap, exploration, Sherlock analysis, review, closure, and delivery flows.

## Project structure

- `src/config` – YAML loader and typed config definitions.
- `src/context` – Load profiles and source resolver that decide which files to read per tool.
- `src/server` – Tool orchestrator, MCP server wiring, tool registry, and transport plumbing.
- `src/lessons`, `src/sherlock`, `src/review`, `src/notes`, `src/delivery`, `src/workspace` – Domain-specific managers for lessons, Sherlock analysis, code review, task notes, delivery drafts, workspaces, and branches.
- `config/defaults` – Default MCP runtime settings and bootstrapping directives.

## How to run

1. Populate `config/angela-workspace.yaml` with paths accessible from the host machine.
2. `npm install` to gather dependencies.
3. `npm run dev` starts the MCP server via `tsx`/`stdio`; use `npm run build` before `npm run start` in production.
4. Drive workflows through MCP tools (`bootstrap_task`, `run_sherlock_analysis`, `suggest_lesson_candidates`, `draft_pr_description`, etc.) from a compatible client.

## Testing

`npm run check` validates TypeScript typing across the server and shared modules.
