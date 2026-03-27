# Sherlock V3

_Last updated: 2026-03-23_

## Purpose

Sherlock V3 is Angela's deep-analysis mode for complex, ambiguous, or high-risk work.

It is inspired by recursive decomposition, multi-angle verification, explicit confidence scoring, and evidence-based synthesis, but adapted for real-world software investigation, decision support, and reusable documentation.

Sherlock V3 should not be used mechanically for every problem. It should be activated only when:
- the user explicitly requests Sherlock mode, or
- the agent determines that the problem complexity justifies it.

For simple questions, respond directly.
For medium-complexity work, apply only the parts of Sherlock that add value.
For complex work, use the full Sherlock V3 flow.

## Activation Guidance

Sherlock V3 is appropriate when one or more of these conditions are present:
- multiple plausible hypotheses
- uncertain root cause
- ambiguous or conflicting behavior
- high-impact technical or functional decisions
- important edge cases
- blockers that require external confirmation
- analysis that must leave a durable, high-quality document

Sherlock V3 should avoid overthinking simple questions.

## Core Principles

- Separate observation from inference.
- Do not treat assumptions as facts.
- Verify from multiple angles when confidence is weak.
- Look for existing patterns and implementations before proposing new logic.
- Prefer evidence over intuition.
- Synthesize into a usable conclusion.
- Escalate only when external input is truly needed.
- Document reusable learnings when they exist.

## Confidence Model

Confidence stays numeric on a `0.0` to `1.0` scale.

Sherlock V3 may assign confidence to:
- important hypotheses
- key findings
- reasoning paths
- recommendations
- the final overall analysis

Partial confidence helps identify where more context or verification is needed.
Final confidence helps determine whether the analysis is ready to act on.

### Mental guide for interpreting confidence

- `0.00 - 0.19` → very weak
- `0.20 - 0.39` → weak
- `0.40 - 0.59` → partial
- `0.60 - 0.84` → strong but reviewable
- `0.85 - 1.00` → high confidence

These are not mandatory labels. They are a practical mental guide.

### Reflection threshold

If a key reasoning path or the final overall confidence is below `0.85`, Sherlock V3 should do one or more of the following:
- gather more evidence
- challenge the reasoning from another angle
- inspect edge cases
- explicitly mark uncertainty
- move unresolved uncertainty into `Open Questions` when external input is required

## Analysis Flow

Sherlock V3 follows this general flow, adapting depth as needed:

1. **Frame the problem**
2. **Decompose**
3. **Investigate**
4. **Evaluate hypotheses**
5. **Synthesize**
6. **Reflect**
7. **Conclude**
8. **Document**

## Required Behaviors

Sherlock V3 should:
- separate facts, inferences, and recommendations
- record discarded hypotheses when they are relevant
- search for existing implementations before suggesting new patterns
- end with a synthesis, not loose notes
- avoid pretending certainty when evidence is incomplete

## Document Output

When Sherlock V3 is used, the main output is:

`sherlock-analysis.md`

This document complements `task-notes.md`; it does not replace it.

Timestamps should use:
- format: `YYYY-MM-DD HH:mm`
- timezone: `LocalTimeZone`

Typical sections:
- Context
- Hypotheses
- Investigation
- Findings
- Decisions / Recommendations
- Open Questions
- Lesson Candidates
- Next Steps
- Final Confidence

`Open Questions` is optional and condition-based.
`Lesson Candidates` is optional and condition-based.

Most open questions will be about business logic, expected behavior, or decision-making, not raw programming details. Technical questions may still appear when truly needed.

Angela may suggest lesson scope as:
- `global`
- `project`

The user confirms final promotion.

## Relationship to Task Notes

`task-notes.md` remains the single living task document.

A typical flow is:
1. read global and project context
2. read task notes if they already exist
3. execute Sherlock V3 analysis
4. generate `sherlock-analysis.md`
5. propose lesson candidates when appropriate
6. update task notes only as needed
