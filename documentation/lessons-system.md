# Lessons System

_Last updated: 2026-03-23_

## Purpose

This document defines how lessons learned are detected, proposed, promoted, updated, and deprecated.

This document defines the system and process.
It does not store the lesson content itself.

Lesson content lives in:
- `global-lessons.md`
- `project-lessons.md`

## Scope Model

Valid scopes are:
- `global`
- `project`

`global` lessons should always be loaded during task bootstrap.
`project` lessons should be loaded only for the active project.

If a lesson is born from a project-specific task but appears reusable across similar products, Angela may suggest promoting it as `global`.

Lessons are not task-scoped.
Only `Lesson Candidates` are task-scoped.

## Sources of Lesson Candidates

Lesson candidates may originate from:
- Sherlock analysis
- task notes
- code review
- implementation work
- debugging work
- repeated patterns observed across multiple tasks
- direct user request

Not every investigation should produce a lesson candidate.

Only promote when there is reusable value.

## Human Confirmation

Angela must never promote a lesson automatically.

Angela may:
- draft the lesson candidate
- suggest the scope
- suggest tags
- detect whether the candidate is new, a variation, a reinforcement, or a duplicate
- suggest deprecation of an obsolete lesson

The user confirms:
- whether the candidate should be promoted
- whether the lesson should be `global` or `project`
- whether an obsolete lesson should become `deprecated`

Promotion may happen:
- at task closure
- at any time requested by the user

At task closure, Angela should review whether any lesson candidates should be promoted.

Manual user-initiated promotion is allowed even if Angela did not suggest it first.

## Minimal Lesson Structure

Each promoted lesson should contain:
- `id`
- `timestamp`
- `title`
- `lesson`
- `reason`
- `scope`
- `tags`

Optional fields:
- `example`
- `project`
- `source_task`

Lessons should be:
- in English
- concrete
- written as rule/principle
- short enough to remain reusable without inflating context

## Deduplication and Updating

Creating a duplicate lesson is incorrect.

Before proposing a new lesson, Angela should classify the candidate as:
- `new`
- `variation`
- `reinforcement`
- `duplicate`

Preferred behavior:
- if `new` → propose a new lesson
- if `variation` → compare with existing lesson and decide whether update is enough
- if `reinforcement` → update the existing lesson
- if `duplicate` → do not create a new lesson

Existing lessons may be improved over time with:
- clearer wording
- stronger reasoning
- additional examples

## Lifecycle

The normal lifecycle is:

1. candidate detected
2. candidate drafted
3. scope suggested
4. user confirmed
5. lesson created or existing lesson updated
6. lesson may later become `deprecated`

Obsolete lessons must not be deleted.
They must be marked as `deprecated`.

Deprecated lessons should remain visible in the same document, clearly marked.

## Lesson Files

Fixed files:
- `global-lessons.md`
- `project-lessons.md`

Project contexts should point explicitly to their `project-lessons.md`.

Lessons should use chronological order with newer entries first.

## MCP Use

Lessons are part of the MCP knowledge layer.

The MCP should not load lessons indiscriminately.
It should load:
- global lessons
- relevant project lessons

The lesson system is optimized for Xfactor products and may be expanded later if the ecosystem grows.
