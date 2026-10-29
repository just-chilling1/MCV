function stripCodeFences(s: string): string {
  let t = s.trim();
  if (!t.startsWith("```")) return t;
  t = t.replace(/^```(?:json)?\s*/i, "");
  const end = t.lastIndexOf("```");
  if (end !== -1) t = t.slice(0, end);
  return t.trim();
}

function extractJsonArraySubstring(s: string): string | null {
  const start = s.indexOf("[");
  if (start === -1) return null;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (esc) {
        esc = false;
        continue;
      }
      if (c === "\\") {
        esc = true;
        continue;
      }
      if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') {
      inStr = true;
      continue;
    }
    if (c === "[") depth++;
    else if (c === "]") {
      depth--;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  return null;
}

function stringsFromJsonArrayText(arrayText: string): string[] {
  const out: string[] = [];
  const re = /"((?:[^"\\]|\\.)*)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(arrayText)) !== null) {
    const decoded = m[1]
      .replace(/\\"/g, '"')
      .replace(/\\n/g, " ")
      .replace(/\\\\/g, "\\")
      .trim();
    if (decoded.length > 5) out.push(decoded);
  }
  return out;
}

function normalizeParsedHeadlines(parsed: unknown): string[] {
  if (parsed == null) return [];
  if (Array.isArray(parsed)) {
    return parsed
      .filter((item): item is string => typeof item === "string")
      .map((h) => h.trim())
      .filter((h) => h.length > 5);
  }
  if (typeof parsed === "object") {
    const h = (parsed as { headlines?: unknown }).headlines;
    if (Array.isArray(h)) return normalizeParsedHeadlines(h);
  }
  return [];
}

function parseNumberedHeadlines(text: string): string[] {
  const out: string[] = [];
  for (const line of text.split(/\n/)) {
    const m = line.match(/^\s*\d+[\.)]\s+(.+)$/);
    if (m) {
      const t = m[1].replace(/^["'`]|["'`]$/g, "").trim();
      if (t.length > 5) out.push(t);
    }
  }
  return out;
}

export function parseHeadlinesFromModel(raw: string): string[] {
  const text = stripCodeFences(raw);
  let headlines: string[] = [];

  try {
    headlines = normalizeParsedHeadlines(JSON.parse(text));
  } catch {
    /* ignore */
  }

  const slice = extractJsonArraySubstring(text);
  if (slice) {
    try {
      const fromSlice = normalizeParsedHeadlines(JSON.parse(slice));
      if (fromSlice.length > headlines.length) headlines = fromSlice;
    } catch {
      const fromQuotes = stringsFromJsonArrayText(slice);
      if (fromQuotes.length > headlines.length) headlines = fromQuotes;
    }
  }

  if (headlines.length < 2) {
    const fromQuotesFull = stringsFromJsonArrayText(text);
    if (fromQuotesFull.length > headlines.length) headlines = fromQuotesFull;
  }

  if (headlines.length < 2) {
    const numbered = parseNumberedHeadlines(text);
    if (numbered.length > headlines.length) headlines = numbered;
  }

  if (headlines.length < 2) {
    const splitLines = text
      .split(/\n+/)
      .map((line) => line.trim())
      .filter((line) => line.length > 5)
      .map((line) =>
        line
          .replace(/^\d+[\.)]\s*/, "")
          .replace(/^[-*]\s*/, "")
          .replace(/^["']|["']$/g, "")
          .trim()
      )
      .filter(
        (line) =>
          line.length > 5 &&
          !line.startsWith("[") &&
          !line.startsWith("{") &&
          !/^```/.test(line)
      );
    if (splitLines.length > headlines.length) headlines = splitLines;
  }

  if (headlines.length === 0 && text.trim().length > 10) {
    headlines = [text.replace(/^["']|["']$/g, "").trim()];
  }

  return headlines;
}
