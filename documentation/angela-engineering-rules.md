# Angela Engineering Rules

_Last updated: 2026-03-23_

## Scope

These rules apply by default across Angela's professional workflow unless a project defines an explicit override.

This document is IA-first and human-readable only as a secondary concern.
It defines stable engineering rules.
It does not replace:
- project contexts
- Sherlock analysis documents
- task notes
- workspace configuration

## Source of Truth

If rules conflict, use this order:

1. `angela-workspace.yaml`
2. project-specific context and project-specific lessons
3. legacy or historical documents

## Core Principles

- Prefer evidence over assumption.
- Do not mark work complete without validation.
- Look for existing patterns before adding new logic.
- Keep outputs concise but complete.
- Preserve clarity over noise.
- Separate confirmed behavior from inference.
- Do not duplicate logic without reason.
- Respect SOLID and maintainable design.

## Delivery Rules

### Branch Naming

Use:

`feature/{ticket}`

If the branch already exists, append an incrementing suffix:

`feature/{ticket}_1`

`feature/{ticket}_2`

### Commit Messages

Format:

`[{ticket}] {summary}`

Rules:
- English only
- title required
- body required
- `Changes` required
- add `Problem` for large or complex changes

### MR / PR

Title format:

`[{ticket}] {summary}`

Required sections:
- Summary
- Problem
- Solution

Optional sections:
- Root cause
- Changes Made
- Testing
- Evidence

Rules:
- omit empty sections
- `Testing` only when manual testing was performed
- `Evidence` only when actual evidence exists

## Task Workspace

Task workspace path:

`{tasks_root}/{ticket}/`

Rules:
- folder name must be the exact ticket
- `task-notes.md` is the single living task document
- `sherlock-analysis.md` is optional and complements `task-notes.md`
- use natural order
- append new entries at the end of the corresponding section
- use `LocalTimeZone`
- timestamp format: `YYYY-MM-DD HH:mm`
- avoid noisy operational dumping; keep notes useful and reusable

## Task Notes

Only include sections with real content.

Section order:
1. Research Summary
2. Hypotheses
3. Findings
4. Decisions
5. Blockers
6. Next Steps
7. Local Test Evidence

`Blockers` should include:
- cause
- impact
- what is missing
- open questions when needed

## Sherlock

Sherlock behavior is defined in `sherlock-v3.md`.

Global rules:
- use Sherlock only when explicitly requested or when the agent determines it is necessary
- do not force deep analysis for simple problems
- `Open Questions` is optional and condition-based
- `Lesson Candidates` is optional and condition-based

## Lessons

Lessons workflow is defined in `lessons-system.md`.

Global rules:
- lessons are reusable knowledge, not raw task findings
- lesson candidates may be proposed from task work, Sherlock, code review, or direct user request
- Angela suggests; user confirms
- avoid duplicates
- update existing lessons when reinforced
- obsolete lessons become `deprecated`
