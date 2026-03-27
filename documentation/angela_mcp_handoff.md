# Angela MCP — Development Handoff

_Last updated: 2026-03-24_

## Objective

Continue the implementation phase of **Angela MCP** in a new conversation, using the finalized core documents and the architectural decisions already made.

The goal is to begin **real TypeScript development**, not to redesign the system from scratch.

---

## Official Stack

- **Language:** TypeScript
- **Runtime:** Node.js
- **Validation:** Zod
- **MCP SDK:** `@modelcontextprotocol/sdk`

---

## Core Design Principles

This project is intentionally:
- **IA-first**
- **low-noise**
- **modular**
- **selective with context loading**

Do **not** overload the agent with all context all the time.

Key philosophy:
- **default = lean**
- **deep only when needed**
- **quality gates at the right moment**
- **read freely**
- **write carefully**
- **promote only with confirmation**
- **load context selectively**

---

## Official Core Documents

Use these as the source of truth:

1. `angela-context.md`
2. `angela-engineering-rules.md`
3. `sherlock-v3.md`
4. `lessons-system.md`
5. `angela-workspace.yaml`

These documents were already reviewed and refined.

---

## Official Core Files (this session)

These files were generated in the previous conversation and should be treated as the current official core set:

- `angela-context.md`
- `angela-engineering-rules.md`
- `sherlock-v3.md`
- `lessons-system.md`
- `angela-workspace.yaml`

If the new conversation cannot access prior artifacts directly, re-upload them.

---

## External Task Workspace

`tasks/` must live **outside** the repo.

Example:

`/home/arivera/workspace/IA/tasks/POT-2661/`

Each task folder contains:
- `task-notes.md`
- `sherlock-analysis.md` (only when Sherlock is used)

---

## Official MCP Tools v1

Public tools:

1. `bootstrap_task`
2. `resume_task`
3. `start_exploration`
4. `read_project_context`
5. `read_task_notes`
6. `update_task_notes`
7. `run_sherlock_analysis`
8. `suggest_lesson_candidates`
9. `draft_commit_message`
10. `draft_pr_description`
11. `run_code_review`
12. `task_closure`

### Important behavioral decisions

- `start_exploration` is its **own command**
- `run_sherlock_analysis` uses the **default Sherlock version** unless an explicit version is provided
- GitLab integration was explicitly removed **for now**
- `run_code_review` was added as a **quality gate** so that heavy rules/lessons are loaded later, not always at task start

---

## Context Loading Strategy

The system must **not** load all lessons/rules by default at bootstrap.

### Lean start
`bootstrap_task`
- load minimal global resources
- load project context
- create workspace
- create branch
- do **not** load full lessons by default

`resume_task`
- load minimal global resources
- load project context
- load `task-notes.md`
- load `sherlock-analysis.md` if it exists
- do **not** load full lessons by default

`start_exploration`
- load minimal global resources
- load project context
- no branch
- no workspace
- no lessons by default

### Deep load when needed
`run_sherlock_analysis`
- load deeper context
- load relevant lessons
- create `sherlock-analysis.md`

`run_code_review`
- load engineering rules
- load relevant lessons
- load task notes / Sherlock if needed
- use as final quality review before PR

`task_closure`
- review notes
- review Sherlock
- review lesson candidates
- prepare final closure state

---

## Main Internal Modules Already Designed

1. `tool_orchestrator`
2. `workspace_config_loader`
3. `context_loader`
4. `workspace_manager`
5. `task_notes_manager`
6. `sherlock_engine`
7. `lessons_manager`
8. `delivery_formatter`
9. `code_review_engine`

---

## Module Status at Time of Handoff

### Already conceptually designed
- `tool_orchestrator`
- `context_loader`
- `task_notes_manager`
- `lessons_manager`
- `delivery_formatter`

### Not yet implemented
Everything is still at architecture/design level.
The next conversation should start **implementation scaffolding**.

---

## Key Internal Decisions

### `tool_orchestrator`
- validates requests
- resolves tool plan
- calls selective context loading
- dispatches to the right module
- normalizes response

### `context_loader`
This is one of the most important modules.
It must:
- resolve sources
- apply load profiles
- load only what each tool needs
- support summary vs full content
- never load all projects
- never load all heavy context by default

### `task_notes_manager`
`task-notes.md` is the **single living task document**

Rules:
- natural order
- dynamic sections only
- append new entries at end of section
- timestamps use `LocalTimeZone`
- timestamp format: `YYYY-MM-DD HH:mm`

Official section order:
1. Research Summary
2. Hypotheses
3. Findings
4. Decisions
5. Blockers
6. Next Steps
7. Local Test Evidence

### `lessons_manager`
Lessons are **few and valuable**, not frequent noise.

- valid scopes: `global`, `project`
- candidates may come from task notes, Sherlock, code review, debugging, implementation, or direct user request
- Angela suggests
- user confirms
- obsolete lessons become `deprecated`
- do not auto-promote

Candidate classification:
- `new`
- `variation`
- `reinforcement`
- `duplicate`

### `delivery_formatter`
Generates:
- commit messages
- PR descriptions

Commit rules:
- format: `[{ticket}] {summary}`
- English
- body required
- `Changes` required
- add `Problem` for large/complex changes

PR rules:
- title format: `[{ticket}] {summary}`
- required sections:
  - Summary
  - Problem
  - Solution
- optional:
  - Root cause
  - Changes Made
  - Testing
- **no Evidence**
- omit empty sections

### `run_code_review`
Added later as a quality gate.

Purpose:
- load engineering rules + lessons at the right time
- perform final quality review before PR
- avoid carrying all heavy rules at task bootstrap

---

## Official Repo Structure

Keep this exact structure (do not inflate it unnecessarily):

```text
angela-mcp/
├── README.md
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
├── config/
│   ├── angela-workspace.yaml
│   └── defaults/
│       └── mcp-settings.yaml
├── docs/
│   ├── angela-context.md
│   ├── angela-engineering-rules.md
│   ├── sherlock-v3.md
│   └── lessons-system.md
├── knowledge/
│   ├── global-lessons.md
│   └── projects/
│       ├── xfactor-rc/
│       │   ├── project-context.md
│       │   └── project-lessons.md
│       ├── xfactor-surveys/
│       │   ├── project-context.md
│       │   └── project-lessons.md
│       ├── xfactor-text/
│       │   ├── project-context.md
│       │   └── project-lessons.md
│       └── xfactor-atc/
│           ├── project-context.md
│           └── project-lessons.md
├── src/
│   ├── index.ts
│   ├── server/
│   │   ├── mcp-server.ts
│   │   ├── tool-registry.ts
│   │   └── tool-orchestrator.ts
│   ├── config/
│   │   ├── workspace-config-loader.ts
│   │   └── config-models.ts
│   ├── context/
│   │   ├── context-loader.ts
│   │   ├── source-resolver.ts
│   │   └── load-profiles.ts
│   ├── workspace/
│   │   ├── workspace-manager.ts
│   │   └── branch-manager.ts
│   ├── notes/
│   │   ├── task-notes-manager.ts
│   │   ├── notes-parser.ts
│   │   └── notes-renderer.ts
│   ├── sherlock/
│   │   ├── sherlock-engine.ts
│   │   ├── sherlock-registry.ts
│   │   └── sherlock-document-writer.ts
│   ├── lessons/
│   │   ├── lessons-manager.ts
│   │   ├── lessons-loader.ts
│   │   ├── candidate-extractor.ts
│   │   ├── candidate-comparator.ts
│   │   └── lessons-writer.ts
│   ├── delivery/
│   │   ├── delivery-formatter.ts
│   │   ├── commit-builder.ts
│   │   └── pr-builder.ts
│   ├── tools/
│   │   ├── bootstrap-task.ts
│   │   ├── resume-task.ts
│   │   ├── start-exploration.ts
│   │   ├── read-project-context.ts
│   │   ├── read-task-notes.ts
│   │   ├── update-task-notes.ts
│   │   ├── run-sherlock-analysis.ts
│   │   ├── suggest-lesson-candidates.ts
│   │   ├── draft-commit-message.ts
│   │   ├── draft-pr-description.ts
│   │   ├── run-code-review.ts
│   │   └── task-closure.ts
│   ├── review/
│   │   └── code-review-engine.ts
│   ├── models/
│   │   ├── tool-requests.ts
│   │   ├── tool-responses.ts
│   │   ├── notes-models.ts
│   │   ├── lesson-models.ts
│   │   └── delivery-models.ts
│   └── utils/
│       ├── file-io.ts
│       ├── markdown-utils.ts
│       ├── time-utils.ts
│       └── validation-utils.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
└── scripts/
    ├── bootstrap-dev.ts
    └── validate-config.ts
```

---

## `.env.example`

Use only runtime/environment values here.
Do not move policy into `.env`.

```env
APP_ENV=development
LOG_LEVEL=info

ANGELA_WORKSPACE_CONFIG=/home/arivera/workspace/IA/angela-workspace.yaml
ANGELA_DOCS_ROOT=/home/arivera/workspace/IA/docs
ANGELA_KNOWLEDGE_ROOT=/home/arivera/workspace/IA/knowledge
ANGELA_TASKS_ROOT=/home/arivera/workspace/IA/tasks

DEFAULT_TIMEZONE=LocalTimeZone
DEFAULT_SHERLOCK_VERSION=v3
```

---

## Recommended Immediate Development Order

Start implementation in this order:

1. `package.json`
2. `tsconfig.json`
3. `.env.example`
4. `src/index.ts`
5. `src/server/mcp-server.ts`
6. `src/server/tool-registry.ts`
7. `src/server/tool-orchestrator.ts`
8. `src/config/workspace-config-loader.ts`
9. `src/context/context-loader.ts`
10. `src/workspace/workspace-manager.ts`
11. `src/notes/task-notes-manager.ts`

Do **not** jump into all modules at once.

---

## Next Task for the New Conversation

The next conversation should begin with:

### Goal
Create the real TypeScript scaffold for the repo and implement the first foundational modules:

- `package.json`
- `tsconfig.json`
- `.env.example`
- `src/index.ts`
- `src/server/mcp-server.ts`
- `src/server/tool-registry.ts`
- `src/server/tool-orchestrator.ts`
- `src/config/workspace-config-loader.ts`

### Important instruction
Do not redesign the system again.
Use the existing decisions.
Focus on implementation scaffolding.

---

## Suggested Opening Prompt for the Next Conversation

Use this exact prompt in the new chat:

---

We already completed the design phase for Angela MCP and now we are starting the real TypeScript implementation.

We are **not** redesigning the system. Use the existing decisions and move directly into implementation scaffolding.

### Stack
- TypeScript
- Node.js
- Zod
- `@modelcontextprotocol/sdk`

### Core files already defined
- `angela-context.md`
- `angela-engineering-rules.md`
- `sherlock-v3.md`
- `lessons-system.md`
- `angela-workspace.yaml`

### Important rules
- IA-first
- avoid unnecessary redundancy
- selective context loading
- tasks live outside the repo
- do not overload bootstrap/resume with full lessons by default
- use `run_code_review` as the final quality gate
- Sherlock default version is used unless explicitly overridden

### Repo structure
[PASTE THE REPO STRUCTURE HERE OR RE-UPLOAD THE FILES]

### Immediate implementation goal
Create the real TypeScript scaffold for:
- `package.json`
- `tsconfig.json`
- `.env.example`
- `src/index.ts`
- `src/server/mcp-server.ts`
- `src/server/tool-registry.ts`
- `src/server/tool-orchestrator.ts`
- `src/config/workspace-config-loader.ts`

Please work directly on the scaffold and keep the implementation clean, minimal, and aligned to the architecture we already defined.

---

## Final Note

The previous conversation became slow because of UI lag, not because the design was incomplete.

The design phase is already strong enough.
The next step is implementation.
