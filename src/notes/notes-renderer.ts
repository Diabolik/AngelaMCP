// Renders a content shape into a markdown block to append to a task notes section.
// Each block starts with a timestamp line.

export function renderEntryBlock(sectionKey: string, content: unknown, timestamp: string): string {
  const lines: string[] = [`_${timestamp}_`];
  renderContent(sectionKey, content, lines);
  return lines.join("\n");
}

function renderContent(sectionKey: string, content: unknown, lines: string[]): void {
  switch (sectionKey) {
    case "research_summary": {
      const typed = content as { summary?: unknown[] };
      for (const item of typed.summary ?? []) {
        lines.push(`- ${String(item)}`);
      }
      break;
    }
    case "findings": {
      const typed = content as { findings?: unknown[] };
      for (const item of typed.findings ?? []) {
        lines.push(`- ${String(item)}`);
      }
      break;
    }
    case "next_steps": {
      const typed = content as { next_steps?: unknown[] };
      for (const item of typed.next_steps ?? []) {
        lines.push(`- ${String(item)}`);
      }
      break;
    }
    case "hypotheses": {
      const typed = content as { hypotheses?: Array<{ statement?: unknown; status?: unknown }> };
      for (const h of typed.hypotheses ?? []) {
        lines.push(`- ${String(h.statement ?? "")} _(${String(h.status ?? "open")})_`);
      }
      break;
    }
    case "decisions": {
      const typed = content as { decisions?: Array<{ decision?: unknown; status?: unknown }> };
      for (const d of typed.decisions ?? []) {
        lines.push(`- ${String(d.decision ?? "")} _(${String(d.status ?? "tentative")})_`);
      }
      break;
    }
    case "blockers": {
      const typed = content as {
        blockers?: Array<{
          cause?: unknown;
          impact?: unknown;
          missing_information_or_dependency?: unknown;
          open_questions?: unknown[];
        }>;
      };
      for (const b of typed.blockers ?? []) {
        lines.push(`- **Cause:** ${String(b.cause ?? "")}`);
        lines.push(`  **Impact:** ${String(b.impact ?? "")}`);
        lines.push(`  **Missing:** ${String(b.missing_information_or_dependency ?? "")}`);
        const questions = b.open_questions ?? [];
        if (questions.length > 0) {
          lines.push(`  **Open questions:**`);
          for (const q of questions) {
            lines.push(`  - ${String(q)}`);
          }
        }
      }
      break;
    }
    case "local_test_evidence": {
      const typed = content as {
        local_test_evidence?: Array<{ test?: unknown; observed_result?: unknown }>;
      };
      for (const e of typed.local_test_evidence ?? []) {
        lines.push(`- **Test:** ${String(e.test ?? "")}`);
        lines.push(`  **Result:** ${String(e.observed_result ?? "")}`);
      }
      break;
    }
    default:
      lines.push("```json");
      lines.push(JSON.stringify(content, null, 2));
      lines.push("```");
  }
}
