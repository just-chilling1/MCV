import type { AutopilotNicheProfile } from "./niche-profiles";
import type { Difficulty, SourceType, TrafficSource } from "./source-types";

type PlatformPlaybook = {
  id: string;
  name: string;
  type: SourceType;
  difficulty: Difficulty;
  time: string;
  visitors: readonly [number, number];
  url: string;
  description: string;
  instructions: readonly string[];
};

type PlatformPlaybookTuple = readonly [
  PlatformPlaybook,
  PlatformPlaybook,
  PlatformPlaybook,
  PlatformPlaybook,
  PlatformPlaybook,
  PlatformPlaybook,
  PlatformPlaybook,
  PlatformPlaybook,
  PlatformPlaybook,
  PlatformPlaybook,
  PlatformPlaybook,
  PlatformPlaybook,
];

const PLATFORM_PLAYBOOKS: PlatformPlaybookTuple = [
  {
    id: "reddit",
    name: "Reddit",
    type: "Social",
    difficulty: "Medium",
    time: "10 minutes",
    visitors: [150, 800],
    url: "https://www.reddit.com/{SUBREDDIT}/",
    description:
      "If it helps anyone in {SUBREDDIT}: I put together {OFFER_ANGLE} as extra reading here: {LINK}",
    instructions: [
      "Go to {SUBREDDIT} and create a Reddit account if you don't already have one.",
      "Read the community rules, then comment helpfully on 3-5 existing posts so you don't look like a brand-new promo account.",
      "Find a current question about {KEYWORDS}. Write a detailed answer in your own words before you mention any link.",
      "Share {LINK} only when it directly supports the discussion, using the description below.",
      "Come back a few times this week. Helpful comments keep ranking — Reddit removes bare promotional posts immediately.",
    ],
  },
  {
    id: "quora",
    name: "Quora",
    type: "Q&A",
    difficulty: "Easy",
    time: "12 minutes",
    visitors: [100, 600],
    url: "https://www.quora.com/",
    description:
      "I wrote a longer walkthrough as {OFFER_ANGLE} for this Quora question. Optional reading: {LINK}",
    instructions: [
      "Go to quora.com and create a free account with a real name, photo, and a short bio about {KEYWORDS}.",
      "Search for current questions about {KEYWORDS}, especially 'how to' and 'what should I read' threads.",
      "Write a complete answer in your own words (a few paragraphs). Lead with the advice, not the link.",
      "Include {LINK} once as an optional resource when it actually answers the question, using the description below.",
      "Answer 2-3 related questions this week. Detailed Quora answers keep showing up in search and send traffic for months.",
    ],
  },
  {
    id: "pinterest",
    name: "Pinterest",
    type: "Social",
    difficulty: "Easy",
    time: "15 minutes",
    visitors: [120, 750],
    url: "https://www.pinterest.com/",
    description:
      "Pin: {OFFER_ANGLE} for {KEYWORDS}. Full steps here: {LINK}",
    instructions: [
      "Go to pinterest.com and create a free business account.",
      "Create a board around {KEYWORDS} with a clear title and description.",
      "Design an original pin (Canva is fine) that teaches one helpful tip — the image should match the page.",
      "Set the pin destination to {LINK} and write a keyword-rich description using the text below.",
      "Pin 5-10 related ideas this week. Consistent, useful pins keep sending visitors long after you publish them.",
    ],
  },
  {
    id: "facebook-groups",
    name: "Facebook Groups",
    type: "Social",
    difficulty: "Medium",
    time: "15 minutes",
    visitors: [80, 500],
    url: "https://www.facebook.com/groups/",
    description:
      "Sharing {OFFER_ANGLE} for anyone in this {COMMUNITY} group who wants a practical next step: {LINK}",
    instructions: [
      "Go to facebook.com/groups and search for active groups serving the {COMMUNITY} (5K+ members is a good filter).",
      "Join 5-10 groups and read each group's self-promotion rules before you post anything.",
      "Comment helpfully on other members' posts for a day or two so you are not a brand-new link dropper.",
      "Share a useful post or comment and include {LINK} only where the group allows it, using the description below.",
      "Post 2-3 times per week in the groups that stay active. Groups reward members who keep contributing.",
    ],
  },
  {
    id: "medium",
    name: "Medium",
    type: "Blog",
    difficulty: "Medium",
    time: "25 minutes",
    visitors: [70, 450],
    url: "https://medium.com/",
    description:
      "I published extra context as {OFFER_ANGLE} for Medium readers who want the full walkthrough: {LINK}",
    instructions: [
      "Go to medium.com and create a free account. Add a photo and a bio about {KEYWORDS}.",
      "Write an original 500-800 word article that teaches one useful idea — not a promotional summary of the page.",
      "Place {LINK} once, where it gives the reader a relevant next step, using the description below.",
      "Add tags for {KEYWORDS} and submit to a relevant publication if one accepts the topic.",
      "Publish 1-2 helpful articles this week. Medium pieces that people finish and clap for keep sending traffic.",
    ],
  },
  {
    id: "youtube",
    name: "YouTube",
    type: "Video",
    difficulty: "Medium",
    time: "30 minutes",
    visitors: [90, 650],
    url: "https://www.youtube.com/",
    description:
      "Full resource from this YouTube video: {OFFER_ANGLE} — {LINK}",
    instructions: [
      "Go to youtube.com and create or log into your channel. Add a photo and a short channel description.",
      "Record a short original video that teaches one {KEYWORDS} topic. Lead with the value, not a pitch.",
      "Write a title and description that accurately match the video so it can be found in search.",
      "Place {LINK} in the description (and pinned comment if you use one) using the description below.",
      "Reply to comments. Videos that keep getting replies keep getting recommended and sending visitors.",
    ],
  },
  {
    id: "tiktok",
    name: "TikTok",
    type: "Video",
    difficulty: "Medium",
    time: "20 minutes",
    visitors: [100, 700],
    url: "https://www.tiktok.com/",
    description:
      "More detail than I could fit on TikTok: {OFFER_ANGLE}. Link is in my profile: {LINK}",
    instructions: [
      "Go to tiktok.com and create or log into your account. Use a photo and a bio that mentions {KEYWORDS}.",
      "Record an original short video with one useful takeaway for the {COMMUNITY}. Hook in the first 2 seconds.",
      "Add relevant tags: {HASHTAGS}. Keep the caption about the tip, not a sales pitch.",
      "Add {LINK} to your profile (or the allowed link field) using the description below if your account can show a link.",
      "Post a few times this week and reply to comments. Accounts that teach something useful keep getting recommended.",
    ],
  },
  {
    id: "instagram",
    name: "Instagram",
    type: "Social",
    difficulty: "Medium",
    time: "20 minutes",
    visitors: [70, 500],
    url: "https://www.instagram.com/",
    description:
      "Full guide is in my Instagram bio: {OFFER_ANGLE} {LINK}",
    instructions: [
      "Go to instagram.com and set up a profile with a photo, a bio, and {LINK} in the bio field.",
      "Publish an original post or carousel that teaches one useful idea for the {COMMUNITY}.",
      "Use relevant tags: {HASHTAGS}. Write a caption that helps first and mentions the resource second.",
      "Tell people the full guide is in your bio, and keep {LINK} there so it matches the post.",
      "Post a few times this week and reply to comments. Saved and shared posts keep sending profile visits.",
    ],
  },
  {
    id: "x",
    name: "X",
    type: "Social",
    difficulty: "Easy",
    time: "10 minutes",
    visitors: [50, 350],
    url: "https://x.com/",
    description:
      "Wrote this up as {OFFER_ANGLE} if anyone on X wants the longer version: {LINK}",
    instructions: [
      "Go to x.com and set up a profile with a photo, a bio about {KEYWORDS}, and {LINK} in the website field.",
      "Write a concise, useful point about {KEYWORDS}. Teach one idea in the post itself.",
      "Reply thoughtfully to 5-10 related conversations instead of dropping a link into every thread.",
      "Share {LINK} only when it adds context the reader asked for, using the description below.",
      "Stay active a few times this week. Replies and useful threads keep sending profile visits over time.",
    ],
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    type: "Social",
    difficulty: "Medium",
    time: "15 minutes",
    visitors: [40, 300],
    url: "https://www.linkedin.com/",
    description:
      "I put together {OFFER_ANGLE} for people working on {KEYWORDS}: {LINK}",
    instructions: [
      "Go to linkedin.com and complete your profile with a photo, headline, and About section covering {KEYWORDS}.",
      "Share a professional insight or short how-to related to {KEYWORDS}. Write it as advice, not an ad.",
      "Use a clear, factual description of the resource and add {LINK} only where it is relevant to that audience.",
      "Comment on 5 related posts from other people in the {COMMUNITY} so your profile looks active.",
      "Post 1-2 useful updates this week. LinkedIn keeps showing posts that people comment on.",
    ],
  },
  {
    id: "directory",
    name: "Resource Directory Search",
    type: "Directory",
    difficulty: "Easy",
    time: "15 minutes",
    visitors: [20, 150],
    url: "https://www.google.com/search?q={DIRECTORY_QUERY}",
    description:
      "Directory listing: {OFFER_ANGLE} for the {COMMUNITY}. Visit: {LINK}",
    instructions: [
      "Search Google for reputable {DIRECTORY_QUERY} and open 2-3 directories that actually get traffic.",
      "Skip low-quality 'submit to 1,000 sites' lists. If the directory looks spammy, leave it.",
      "Create an account if required and fill every field: title, category, and the description below.",
      "Submit {LINK} with an accurate title that matches the page. Inaccurate listings get rejected or dropped.",
      "Recheck the listing in a few days. If it is approved, the directory can send visitors for months with no extra work.",
    ],
  },
  {
    id: "blog-outreach",
    name: "Relevant Blog Outreach",
    type: "Blog",
    difficulty: "Medium",
    time: "20 minutes",
    visitors: [30, 200],
    url: "https://www.google.com/search?q={KEYWORDS}+blogs",
    description:
      "I thought your {COMMUNITY} readers might find {OFFER_ANGLE} useful as a follow-up: {LINK}",
    instructions: [
      "Search for current {KEYWORDS} blogs and open a recent article that serves the {COMMUNITY}.",
      "Read it fully, then leave a specific comment or email the author with one useful addition — not a generic pitch.",
      "Offer {LINK} only if it is genuinely useful to their readers, using the description below.",
      "If the site accepts guest posts, pitch one original outline instead of asking them to 'add your link'.",
      "Follow up once if they reply. A single useful mention on a relevant blog can send visitors for a long time.",
    ],
  },
];

const DEMAND_MULTIPLIERS = {
  low: 0.7,
  medium: 1,
  high: 1.5,
} as const;

export const PLATFORM_PLAYBOOK_COUNT = PLATFORM_PLAYBOOKS.length;

export function interpolateSourceText(
  template: string,
  profile: AutopilotNicheProfile,
  link = "{LINK}"
) {
  return template
    .replaceAll("{LINK}", link)
    .replaceAll("{COMMUNITY}", profile.community)
    .replaceAll("{SUBREDDIT}", profile.subreddit)
    .replaceAll("{HASHTAGS}", profile.hashtags.join(" "))
    .replaceAll("{KEYWORDS}", profile.keywords.join(", "))
    .replaceAll("{DIRECTORY_QUERY}", profile.directoryQuery)
    .replaceAll("{OFFER_ANGLE}", profile.offerAngle);
}

export function buildPlatformSources(
  profile: AutopilotNicheProfile
): TrafficSource[] {
  const multiplier = DEMAND_MULTIPLIERS[profile.demand];

  return PLATFORM_PLAYBOOKS.map((playbook) => {
    const [min, max] = playbook.visitors.map((value) =>
      Math.round(value * multiplier)
    ) as [number, number];

    return {
      id: `${profile.key}-p-${playbook.id}`,
      name: `${playbook.name} — ${profile.label}`,
      niche: profile.label,
      type: playbook.type,
      difficulty: playbook.difficulty,
      traffic: `${min}-${max} visitors/month`,
      time: playbook.time,
      url: interpolateSourceText(playbook.url, profile),
      description: interpolateSourceText(playbook.description, profile),
      instructions: playbook.instructions.map((instruction) =>
        interpolateSourceText(instruction, profile)
      ),
    };
  });
}
