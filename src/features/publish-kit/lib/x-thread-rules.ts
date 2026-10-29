/** Story roles for each post in a product thread (1-based labels in prompts). */
export const THREAD_POST_ROLES = [
  "Hook",
  "Scene",
  "Stakes",
  "Failure",
  "Turning point",
  "Mechanism",
  "Product reveal",
  "Proof",
  "Objection",
  "CTA",
] as const;

/** 0-based indexes that receive visuals — posts 1, 4, and 7 (not consecutive). */
export const THREAD_IMAGE_POST_INDEXES = [0, 3, 6] as const;

export function buildThreadStoryStructure(): string {
  return THREAD_POST_ROLES.map(
    (role, i) =>
      `${i + 1}. ${role} — ${THREAD_POST_ROLE_HINTS[i]}`
  ).join("\n");
}

const THREAD_POST_ROLE_HINTS = [
  "Scroll-stopper: open mid-story with a specific result, bold contrast, or a line that creates instant curiosity. Include a number, date, or named outcome in the first sentence. End on an open loop the next post must answer. No link, hashtag, 🧵, or the word \"thread\" or \"introducing.\"",
  "Drop the reader into a concrete scene — month/year, place, and one sensory detail (sound, smell, time of day). Make them feel they were there. 2–3 sentences. End with tension or a question.",
  "Raise the stakes — spell out what gets worse if nothing changes (money lost, time wasted, health slipping, embarrassment). Use 2–3 sentences so the cost feels personal, not abstract.",
  "2–3 failed attempts and why each one failed — name the tactic, the hope, and the letdown. Mandatory — a thread without failure reads as an ad. End on the lowest point.",
  "The turning point in 1–2 vivid sentences — what shifted, who said what, or what you finally noticed. Must feel earned after post 4. End with a hint of hope.",
  "Teach the mechanism clearly enough that the reader could try it manually without buying anything. Use 2–4 sentences with concrete steps, tools, or a mini-framework.",
  "Introduce the product as the thing that makes step 6 fast or repeatable — 2–3 sentences, casual, like recommending a tool to a friend. No link yet, no launch hype.",
  "Deliver proof: a specific number, a timeframe, and enough detail that the result feels believable — 2–3 sentences. Tie back to the hook metric if possible.",
  "Handle the biggest objection OR state clearly who this is NOT for — 2–3 sentences with a honest reason. Builds trust before the ask.",
  "Recap the journey in 4–5 short lines (problem → turning point → result). End with exactly ONE call to action and the promotion URL.",
];

export function buildThreadSystemPrompt(platformLabel: string): string {
  return `You are an expert ${platformLabel} storyteller for affiliate marketers.
Write ONE cohesive product story thread — a mini-movie in 10 posts, not separate promo tweets.
The reader is the hero. The author is the mentor who lived it. The product is a tool discovered late in the story.
Every post must pull the reader to the next one like a cliffhanger serial.
Return ONLY valid JSON — no markdown fences.`;
}

export function buildThreadUserPrompt(params: {
  fullContext: string;
  promoLink: string;
  postCount: number;
}): string {
  const count = params.postCount;
  const rolesText = buildThreadStoryStructure();

  return `Using this product + website context, write ONE ${platformLabel()} story thread of exactly ${count} connected posts.

${params.fullContext}

Promotion URL (ONLY in the final post — use the offer page URL, not a raw affiliate link): ${params.promoLink}

## Story spine (follow this emotional arc)
Curiosity hook → vivid scene → rising stakes → rock bottom → insight → teachable method → tool reveal → proof → honest filter → single CTA

## Structure — one post per role, in order:
${rolesText}

## Length and rhythm
- Each post: 2–4 sentences, roughly 220–320 characters — use the full post space; avoid terse one-liners
- Each post: one main idea, developed with enough detail to stand alone in the feed
- At least 4 posts must end on an open loop the next post resolves (especially posts 1, 3, 4, 5)
- Vary sentence length: mix a short punchy line with a longer explanatory one
- Use prose throughout — no bullet lists in this thread
- Reject any draft post under 200 characters — expand with scene, emotion, or a concrete detail

## Attention hooks (use at least 2 across the thread)
- Specific numbers with timeframes ("$840 in 9 weeks", "11 pounds by March")
- Named places or moments ("kitchen table, 11pm", "gym parking lot, 5:45am")
- Before/after contrast ("I used to… now I…")
- A line that sounds wrong until the next post explains it
- One raw admission of embarrassment or frustration

## Voice
- Write like you're texting a smart friend — contractions, natural rhythm, occasional fragment for emphasis
- Product name appears in exactly 2 posts: the reveal (post 7) and the CTA (post 10)
- No feature lists — features belong on the landing page
- Every claim must be concrete; avoid vague words like "improved efficiency" or "better results"
- At least 2 posts carry emotion (how it felt in the body), not just data
- Banned adjectives: revolutionary, game-changing, powerful, cutting-edge, seamless, incredible, amazing
- 0–2 emoji for the entire thread, punctuation only
- 0–2 hashtags for the entire thread (zero preferred)
- No post numbering like "1/10"
- No visible framework labels ("Step 1: The Problem")
- If it reads like a brochure or press release, rewrite until it sounds spoken aloud

## Links
- Post 1: NO link
- Posts 2–9: NO links
- Post 10: exactly ONE call to action with the promotion URL
- Do NOT invent fake stats, prices, or testimonials — use plausible specifics grounded in context

## Generation order (follow internally)
1. Pick the proof number for post 8 first — it anchors the whole story
2. Work backwards to the failure in post 4 — it must explain why the proof was hard-won
3. Write the turning point in post 5 in 1–2 developed sentences
4. Draft 5 hook candidates; pick the one that creates the strongest curiosity gap for post 1
5. Fill posts 2, 3, 6, 7 — each must reference the niche/territory naturally
6. Write the objection in post 9
7. Write the CTA last — recap the arc, one ask, one link

## Rejection — rewrite if ANY are true
- Post 1 requires the rest of the thread to make sense (hook must stand alone AND tease)
- No failure or setback in post 4
- Product appears before post 7
- Any post exceeds 5 sentences
- Any post is under 200 characters
- Final post has two or more asks
- No specific number anywhere in the thread
- Thread reads the same whether the product exists or not
- Reading aloud sounds like marketing copy, not a person talking
- Two consecutive posts start with the same word or sentence pattern
- No sensory or emotional detail in posts 2–5

Banned hook openers: "A thread on...", "Some thoughts on...", "Here's how to grow...", "Let me tell you about...", "Ever wonder...", "In today's world...", "Are you struggling with..."

Return ONLY this JSON shape:
{
  "posts": [
    { "text": "full ready-to-paste post text", "role": "Hook" }
  ]
}`;
}

function platformLabel(): string {
  return "X (Twitter)";
}
