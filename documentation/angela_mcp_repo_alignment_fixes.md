# Angela MCP — Repo Alignment Fixes

_Last updated: 2026-03-24_

## Purpose

This document is a targeted implementation handoff for the next conversation.

The repository already has a strong TypeScript scaffold and is going in the right direction.  
The goal now is **not** to redesign the system, but to apply a focused set of alignment fixes so the repo matches the previously agreed architecture and operating rules.

This document tells the next conversation exactly:
- what is already good
- what must be adjusted
- which files should change
- what the expected result should be

---

## Overall Status

The repo is in a **good state**:
- TypeScript stack is correct
- MCP SDK is already wired
- server bootstrap exists
- tool registry exists
- tool orchestrator exists
- workspace config loader is already strong
- Zod schemas are already in place

The repo is **not broken**.

The main issue is **alignment**:
some contracts, load profiles, and tool argument shapes drifted away from the decisions already made during design.

So the next conversation should focus on:
1. aligning contracts
2. aligning load profiles
3. keeping the system lean by default
4. preserving the current scaffold structure

Do **not** inflate the repo with extra files or redesign the architecture.

---

## What Is Already Good

### `package.json`
Keep it.  
The stack is correct:
- TypeScript
- Node.js
- Zod
- `@modelcontextprotocol/sdk`

No redesign needed.

### `src/index.ts`
Keep the current startup direction:
- stdio transport
- config path resolution
- logger
- server bootstrap

Only minimal adjustments if needed.

### `src/server/mcp-server.ts`
Keep the current structure:
- create MCP server
- register tools from registry
- dispatch through orchestrator

This is correct.

### `src/config/workspace-config-loader.ts`
This file is already one of the strongest parts of the repo.
Keep the current direction:
- YAML parsing
- Zod validation
- strong config model

Only refine if required by contract alignment.

---

## Main Problems To Fix

## 1. Tool contracts drifted from the agreed design

The biggest file to align is:

- `src/models/tool-contracts.ts`

Several tool argument shapes do not match the agreed behavior.

### Expected public tools
These remain the official tools:

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

Do not add or remove tools right now.

---

## 2. Load profiles are heavier than intended

The system goal is:

- **lean by default**
- **deep only when needed**
- **quality gates later in the flow**

So bootstrap/resume/exploration should not preload heavy rules/lessons by default.

This affects:

- `src/server/tool-registry.ts`

---

## 3. Tool orchestration is structurally correct but still too generic
This is acceptable for now.

Do not redesign the orchestrator.
Only keep it aligned with:
- request validation
- registry metadata
- load profile strategy
- future domain module dispatch

---

# File-by-File Changes Required

## 1. `src/models/tool-contracts.ts`

This file must be aligned to the agreed contracts.

### Keep
- `ToolNameSchema`
- `StandardToolResponseSchema`
- overall Zod-based approach

### Change required

#### `bootstrap_task`
Keep:
```ts
{
  project: string,
  ticket: string
}
```

#### `resume_task`
Keep:
```ts
{
  project: string,
  ticket: string
}
```

#### `start_exploration`
Keep:
```ts
{
  project: string,
  topic?: string
}
```

Do **not** require both `topic` and `question`.
Use only one optional exploration input for now:
- `topic?`

Keep it simple.

#### `read_project_context`
Current drift: it uses `mode`.
Expected contract:
```ts
{
  project: string,
  section?: string
}
```

Do not use `mode` as the primary contract here.

#### `read_task_notes`
Current drift: it requires `project`.
Expected contract:
```ts
{
  ticket: string,
  section?: string
}
```

Keep it lighter.
This tool is for reading the task living document.

#### `update_task_notes`
Expected contract:
```ts
{
  ticket: string,
  section?: "research_summary" | "hypotheses" | "findings" | "decisions" | "blockers" | "next_steps" | "local_test_evidence" | "lesson_candidates",
  content: unknown
}
```

Do not force `project`.
Task notes are task-scoped.

#### `run_sherlock_analysis`
Current drift: it uses `investigation_goal` and requires `ticket`.
Expected contract:
```ts
{
  project: string,
  ticket?: string,
  reason: string,
  sherlock_version?: string
}
```

Important:
- if `sherlock_version` is missing, the default version must be used
- `ticket` may remain optional to support exploration-like analysis later

#### `suggest_lesson_candidates`
Current drift: it only takes `project` + `ticket`
Expected contract:
```ts
{
  project: string,
  ticket: string,
  sources: ("task_notes" | "sherlock")[]
}
```

This matters because we explicitly agreed that candidate extraction should be source-aware.

#### `draft_commit_message`
Current drift: it requires `project`
Expected contract:
```ts
{
  ticket: string,
  summary: string,
  size?: "normal" | "large"
}
```

Keep it light.

#### `draft_pr_description`
Expected contract:
```ts
{
  project: string,
  ticket: string,
  sources: ("task_notes" | "sherlock")[]
}
```

Do not require `summary` here as the primary driver if source-based generation is the intent.

#### `run_code_review`
Keep:
```ts
{
  project: string,
  ticket: string,
  review_scope?: "pre_pr" | "pre_merge"
}
```

This is fine.

#### `task_closure`
Keep:
```ts
{
  project: string,
  ticket: string
}
```

---

## 2. `src/server/tool-registry.ts`

This file is structurally good, but the load profiles need to be aligned.

### Keep
- current registry pattern
- definitions per tool
- metadata style
- modules involved concept

### Change required

#### `bootstrap_task`
Expected load profile:
- `light_bootstrap`

Correct behavior:
- minimal global resources
- project context
- create workspace
- create branch
- **no full lessons by default**

#### `resume_task`
Expected load profile:
- `heavy_resume`

But remember:
- heavy here means project + task rehydration
- **not** full lessons by default

#### `start_exploration`
Expected load profile:
- `exploration`

Correct behavior:
- minimal global resources
- project context
- no branch
- no workspace
- no lessons by default

#### `read_project_context`
Do **not** use `light_bootstrap`
Use a dedicated medium profile:
- `medium`

#### `read_task_notes`
Do **not** use `heavy_resume`
Use:
- `medium`

#### `update_task_notes`
Do **not** use `heavy_resume`
Use:
- `light`

#### `run_sherlock_analysis`
Use:
- `heavy_analysis`

Correct:
- deeper context
- relevant lessons
- optional version override
- default Sherlock when version not provided

#### `suggest_lesson_candidates`
Use:
- `medium`

It must compare against lessons, but should not be treated as full heavy analysis by default.

#### `draft_commit_message`
Do **not** use `heavy_resume`
Use:
- `light`

#### `draft_pr_description`
Use:
- `medium`

#### `run_code_review`
Keep:
- `quality_gate`

This is one of the most important decisions.
This tool exists specifically to delay heavy quality/rules loading until later.

#### `task_closure`
Keep:
- `closure`

---

## 3. `src/server/tool-orchestrator.ts`

This file is on the right path.

### Keep
- request parsing
- config loading
- registry-driven execution
- normalized response shape

### Change required
Only adjust it enough so that:
- it respects the corrected tool contracts
- it respects the corrected load profiles
- it does not imply that lessons are loaded early by default

Do **not** redesign the orchestrator.

Do **not** move business logic here.

The orchestrator should remain:
- predictable
- strict
- routing-focused

---

## 4. `src/index.ts`

This file is fine.

Only verify:
- `DEFAULT_SHERLOCK_VERSION` is still supported through env/config
- startup remains lean
- no extra bootstrap logic is added here

Do not inflate startup.

---

## 5. `src/config/workspace-config-loader.ts`

This file is already strong.

### Keep
- strong Zod schemas
- `load`
- `loadProject`

### Only verify
That the loader still supports:
- `tasks_root`
- `global_resources`
- `global_lessons_file`
- per-project `project_lessons_file`

Do not reduce the schema unless necessary.

---

# Target Load Philosophy

This must stay true after the fixes.

## `bootstrap_task`
Load:
- minimal global resources
- project context

Do not load:
- full lessons
- heavy quality rules

## `resume_task`
Load:
- minimal global resources
- project context
- `task-notes.md`
- `sherlock-analysis.md` if present

Do not load:
- full lessons by default

## `start_exploration`
Load:
- minimal global resources
- project context

Do not load:
- lessons by default
- workspace
- branch

## `run_sherlock_analysis`
Load:
- deeper context
- relevant lessons

## `run_code_review`
Load:
- engineering rules
- relevant lessons
- quality context

This is the late quality gate.

## `task_closure`
Load:
- notes
- Sherlock
- lesson candidates
- relevant lessons only when needed for closeout decisions

---

# Important Behavioral Rules To Preserve

## Sherlock
- if `sherlock_version` is omitted, use the default version
- do not force explicit version on normal usage

## Exploration
- remains a separate command
- no branch
- no workspace

## Lessons
- not frequent noise
- no auto-promotion
- only suggested when reusable value exists

## Code Review
- late quality gate
- do not preload heavy rules/lessons at bootstrap just because code review exists

## Tasks
- remain outside repo
- never move them into repo structure

---

# Implementation Priority After These Fixes

Do these first:

1. fix `src/models/tool-contracts.ts`
2. fix load profiles in `src/server/tool-registry.ts`
3. minimally align `src/server/tool-orchestrator.ts`

Only after that continue with:
4. `context-loader`
5. `workspace-manager`
6. `task-notes-manager`

Do not jump into deeper domain implementation before contracts and profiles are aligned.

---

# Expected Result After This Adjustment Pass

After the next conversation applies these changes, the repo should have:

- the correct tool contracts
- the correct lean/deep load strategy
- the correct late quality gate behavior
- no unnecessary redesign
- no extra files
- no inflated architecture

This is an **alignment pass**, not a reinvention pass.

---

# Suggested Prompt For The Next Conversation

Use this exact prompt:

---

We already have a strong AngelaMCP TypeScript scaffold in the repo, and now we need an alignment pass.

Do **not** redesign the architecture.
Do **not** add extra files unless absolutely necessary.

Please apply the fixes from the attached document `Angela MCP — Repo Alignment Fixes`.

Main goals:
1. align `src/models/tool-contracts.ts` with the agreed tool contracts
2. align load profiles in `src/server/tool-registry.ts`
3. keep `tool-orchestrator.ts` routing-focused and lean
4. preserve the late quality-gate role of `run_code_review`
5. preserve the rule that bootstrap/resume/exploration do not load full lessons by default

After applying those fixes, summarize:
- what changed
- what remains correct
- what should be implemented next

---

## Final Note

The repo is already going in the right direction.
This pass is meant to reduce drift and protect the design philosophy:
- lean by default
- deep only when needed
- quality at the right moment
