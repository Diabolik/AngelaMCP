# Angela MCP

Angela MCP is the Model Context Protocol server for the Angela workspace.

## Purpose

This repository contains the initial scaffold and implementation for a lean MCP server built with:

- Node.js
- TypeScript
- Zod
- `@modelcontextprotocol/sdk`

The goal is to provide a structured, extensible base for Angela’s workspace-aware orchestration, context loading, lessons handling, Sherlock analysis flows, and delivery formatting.

## Initial Scope

The first version of this repository is intended to include:

- MCP server bootstrap
- Tool registry
- Tool orchestrator
- Workspace configuration loader
- Shared tool contracts
- Minimal logging utilities
- Configuration defaults
- Technical documentation and handoff references

## Status

Repository initialization in progress.

## Notes

- Keep the server lean by default.
- Load context selectively instead of preloading everything.
- Keep `tasks/` outside the repository.
- Treat code review as a later quality gate, not a bootstrap dependency.

## Next Step

After this initial commit, the scaffold files will be uploaded into this repository.
