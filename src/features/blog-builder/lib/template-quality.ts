import type { BlogPost } from "../types";

const CHESS_TITLE_RE = /wooden chess|chess sets under\s*\$?\d+/i;

/** Pool/algae hallucination or supplement jargon on AlgePrime (algebra education). */
const ALGEPRIME_WRONG_RE =
  /\b(algaecide|algaecides|microplastic|greenhouse|pool owner|manual scrubbing|copper-based|biological treatment|dosage cycle|stack strateg|deploy capital)\b/i;

/** Tech/crypto drift on EchoXen (hearing supplement). */
const ECHOXEN_TECH_RE =
  /\b(echoxen node|echoxen nodes|neural project|deploy capital|latency benchmark|run a node)\b/i;

function textBlob(post: Pick<BlogPost, "title" | "excerpt" | "html">): string {
  return `${post.title}\n${post.excerpt ?? ""}\n${post.html ?? ""}`;
}

export function isDefectiveGeneratedPost(
  post: Pick<BlogPost, "title" | "excerpt" | "html">,
  territory: string
): boolean {
  const blob = textBlob(post);
  const t = territory.trim();

  if (CHESS_TITLE_RE.test(post.title)) return true;

  if (/algeprime/i.test(t)) {
    if (ALGEPRIME_WRONG_RE.test(blob)) return true;
  }

  if (/echoxen/i.test(t)) {
    if (ECHOXEN_TECH_RE.test(blob)) return true;
  }

  return false;
}
