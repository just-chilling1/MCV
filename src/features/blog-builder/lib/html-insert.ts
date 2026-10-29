/**
 * Shared HTML insertion helpers. Both the affiliate weaver and the image
 * placement logic need to drop a chunk of markup at a natural break in the
 * article body, so the offset-finding lives here once.
 */

/** Byte offsets immediately after each `</h2>` in the html. */
export function h2EndOffsets(html: string): number[] {
  const ends: number[] = [];
  const re = /<\/h2>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    ends.push(match.index + match[0].length);
  }
  return ends;
}

/**
 * Insert `chunk` after the H2 at `preferredIndex` (0 = first H2, 1 = second).
 * Falls back to the last H2, then the first paragraph, then the very top.
 */
export function insertAfterH2(html: string, chunk: string, preferredIndex = 1): string {
  const ends = h2EndOffsets(html);

  let insertAt: number;
  if (ends.length > preferredIndex) {
    insertAt = ends[preferredIndex];
  } else if (ends.length > 0) {
    insertAt = ends[ends.length - 1];
  } else {
    const pEnd = html.indexOf("</p>");
    insertAt = pEnd >= 0 ? pEnd + 4 : -1;
  }

  if (insertAt > 3) {
    return `${html.slice(0, insertAt)}${chunk}${html.slice(insertAt)}`;
  }
  return `${chunk}${html}`;
}
