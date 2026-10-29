import * as cheerio from "cheerio";

const FORBIDDEN_TAGS = new Set([
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "form",
  "input",
  "button",
  "textarea",
  "select",
  "link",
  "meta",
  "base",
  "svg",
  "math",
]);

/**
 * Strip executable / dangerous markup from member-edited post HTML.
 * Keeps normal article tags; removes scripts, event handlers, and javascript: URLs.
 */
export function sanitizePostHtml(html: string): string {
  const $ = cheerio.load(html, { xml: false }, false);

  $(Array.from(FORBIDDEN_TAGS).join(",")).remove();

  $("*").each((_, el) => {
    const node = el as {attribs?: Record<string, string> };
    const attribs = node.attribs;
    if (!attribs) return;
    for (const name of Object.keys(attribs)) {
      const lower = name.toLowerCase();
      if (lower.startsWith("on") || lower === "srcdoc" || lower === "formaction") {
        $(el).removeAttr(name);
        continue;
      }
      if (lower === "href" || lower === "src" || lower === "xlink:href") {
        const value = (attribs[name] ?? "").trim().toLowerCase();
        if (
          value.startsWith("javascript:") ||
          value.startsWith("vbscript:") ||
          value.startsWith("data:text/html")
        ) {
          $(el).removeAttr(name);
        }
      }
    }
  });

  return $.root().html()?.trim() ?? "";
}

/** Escape JSON for embedding inside <script type="application/ld+json">. */
export function safeJsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c").replace(/>/g, "\\u003e");
}
