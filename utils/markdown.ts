/**
 * Utilities for parsing AI-generated markdown content into structured data.
 */

export interface ParsedSection {
  heading: string;
  level: number;
  content: string[];
}

/**
 * Split markdown content into sections by headings (## or ###)
 */
export function parseSections(markdown: string): ParsedSection[] {
  const lines = markdown.split("\n");
  const sections: ParsedSection[] = [];
  let current: ParsedSection | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    const h2 = trimmed.match(/^##\s+(.+)/);
    const h3 = trimmed.match(/^###\s+(.+)/);

    if (h2) {
      if (current) sections.push(current);
      current = { heading: h2[1], level: 2, content: [] };
    } else if (h3) {
      if (current) sections.push(current);
      current = { heading: h3[1], level: 3, content: [] };
    } else if (trimmed && current) {
      current.content.push(trimmed);
    }
  }
  if (current) sections.push(current);
  return sections;
}

/**
 * Extract bullet points from a block of markdown content
 */
export function extractBullets(content: string[]): string[] {
  return content
    .filter((line) => /^[-*]\s/.test(line))
    .map((line) => line.replace(/^[-*]\s/, "").trim())
    .map((line) => line.replace(/\*\*(.*?)\*\*/g, "$1"));
}

/**
 * Extract numbered list items
 */
export function extractNumberedItems(content: string[]): string[] {
  return content
    .filter((line) => /^\d+\.\s/.test(line))
    .map((line) => line.replace(/^\d+\.\s/, "").trim());
}

/**
 * Strip markdown formatting for plain text display
 */
export function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*]\s+/gm, "")
    .trim();
}

/**
 * Find a specific section by heading keyword (case-insensitive partial match)
 */
export function findSection(
  sections: ParsedSection[],
  keyword: string
): ParsedSection | undefined {
  return sections.find((s) =>
    s.heading.toLowerCase().includes(keyword.toLowerCase())
  );
}

/**
 * Truncate text to a max length with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}
