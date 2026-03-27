// Parses a task-notes.md file into a structured representation.
// Sections are identified by ## headings.

export interface NoteSection {
  title: string;
  content: string;
}

export interface ParsedNotes {
  header: string;
  sections: NoteSection[];
}

export function parseTaskNotes(raw: string): ParsedNotes {
  const lines = raw.split("\n");
  const sections: NoteSection[] = [];
  let header = "";
  let currentSection: NoteSection | null = null;

  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (currentSection !== null) {
        sections.push({ ...currentSection, content: currentSection.content.trimEnd() });
      } else {
        header = header.trimEnd();
      }
      currentSection = { title: line.slice(3).trim(), content: "" };
    } else if (currentSection !== null) {
      currentSection.content += line + "\n";
    } else {
      header += line + "\n";
    }
  }

  if (currentSection !== null) {
    sections.push({ ...currentSection, content: currentSection.content.trimEnd() });
  }

  return { header: header.trimEnd(), sections };
}

export function serializeTaskNotes(parsed: ParsedNotes): string {
  let result = parsed.header;

  for (const section of parsed.sections) {
    result += `\n\n## ${section.title}`;
    if (section.content.length > 0) {
      result += `\n\n${section.content}`;
    }
  }

  return result + "\n";
}
