import { generateWithGPT, extractJsonFromText } from "@/features/blog-builder/lib/ai";
import type { QuestionnaireCopy } from "@/features/blog-builder/lib/questionnaire-copy";
import {
  THREADS_PER_GENERATION,
  THREAD_POST_ROLES,
} from "@/features/publish-kit/lib/promote-constants";
import {
  buildThreadSystemPrompt,
  buildThreadUserPrompt,
} from "@/features/publish-kit/lib/x-thread-rules";
import type { AcceleratorCatalogEntry } from "./catalog";
import {
  ACCELERATOR_THREAD_LINK_PLACEHOLDER,
  buildStaticAcceleratorXThreadSeedRows,
  isValidAcceleratorThreadRows,
  normalizeFinalThreadPost,
  stripLinkFromNonFinalPost,
  type AcceleratorThreadSeedRow,
} from "./x-thread-seeds";

function buildAcceleratorThreadContext(
  entry: AcceleratorCatalogEntry,
  copy: QuestionnaireCopy
): string {
  const benefitLines = copy.promoBullets?.length
    ? `Benefits: ${copy.promoBullets.slice(0, 5).join("; ")}`
    : "";

  return [
    "=== WEBSITE ===",
    `Website: ${copy.title}`,
    copy.subtitle ? `Tagline: ${copy.subtitle}` : "",
    `Niche / territory: ${entry.nicheLabel}`,
    `Product: ${entry.productName}`,
    copy.intro ? `Audience hook: ${copy.intro.slice(0, 280)}` : "",
    "Site type: product promotion page",
    "",
    "=== PRODUCT / OFFER ===",
    copy.promoHeadline ? `Headline: ${copy.promoHeadline}` : "",
    copy.promoBody ? `Description: ${copy.promoBody}` : "",
    benefitLines,
    copy.resultMessage ? `Outcome angle: ${copy.resultMessage}` : "",
    copy.resultHeadline ? `Result framing: ${copy.resultHeadline}` : "",
    copy.promoSubtext ? `Urgency / angle: ${copy.promoSubtext}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Strip accidental URLs from posts 1–9; normalize the CTA link to the clone placeholder. */
function normalizeThreadText(text: string, isFinalPost: boolean): string {
  return isFinalPost ? normalizeFinalThreadPost(text) : stripLinkFromNonFinalPost(text);
}

function parseGeneratedThreadPosts(raw: unknown): AcceleratorThreadSeedRow[] | null {
  const parsed = raw as { posts?: { text?: string; role?: string; angle?: string }[] } | null;
  const posts = Array.isArray(parsed?.posts) ? parsed!.posts : [];

  const rows = posts
    .filter((row) => row && typeof row.text === "string" && row.text.trim().length > 0)
    .slice(0, THREADS_PER_GENERATION)
    .map((row, i) => ({
      text: normalizeThreadText(row.text!.trim(), i === THREADS_PER_GENERATION - 1),
      angle:
        typeof row.role === "string" && row.role.trim()
          ? row.role.trim()
          : typeof row.angle === "string" && row.angle.trim()
            ? row.angle.trim()
            : THREAD_POST_ROLES[i] ?? `Post ${i + 1}`,
    }));

  return rows.length >= THREADS_PER_GENERATION && isValidAcceleratorThreadRows(rows) ? rows : null;
}

/**
 * Generate a 10-post X story thread using the same rules as X-Power Promotions.
 * Falls back to static seeds if the model call fails.
 */
export async function generateAcceleratorXThreadRows(params: {
  entry: AcceleratorCatalogEntry;
  copy: QuestionnaireCopy;
}): Promise<AcceleratorThreadSeedRow[]> {
  const { entry, copy } = params;
  const fullContext = buildAcceleratorThreadContext(entry, copy);
  const platformLabel = "X (Twitter)";

  const system = buildThreadSystemPrompt(platformLabel);
  const userPrompt = buildThreadUserPrompt({
    fullContext,
    promoLink: ACCELERATOR_THREAD_LINK_PLACEHOLDER,
    postCount: THREADS_PER_GENERATION,
  });

  try {
    const raw = await generateWithGPT(system, userPrompt, {
      temperature: 0.82,
      maxRetries: 4,
      timeoutMs: 120_000,
    });

    const rows = parseGeneratedThreadPosts(extractJsonFromText(raw));
    if (rows) return rows;
  } catch {
    /* fall through to static seeds */
  }

  return buildStaticAcceleratorXThreadSeedRows(
    entry.productName,
    entry.nicheLabel,
    entry.nicheKey
  );
}
