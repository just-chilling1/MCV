import { NextResponse } from "next/server";
import { featureApiGuard } from "@/lib/feature-api-guard";
import { getApiUser } from "@/lib/api-auth";
import { NO_STORE_HEADERS } from "@/lib/api-cache-headers";
import { generateWithGPT } from "@/features/blog-builder/lib/ai";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const POST_ANGLES = [
  { label: "Urgency", instruction: "Create urgency — the reader needs to act NOW before they miss out." },
  { label: "Social Proof", instruction: "Use social proof — mention how thousands of people are already benefiting from this." },
  { label: "Storytelling", instruction: "Tell a short personal transformation story — before vs after using this product." },
  { label: "Curiosity", instruction: "Spark curiosity — hint at a surprising secret or hidden truth about this topic." },
  { label: "Pain Point", instruction: "Hit a pain point hard — describe the frustration of NOT having this solution." },
  { label: "Benefit-Focused", instruction: "Lead with the biggest, most exciting benefit the reader will experience." },
  { label: "Contrarian", instruction: "Take a contrarian angle — challenge a common belief in this space." },
  { label: "Question-Based", instruction: "Open with a powerful question that stops the scroll and makes the reader think." },
  { label: "Listicle", instruction: 'Use a "3 reasons why" or "5 things" format — scannable and engaging.' },
  { label: "Testimonial", instruction: "Write as if sharing a glowing review or real testimonial from a satisfied customer." },
];

export async function POST(request: Request) {
  const guard = featureApiGuard("article-publish");
  if (guard) return guard;

  const { user } = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const { link, linkName, productInfo } = await request.json();

  if (!link) {
    return NextResponse.json({ error: "Link is required" }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const productContext = productInfo
    ? `Product: "${productInfo.title}". ${productInfo.description || ""}`
    : linkName
      ? `Product/offer: "${linkName}"`
      : `Product link: ${link}`;

  const systemPrompt = `You are a world-class Facebook copywriter who specializes in viral, high-converting social media posts. You write posts that stop the scroll, create engagement, and drive clicks. Your posts feel authentic and personal — never salesy or spammy.

Rules:
- Each post should be 4-8 sentences, perfect for Facebook
- Include emojis naturally (2-4 per post)
- Write in first person or direct address
- The link should appear naturally at the end as a call-to-action
- NEVER use hashtags (Facebook doesn't use them effectively)
- Make the posts feel real — like a friend recommending something
- Each post must be COMPLETELY different in style, angle, and opening

Respond ONLY with a valid JSON array of exactly 10 objects. Each object must have:
- "hook": the attention-grabbing first 1-2 sentences
- "body": the main content (3-5 sentences)
- "cta": the call-to-action including the link

Use plain text only (no HTML tags). Use real line breaks within the strings where natural.`;

  const anglesText = POST_ANGLES.map((a, i) => `${i + 1}. ${a.label}: ${a.instruction}`).join("\n");

  const userPrompt = `Generate exactly 10 unique, high-converting Facebook posts promoting this: ${productContext}

Link to include in CTA: ${link}

Each post MUST use a different angle/hook style:
${anglesText}

Return ONLY a JSON array of 10 objects with "hook", "body", "cta" keys. No extra text before or after.`;

  try {
    const result = await generateWithGPT(systemPrompt, userPrompt, {
      temperature: 0.85,
      maxRetries: 5,
      timeoutMs: 120_000,
    });

    let posts: { hook: string; body: string; cta: string; angle: string }[] = [];

    try {
      const jsonMatch = result.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as unknown;
        if (Array.isArray(parsed)) {
          posts = parsed.map((p: unknown, i: number) => {
            const row = p as { hook?: string; body?: string; cta?: string };
            return {
              hook: row.hook || "",
              body: row.body || "",
              cta: row.cta || `Check it out here: ${link}`,
              angle: POST_ANGLES[i]?.label || `Post ${i + 1}`,
            };
          });
        }
      }
    } catch {
      const sections = result.split(/(?=\d+\.\s)/).filter((s) => s.trim());
      if (sections.length >= 3) {
        posts = sections.slice(0, 10).map((section, i) => ({
          hook: section.split("\n")[0] || "",
          body: section.split("\n").slice(1).join("\n").trim() || section,
          cta: `Check it out here: ${link}`,
          angle: POST_ANGLES[i]?.label || `Post ${i + 1}`,
        }));
      }
    }

    if (posts.length === 0) {
      posts = [
        {
          hook: "Could not parse the AI response into separate posts.",
          body: result,
          cta: `Check it out here: ${link}`,
          angle: "Raw Output",
        },
      ];
    }

    return NextResponse.json({ posts }, { headers: NO_STORE_HEADERS });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to generate posts. Please try again.";
    return NextResponse.json({ error: msg }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
