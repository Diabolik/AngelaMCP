# Angela MCP — Technical Spec

_Last updated: 2026-03-24_

## Purpose

This file consolidates the technical decisions that were defined during the design phase but were not all captured in the core documents.

It includes:
- tool list
- tool intent
- JSON contracts
- internal modules
- task notes content shapes
- lessons shapes
- orchestration rules
- context loading rules

This file is implementation-facing.

---

## Core Operating Principles

- IA-first
- avoid unnecessary redundancy
- default = lean
- deep only when needed
- quality gates at the right moment
- read freely
- write carefully
- promote only with confirmation
- load context selectively

---

## Public Tools v1

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

### Notes
- `start_exploration` is its own command
- `run_sherlock_analysis` uses the default Sherlock version unless explicitly overridden
- GitLab integration is out of scope for now
- `run_code_review` is the late quality gate so heavy rules/lessons are not always loaded at task start

---

## Standard Tool Request Shape

```json
{
  "tool": "tool_name",
  "arguments": {
    "...": "..."
  }
}
```

## Standard Tool Response Shape

```json
{
  "status": "success",
  "data": {},
  "warnings": [],
  "errors": []
}
```

### `status`
- `success`
- `partial`
- `error`

---

## Tool Contracts

### 1. `bootstrap_task`

#### Request
```json
{
  "tool": "bootstrap_task",
  "arguments": {
    "project": "xfactor-surveys",
    "ticket": "POT-2661"
  }
}
```

#### Response
```json
{
  "status": "success",
  "data": {
    "project": "xfactor-surveys",
    "ticket": "POT-2661",
    "mode": "new",
    "documents_read": [
      "angela-context.md",
      "angela-engineering-rules.md",
      "xfactor-surveys-project-context.md"
    ],
    "task_workspace": "/tasks/POT-2661/",
    "task_notes_file": "/tasks/POT-2661/task-notes.md",
    "branch": {
      "name": "feature/POT-2661",
      "created": true,
      "collision_detected": false
    },
    "ready": true
  },
  "warnings": [],
  "errors": []
}
```

#### Behavior
- create branch automatically
- create `/tasks/{ticket}/`
- do not load full lessons by default

---

### 2. `resume_task`

#### Request
```json
{
  "tool": "resume_task",
  "arguments": {
    "project": "xfactor-surveys",
    "ticket": "POT-2661"
  }
}
```

#### Response
```json
{
  "status": "success",
  "data": {
    "project": "xfactor-surveys",
    "ticket": "POT-2661",
    "documents_read": [
      "angela-context.md",
      "angela-engineering-rules.md",
      "xfactor-surveys-project-context.md",
      "task-notes.md",
      "sherlock-analysis.md"
    ],
    "task_workspace": "/tasks/POT-2661/",
    "branch": {
      "name": "feature/POT-2661",
      "exists": true
    },
    "task_notes_summary": {
      "highlights": [],
      "blockers_present": false,
      "next_steps_present": false,
      "sherlock_present": false
    },
    "ready": true
  },
  "warnings": [],
  "errors": []
}
```

#### Behavior
- rehydrate from project + task context
- do not load full lessons by default

---

### 3. `start_exploration`

#### Request
```json
{
  "tool": "start_exploration",
  "arguments": {
    "project": "xfactor-atc",
    "topic": "investigate journey hierarchy behavior"
  }
}
```

#### Response
```json
{
  "status": "success",
  "data": {
    "project": "xfactor-atc",
    "topic": "investigate journey hierarchy behavior",
    "documents_read": [
      "angela-context.md",
      "angela-engineering-rules.md",
      "xfactor-atc-project-context.md"
    ],
    "branch_created": false,
    "workspace_created": false,
    "ready": true
  },
  "warnings": [],
  "errors": []
}
```

#### Behavior
- no branch
- no workspace
- no lessons by default

---

### 4. `read_project_context`

#### Request
```json
{
  "tool": "read_project_context",
  "arguments": {
    "project": "xfactor-surveys",
    "section": "architecture"
  }
}
```

#### Response
```json
{
  "status": "success",
  "data": {
    "project": "xfactor-surveys",
    "section": "architecture",
    "documents_read": [
      "xfactor-surveys-project-context.md"
    ],
    "summary": "..."
  },
  "warnings": [],
  "errors": []
}
```

---

### 5. `read_task_notes`

#### Request
```json
{
  "tool": "read_task_notes",
  "arguments": {
    "ticket": "POT-2661",
    "section": "findings"
  }
}
```

#### Response
```json
{
  "status": "success",
  "data": {
    "ticket": "POT-2661",
    "section": "findings",
    "summary": [],
    "sections_present": []
  },
  "warnings": [],
  "errors": []
}
```

---

### 6. `update_task_notes`

#### Request
```json
{
  "tool": "update_task_notes",
  "arguments": {
    "ticket": "POT-2661",
    "section": "findings",
    "content": {
      "findings": [
        "ResultCode is available in extract properties before Databricks sync completes."
      ]
    }
  }
}
```

#### Response
```json
{
  "status": "success",
  "data": {
    "ticket": "POT-2661",
    "section": "findings",
    "timestamp_applied": "2026-03-24 10:45",
    "file_updated": "/tasks/POT-2661/task-notes.md",
    "section_created": false
  },
  "warnings": [],
  "errors": []
}
```

#### Behavior
- create section if needed
- append at end of section
- apply `LocalTimeZone`
- apply `YYYY-MM-DD HH:mm`

---

### 7. `run_sherlock_analysis`

#### Request (default version)
```json
{
  "tool": "run_sherlock_analysis",
  "arguments": {
    "project": "xfactor-surveys",
    "ticket": "POT-2661",
    "reason": "Root cause is still ambiguous"
  }
}
```

#### Request (explicit version)
```json
{
  "tool": "run_sherlock_analysis",
  "arguments": {
    "project": "xfactor-surveys",
    "ticket": "POT-2661",
    "reason": "Need to compare behavior",
    "sherlock_version": "v3-experimental"
  }
}
```

#### Response
```json
{
  "status": "success",
  "data": {
    "project": "xfactor-surveys",
    "ticket": "POT-2661",
    "sherlock_version_used": "v3",
    "output_file": "/tasks/POT-2661/sherlock-analysis.md",
    "final_confidence": 0.87,
    "open_questions_present": true,
    "lesson_candidates_present": true,
    "workspace_created": false
  },
  "warnings": [],
  "errors": []
}
```

#### Behavior
- if `sherlock_version` missing, use default
- may create task folder if needed
- loads relevant lessons

---

### 8. `suggest_lesson_candidates`

#### Request
```json
{
  "tool": "suggest_lesson_candidates",
  "arguments": {
    "project": "xfactor-surveys",
    "ticket": "POT-2661",
    "sources": [
      "task_notes",
      "sherlock"
    ]
  }
}
```

#### Response
```json
{
  "status": "success",
  "data": {
    "project": "xfactor-surveys",
    "ticket": "POT-2661",
    "candidates": [
      {
        "candidate_id": "candidate-1",
        "title": "...",
        "lesson": "...",
        "reason": "...",
        "suggested_scope": "global",
        "suggested_tags": [
          "analysis"
        ],
        "classification": "new",
        "action_recommended": "create",
        "status": "candidate"
      }
    ]
  },
  "warnings": [],
  "errors": []
}
```

---

### 9. `draft_commit_message`

#### Request
```json
{
  "tool": "draft_commit_message",
  "arguments": {
    "ticket": "POT-2661",
    "summary": "Use extract ResultCode for patient survey delay calculation",
    "size": "large"
  }
}
```

#### Response
```json
{
  "status": "success",
  "data": {
    "subject": "[POT-2661] Use extract ResultCode for patient survey delay calculation",
    "body": "Problem:\n...\n\nChanges:\n- ...\n- ..."
  },
  "warnings": [],
  "errors": []
}
```

---

### 10. `draft_pr_description`

#### Request
```json
{
  "tool": "draft_pr_description",
  "arguments": {
    "project": "xfactor-surveys",
    "ticket": "POT-2661",
    "sources": [
      "task_notes",
      "sherlock"
    ]
  }
}
```

#### Response
```json
{
  "status": "success",
  "data": {
    "title": "[POT-2661] Use extract ResultCode for patient survey delay calculation",
    "description": "# [POT-2661] ...\n\n## Summary\n...\n\n## Problem\n...\n\n## Solution\n...\n\n## Testing\n..."
  },
  "warnings": [],
  "errors": []
}
```

#### Behavior
- include `Testing` only when local testing exists
- do not include `Evidence`

---

### 11. `run_code_review`

#### Request
```json
{
  "tool": "run_code_review",
  "arguments": {
    "project": "xfactor-surveys",
    "ticket": "POT-2661",
    "review_scope": "pre_pr"
  }
}
```

#### Response
```json
{
  "status": "success",
  "data": {
    "project": "xfactor-surveys",
    "ticket": "POT-2661",
    "review_scope": "pre_pr",
    "summary": "Code review completed with 1 major issue and 2 minor improvements.",
    "findings": {
      "critical": [],
      "major": [
        "..."
      ],
      "minor": [
        "...",
        "..."
      ]
    },
    "ready_for_pr": false
  },
  "warnings": [],
  "errors": []
}
```

#### Behavior
- this is the quality gate
- loads engineering rules + relevant lessons later in the flow

---

### 12. `task_closure`

#### Request
```json
{
  "tool": "task_closure",
  "arguments": {
    "project": "xfactor-surveys",
    "ticket": "POT-2661"
  }
}
```

#### Response
```json
{
  "status": "success",
  "data": {
    "project": "xfactor-surveys",
    "ticket": "POT-2661",
    "task_workspace": "/tasks/POT-2661/",
    "notes_reviewed": true,
    "sherlock_reviewed": true,
    "lesson_candidates_reviewed": true,
    "promotions_pending": 1,
    "closure_ready": true
  },
  "warnings": [],
  "errors": []
}
```

#### Behavior
- official close of task
- review notes
- review Sherlock
- review lesson candidates
- prepare final closure state

---

## Internal Modules

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

## `context_loader`

### Purpose
Load the correct context, in the correct amount, for the correct tool.

### Load philosophy
- start lean
- load deep only when needed
- never load all projects
- never load all heavy context by default

### Profiles

#### `light_bootstrap`
- minimal global resources
- project context
- no full lessons

#### `heavy_resume`
- minimal global resources
- project context
- task notes
- Sherlock if exists
- no full lessons by default

#### `exploration`
- minimal global resources
- project context
- no branch
- no workspace
- no lessons by default

#### `heavy_analysis`
- relevant global resources
- project context
- task notes
- Sherlock if exists
- relevant lessons

#### `quality_gate`
- engineering rules
- project context
- task notes
- Sherlock if exists
- relevant lessons

#### `closure`
- task notes
- Sherlock if exists
- lesson candidates
- relevant lessons only if needed

---

## `tool_orchestrator`

### Purpose
- validate request
- resolve tool plan
- call selective context loading
- dispatch to module
- normalize response

### Core steps
1. `validate_request`
2. `resolve_tool_plan`
3. load config
4. load selective context
5. call domain module
6. normalize response

### Registry metadata per tool
- required arguments
- optional arguments
- load profile
- modules involved
- write permissions

---

## `task_notes_manager`

### File
`/tasks/{ticket}/task-notes.md`

### Rules
- single living task document
- natural order
- append entries at end of corresponding section
- `LocalTimeZone`
- `YYYY-MM-DD HH:mm`
- dynamic sections only

### Section order
1. Research Summary
2. Hypotheses
3. Findings
4. Decisions
5. Blockers
6. Next Steps
7. Local Test Evidence

### Internal functions
- `ensure_task_notes_exists(ticket)`
- `read_notes(ticket, section?)`
- `summarize_notes(ticket, section?)`
- `get_sections_present(ticket)`
- `ensure_section_exists(ticket, section)`
- `append_note_entry(ticket, section, content)`

---

## Task Notes Content Shapes

### `research_summary`
```json
{
  "summary": [
    "..."
  ]
}
```

### `hypotheses`
```json
{
  "hypotheses": [
    {
      "statement": "...",
      "status": "open|supported|discarded"
    }
  ]
}
```

### `findings`
```json
{
  "findings": [
    "..."
  ]
}
```

### `decisions`
```json
{
  "decisions": [
    {
      "decision": "...",
      "status": "confirmed|tentative"
    }
  ]
}
```

### `blockers`
```json
{
  "blockers": [
    {
      "cause": "...",
      "impact": "...",
      "missing_information_or_dependency": "...",
      "open_questions": [
        "..."
      ]
    }
  ]
}
```

### `next_steps`
```json
{
  "next_steps": [
    "..."
  ]
}
```

### `local_test_evidence`
```json
{
  "local_test_evidence": [
    {
      "test": "...",
      "observed_result": "..."
    }
  ]
}
```

### `lesson_candidates`
```json
{
  "lesson_candidates": [
    {
      "title": "...",
      "lesson": "...",
      "suggested_scope": "global|project",
      "status": "candidate"
    }
  ]
}
```

---

## `lessons_manager`

### Purpose
- load official lessons
- extract candidates
- compare candidates
- classify candidates
- suggest scope and tags
- update existing lessons
- mark deprecated

### Classification
- `new`
- `variation`
- `reinforcement`
- `duplicate`

### Promotion rules
- Angela may suggest
- user confirms
- no auto-promotion

### Lessons are few and valuable
The system must not force frequent lesson creation.

---

## Lesson Shapes

### `lesson_candidate`
```json
{
  "candidate_id": "candidate-1",
  "title": "...",
  "lesson": "...",
  "reason": "...",
  "suggested_scope": "global|project",
  "suggested_tags": [
    "analysis"
  ],
  "classification": "new|variation|reinforcement|duplicate",
  "action_recommended": "create|update_existing|skip",
  "status": "candidate"
}
```

### `lesson`
```json
{
  "id": "LL-2026-001",
  "timestamp": "2026-03-24 18:10",
  "title": "...",
  "lesson": "...",
  "reason": "...",
  "scope": "global|project",
  "tags": [
    "analysis"
  ],
  "example": "...",
  "project": "xfactor-surveys",
  "source_task": "POT-2661",
  "status": "active|deprecated"
}
```

---

## `delivery_formatter`

### Purpose
Generate:
- commit messages
- PR descriptions

### Commit rules
- format: `[{ticket}] {summary}`
- English
- body required
- `Changes` required
- add `Problem` for large/complex changes

### PR rules
- title format: `[{ticket}] {summary}`
- required:
  - Summary
  - Problem
  - Solution
- optional:
  - Root cause
  - Changes Made
  - Testing
- no Evidence
- omit empty sections

### Internal components
- `commit_builder`
- `pr_builder`
- `source_summarizer`
- `policy_applier`

---

## `run_code_review`

### Intent
Late quality gate.

### Why it exists
To load:
- engineering rules
- relevant lessons
- good practices
at the right moment instead of always at task start.

---

## Repository Structure

Keep the agreed repo structure exactly as defined in the handoff and core design.

### Important
`tasks/` live outside the repo.

---

## Implementation Order

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

Do not redesign the system during implementation.
