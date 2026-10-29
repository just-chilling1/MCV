import type { SourceType } from "./source-types";

export function sourceHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function buildCuratedInstructions(opts: {
  type: SourceType;
  name: string;
  url: string;
  community: string;
  focus?: string;
}): string[] {
  const host = sourceHost(opts.url);
  const { name, community } = opts;
  const focus = opts.focus ?? defaultFocus(opts.type, community);

  if (opts.url.includes("reddit.com")) {
    return [
      `Go to ${opts.url.replace(/\/$/, "")} and create a free Reddit account if you don't already have one.`,
      "Complete your profile with a photo and a short bio so you look like a real member, not a throwaway promo account.",
      `Read the community rules, then leave 3-5 genuinely helpful comments on existing posts in ${name} before you share anything.`,
      `When someone asks a question your page actually answers, write a useful reply first and include {LINK} only as an optional resource.`,
      "Come back a few times this week. Helpful comments keep ranking and send visitors for months — Reddit removes bare promotional posts immediately.",
    ];
  }

  switch (opts.type) {
    case "Forum":
      return [
        `Go to ${host} and create a free account.`,
        "Complete your profile with a photo and a short bio so other members take you seriously.",
        "Go to Settings → Signature (or Profile → About) and add your link with the description below.",
        `Make 3-5 helpful posts in ${focus}. Answer the question first — never drop a bare link.`,
        "Your signature with your link appears on every post automatically, so each useful reply keeps sending traffic.",
      ];
    case "Social":
      return [
        `Go to ${host} and create a free account (or log in).`,
        "Complete your profile with a photo, a bio, and a clear description of how you help people.",
        `Add {LINK} to your profile bio or 'about' section using the description below.`,
        `Join the active ${community} conversations in ${focus} and leave 3-5 useful comments or posts this week.`,
        "Stay visible with a couple of helpful contributions each week. Profile links and useful posts keep sending visitors after you leave.",
      ];
    case "Directory":
      return [
        `Open ${host} and look for the free listing, submit, or 'add a resource' flow.`,
        "Create an account if the directory requires one, and fill every required field so the listing is not rejected.",
        `Use a clear title, pick the closest ${community} category, and paste the description below with {LINK}.`,
        `Double-check that the URL, title, and category all match what the page actually is — inaccurate listings get dropped.`,
        "Submit and wait for approval (often 1-7 days). Recheck the listing once it goes live so the link still points to your page.",
      ];
    case "Blog":
      return [
        `Go to ${host} and create a free account if you need one to comment, contribute, or pitch.`,
        "Read a recent article that is close to your topic so you can add something specific instead of a generic promo.",
        `Leave a thoughtful comment or submit a short guest contribution that actually helps the ${community}.`,
        `Include {LINK} only where it gives the reader a useful next step, using the description below.`,
        "Follow up once: reply to questions on your comment or pitch. Helpful contributors get more visibility than one-off link drops.",
      ];
    case "Q&A":
      return [
        `Go to ${host} and create a free account with a credible name, photo, and bio.`,
        `Search for current questions the ${community} is asking, especially 'how to' and 'best resource' threads.`,
        "Write a detailed answer in your own words (a few paragraphs, not a one-liner). Lead with the advice, not the link.",
        `Add {LINK} once, as an optional resource, using the description below.`,
        "Answer 2-3 related questions this week. Detailed answers keep ranking in search and send traffic long after you post.",
      ];
    case "Classified":
      return [
        `Go to ${host} and open the free posting flow for services, gigs, or community listings.`,
        "Write a specific, honest title — describe the help you offer, not a generic 'make money' claim.",
        `Paste the description below in the body and include {LINK} so readers can open the page.`,
        "Fill in location and category fields accurately so the post is not filtered out.",
        "Repost every 48 hours if the site allows it. Fresh listings stay at the top and keep sending visitors.",
      ];
    case "Video":
      return [
        `Go to ${host} and create or log into your account.`,
        `Publish a short, original video that teaches one useful takeaway for the ${community}.`,
        "Write a title and description that match the video. Put the value in the content, not in a sales pitch.",
        `Add {LINK} in the description or profile field using the description below.`,
        "Reply to comments and post a follow-up if people ask questions. Videos that keep getting comments keep getting recommended.",
      ];
    default:
      return [
        `Go to ${host} and create a free account.`,
        "Complete your profile with a photo and a short bio.",
        `Add {LINK} using the description below.`,
        `Make 3-5 helpful contributions in ${focus}.`,
        "Stay active during the week so your posts keep sending visitors.",
      ];
  }
}

export function buildSubmissionDescription(opts: {
  type: SourceType;
  name: string;
  offerAngle: string;
  variant?: number;
}): string {
  const { type, name, offerAngle } = opts;
  const variant = Math.abs(opts.variant ?? 0) % 3;
  const link = "{LINK}";

  const templates: Record<SourceType, readonly [string, string, string]> = {
    Forum: [
      `For anyone on ${name} still looking for a next step: I put together ${offerAngle} here: ${link}`,
      `I keep ${offerAngle} for ${name} members who want extra reading — skip it if it is not a fit: ${link}`,
      `Sharing ${offerAngle} in this ${name} thread because it covers a few of the follow-up questions: ${link}`,
    ],
    Social: [
      `If it helps this ${name} conversation, I put together ${offerAngle} as optional extra reading: ${link}`,
      `Saved ${offerAngle} for people in ${name} who want a practical next step: ${link}`,
      `Posting ${offerAngle} for ${name} — ignore it if it is off-topic: ${link}`,
    ],
    Directory: [
      `Resource listing for ${name}: ${offerAngle}. Visit: ${link}`,
      `${name} submission: ${offerAngle} with useful next steps at ${link}`,
      `Added ${offerAngle} to ${name} so people can open the full page here: ${link}`,
    ],
    Blog: [
      `Left this for ${name} readers who want a fuller walkthrough: ${offerAngle} — ${link}`,
      `If this ${name} piece is useful, I also put together ${offerAngle} with extra steps: ${link}`,
      `One extra resource for ${name} readers: ${offerAngle}. Full page: ${link}`,
    ],
    "Q&A": [
      `I wrote a longer answer as ${offerAngle} for this ${name} question. Optional reading: ${link}`,
      `If you want the full walkthrough after this ${name} answer, I keep ${offerAngle} here: ${link}`,
      `Extra context for this ${name} thread: ${offerAngle}. Skip if you already have what you need: ${link}`,
    ],
    Classified: [
      `${name} listing: ${offerAngle}. Details here: ${link}`,
      `Offering ${offerAngle} via ${name}. Open the page for the full write-up: ${link}`,
      `Posted on ${name}: ${offerAngle} with next steps at ${link}`,
    ],
    Video: [
      `Full resource from this ${name} video: ${offerAngle} — ${link}`,
      `More detail than I could fit on ${name}: ${offerAngle}. Page is here: ${link}`,
      `${name} follow-up: ${offerAngle} with the steps from the video: ${link}`,
    ],
  };

  return templates[type][variant];
}

function defaultFocus(type: SourceType, community: string) {
  switch (type) {
    case "Forum":
      return `the most active ${community} boards`;
    case "Social":
      return `groups and threads serving the ${community}`;
    case "Directory":
      return `the closest ${community} category`;
    case "Blog":
      return `a closely related article for the ${community}`;
    case "Q&A":
      return `current ${community} questions`;
    case "Classified":
      return `the services or community section`;
    case "Video":
      return `one practical ${community} topic`;
  }
}
