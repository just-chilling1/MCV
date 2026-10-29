import {
  AUTOPILOT_NICHE_PROFILES,
  type AutopilotNicheKey,
} from "./niche-profiles";
import {
  buildCuratedInstructions,
  buildSubmissionDescription,
} from "./instruction-copy";
import type { Difficulty, SourceType, TrafficSource } from "./source-types";

type CuratedDefinition = {
  name: string;
  url: string;
  type: SourceType;
  difficulty?: Difficulty;
  traffic?: string;
  time?: string;
  focus?: string;
};

type CuratedDefinitionTuple = readonly [
  CuratedDefinition,
  CuratedDefinition,
  CuratedDefinition,
  CuratedDefinition,
  CuratedDefinition,
  CuratedDefinition,
  CuratedDefinition,
  CuratedDefinition,
];

const CURATED_DEFINITIONS = {
  health: [
    {
      name: "HealthUnlocked",
      url: "https://healthunlocked.com/",
      type: "Forum",
      focus: "the condition communities that match your topic — start with questions people are already asking",
    },
    {
      name: "PatientsLikeMe",
      url: "https://www.patientslikeme.com/",
      type: "Social",
      focus: "treatment and symptom discussions where members ask for extra reading",
    },
    {
      name: "Wellness.com",
      url: "https://www.wellness.com/",
      type: "Directory",
      focus: "the practitioner or resource directory closest to wellness and preventive health",
    },
    {
      name: "r/Health",
      url: "https://www.reddit.com/r/Health/",
      type: "Social",
      focus: "existing r/Health questions — never a brand-new promotional post",
    },
    {
      name: "HealthBoards",
      url: "https://www.healthboards.com/",
      type: "Forum",
      focus: "the specific condition board that matches your page, not the general lounge",
    },
    {
      name: "The Mighty",
      url: "https://themighty.com/",
      type: "Blog",
      focus: "a first-person story or comment thread about living with the same health challenge",
    },
    {
      name: "Everyday Health",
      url: "https://www.everydayhealth.com/",
      type: "Blog",
      focus: "comments on a closely related article, with one useful takeaway of your own",
    },
    {
      name: "Healthline",
      url: "https://www.healthline.com/health/",
      type: "Blog",
      focus: "a related Healthline article discussion or community comment thread",
    },
  ],
  finance: [
    {
      name: "Bogleheads",
      url: "https://www.bogleheads.org/forum/",
      type: "Forum",
      difficulty: "Medium",
      focus: "Personal Investments or Investing - Help with Personal Investments — this community is strict about spam",
    },
    {
      name: "r/personalfinance",
      url: "https://www.reddit.com/r/personalfinance/",
      type: "Social",
      focus: "the weekly threads and specific money questions, after reading the subreddit rules",
    },
    {
      name: "r/investing",
      url: "https://www.reddit.com/r/investing/",
      type: "Social",
      difficulty: "Medium",
      focus: "beginner or 'what should I read' threads — never a stock-tip style promo",
    },
    {
      name: "Wall Street Oasis",
      url: "https://www.wallstreetoasis.com/forum",
      type: "Forum",
      difficulty: "Medium",
      focus: "Career Advice or Investment Banking discussion threads where people ask for resources",
    },
    {
      name: "BiggerPockets",
      url: "https://www.biggerpockets.com/forums",
      type: "Forum",
      focus: "Getting Started or Real Estate Investing forums, after you add a signature",
    },
    {
      name: "MoneySavingExpert Forum",
      url: "https://forums.moneysavingexpert.com/",
      type: "Forum",
      focus: "Debt-free wannabe, Savings, or Investing boards that match your page",
    },
    {
      name: "r/financialindependence",
      url: "https://www.reddit.com/r/financialindependence/",
      type: "Social",
      difficulty: "Medium",
      focus: "the Daily Thread or beginner questions — this subreddit is very sensitive to promotional links",
    },
    {
      name: "Investopedia",
      url: "https://www.investopedia.com/",
      type: "Blog",
      focus: "a related explainer article where you can add a practical next step in the comments",
    },
  ],
  fitness: [
    {
      name: "Bodybuilding.com Forum",
      url: "https://forum.bodybuilding.com/",
      type: "Forum",
      focus: "Workout Journals, Training, or Supplement sections that match your topic",
    },
    {
      name: "r/fitness",
      url: "https://www.reddit.com/r/fitness/",
      type: "Social",
      difficulty: "Medium",
      focus: "the Daily Simple Questions thread first — new promotional posts are removed quickly",
    },
    {
      name: "r/bodyweightfitness",
      url: "https://www.reddit.com/r/bodyweightfitness/",
      type: "Social",
      focus: "form-check and routine questions where a beginner resource is actually useful",
    },
    {
      name: "MyFitnessPal Community",
      url: "https://community.myfitnesspal.com/",
      type: "Forum",
      traffic: "200-500 visitors/month",
      time: "10 minutes",
      focus: "the Success Stories or Motivation sections",
    },
    {
      name: "T-Nation",
      url: "https://forums.t-nation.com/",
      type: "Forum",
      difficulty: "Medium",
      focus: "Training or Nutrition boards — this community expects evidence, not hype",
    },
    {
      name: "Fitocracy",
      url: "https://www.fitocracy.com/",
      type: "Social",
      focus: "groups and challenges related to the same training goal as your page",
    },
    {
      name: "Running Forum",
      url: "https://www.runningforums.com/",
      type: "Forum",
      focus: "Training, Beginners, or Injury boards that match what your page covers",
    },
    {
      name: "LetsRun",
      url: "https://www.letsrun.com/forum/",
      type: "Forum",
      difficulty: "Medium",
      focus: "the Let's Run board with a useful training answer, not a sales post",
    },
  ],
  marketing: [
    {
      name: "Warrior Forum",
      url: "https://www.warriorforum.com/",
      type: "Forum",
      difficulty: "Medium",
      focus: "the Main Internet Marketing Discussion or Newbie Island boards after you set a signature",
    },
    {
      name: "GrowthHackers",
      url: "https://growthhackers.com/",
      type: "Social",
      difficulty: "Medium",
      focus: "discussions about content, acquisition, or a tactic your page actually explains",
    },
    {
      name: "r/marketing",
      url: "https://www.reddit.com/r/marketing/",
      type: "Social",
      focus: "specific strategy questions — self-promo posts without value get removed",
    },
    {
      name: "r/SEO",
      url: "https://www.reddit.com/r/SEO/",
      type: "Social",
      difficulty: "Medium",
      focus: "beginner SEO questions where a practical resource is a fair extra link",
    },
    {
      name: "Digital Point",
      url: "https://forums.digitalpoint.com/",
      type: "Forum",
      focus: "the Business & Marketing forums, with your URL in the signature",
    },
    {
      name: "Moz Community",
      url: "https://moz.com/community",
      type: "Forum",
      difficulty: "Medium",
      focus: "YouMoz or Q&A threads where you can add a specific, useful SEO answer",
    },
    {
      name: "Indie Hackers",
      url: "https://www.indiehackers.com/",
      type: "Social",
      focus: "group discussions or milestone posts about audience growth, not a cold pitch",
    },
    {
      name: "Product Hunt Discussions",
      url: "https://www.producthunt.com/discussions",
      type: "Social",
      difficulty: "Medium",
      focus: "a discussion about launching or growing a product where your page is a relevant extra",
    },
  ],
  selfhelp: [
    {
      name: "r/selfimprovement",
      url: "https://www.reddit.com/r/selfimprovement/",
      type: "Social",
      difficulty: "Medium",
      focus: "posts asking for a starting plan or habit advice — lead with the advice",
    },
    {
      name: "r/productivity",
      url: "https://www.reddit.com/r/productivity/",
      type: "Social",
      difficulty: "Medium",
      focus: "system or habit questions, after you have commented helpfully a few times",
    },
    {
      name: "Tiny Buddha",
      url: "https://tinybuddha.com/",
      type: "Blog",
      focus: "a related article comment with one specific practice that helped you",
    },
    {
      name: "The Positivity Blog",
      url: "https://www.positivityblog.com/",
      type: "Blog",
      focus: "a recent personal-development post where you can add a useful next step",
    },
    {
      name: "Quora Personal Development",
      url: "https://www.quora.com/topic/Personal-Development",
      type: "Q&A",
      focus: "'how do I start' and 'what should I read' questions in Personal Development",
    },
    {
      name: "7 Cups Community",
      url: "https://www.7cups.com/",
      type: "Social",
      difficulty: "Medium",
      focus: "community forums about growth and coping — be supportive first, promotional never",
    },
    {
      name: "The Change Blog",
      url: "https://www.thechangeblog.com/",
      type: "Blog",
      focus: "a related self-improvement article comment with one concrete takeaway",
    },
    {
      name: "Mind Tools",
      url: "https://www.mindtools.com/",
      type: "Blog",
      focus: "a skills article where a practical resource page is a fair extra for the reader",
    },
  ],
  beauty: [
    {
      name: "MakeupAlley",
      url: "https://www.makeupalley.com/",
      type: "Forum",
      focus: "product reviews and routine threads for the skin type or concern your page covers",
    },
    {
      name: "r/SkincareAddiction",
      url: "https://www.reddit.com/r/SkincareAddiction/",
      type: "Social",
      difficulty: "Medium",
      focus: "the Help thread or routine questions — this subreddit has strict promotional rules",
    },
    {
      name: "r/MakeupAddiction",
      url: "https://www.reddit.com/r/MakeupAddiction/",
      type: "Social",
      difficulty: "Medium",
      focus: "look questions or product-help threads after you have commented a few times",
    },
    {
      name: "Essential Day Spa",
      url: "https://www.essentialdayspa.com/forum/",
      type: "Forum",
      focus: "skincare routine discussions, then add your URL to the signature",
    },
    {
      name: "Beautylish",
      url: "https://www.beautylish.com/",
      type: "Social",
      focus: "community reviews and routine posts that match your page's topic",
    },
    {
      name: "PurseForum Beauty",
      url: "https://forum.purseblog.com/forums/the-beauty-bar.42/",
      type: "Forum",
      focus: "The Beauty Bar threads about routines, products, or skin concerns",
    },
    {
      name: "Temptalia",
      url: "https://www.temptalia.com/",
      type: "Blog",
      focus: "a related review or swatch post where your extra context actually helps a buyer",
    },
    {
      name: "Naturally Curly",
      url: "https://www.naturallycurly.com/",
      type: "Social",
      focus: "hair-care community threads for the curl type or concern your page covers",
    },
  ],
  education: [
    {
      name: "r/learnprogramming",
      url: "https://www.reddit.com/r/learnprogramming/",
      type: "Social",
      difficulty: "Medium",
      focus: "beginner 'what should I learn next' threads — resources are welcome when they answer the question",
    },
    {
      name: "r/studytips",
      url: "https://www.reddit.com/r/studytips/",
      type: "Social",
      focus: "posts asking for a study system, after you share a useful method in your own words",
    },
    {
      name: "Stack Exchange Academia",
      url: "https://academia.stackexchange.com/",
      type: "Q&A",
      focus: "questions about learning, writing, or study skills — answers must stand on their own",
    },
    {
      name: "The Student Room",
      url: "https://www.thestudentroom.co.uk/",
      type: "Forum",
      focus: "study-help or revision boards, with your link in the signature rather than every post body",
    },
    {
      name: "Coursera",
      url: "https://www.coursera.org/",
      type: "Directory",
      focus: "course discussion forums for a class that overlaps your page",
    },
    {
      name: "edX",
      url: "https://www.edx.org/",
      type: "Directory",
      focus: "a course discussion where learners ask for extra practice resources",
    },
    {
      name: "Khan Academy",
      url: "https://www.khanacademy.org/",
      type: "Directory",
      focus: "the community discussion on a related lesson, with one extra practice resource",
    },
    {
      name: "OpenLearn",
      url: "https://www.open.edu/openlearn/",
      type: "Directory",
      focus: "a free course or article discussion that matches your learning topic",
    },
  ],
  business: [
    {
      name: "Indie Hackers",
      url: "https://www.indiehackers.com/",
      type: "Social",
      difficulty: "Medium",
      focus: "group discussions about starting, growing, or validating an offer",
    },
    {
      name: "r/Entrepreneur",
      url: "https://www.reddit.com/r/Entrepreneur/",
      type: "Social",
      difficulty: "Medium",
      focus: "specific 'how do I start X' questions — this subreddit bans cold affiliate posts",
    },
    {
      name: "Hacker News",
      url: "https://news.ycombinator.com/",
      type: "Social",
      difficulty: "Medium",
      focus: "a Show HN or relevant comment thread, with genuine technical or business detail",
    },
    {
      name: "Product Hunt",
      url: "https://www.producthunt.com/",
      type: "Directory",
      difficulty: "Medium",
      focus: "a related product discussion or launch comment, not a duplicate listing of someone else's product",
    },
    {
      name: "Startup Grind",
      url: "https://www.startupgrind.com/",
      type: "Social",
      focus: "community or event discussions where founders ask for practical next steps",
    },
    {
      name: "Founders Network",
      url: "https://foundersnetwork.com/",
      type: "Social",
      difficulty: "Medium",
      focus: "member discussions about early-stage growth — contribute first, link second",
    },
    {
      name: "Small Business Forum",
      url: "https://www.smallbusinessforum.net/",
      type: "Forum",
      focus: "Starting a Business or Marketing boards, with your URL in the signature",
    },
    {
      name: "Alignable",
      url: "https://www.alignable.com/",
      type: "Social",
      focus: "local business groups and recommendation threads that match your offer",
    },
  ],
  travel: [
    {
      name: "FlyerTalk",
      url: "https://www.flyertalk.com/forum/",
      type: "Forum",
      difficulty: "Medium",
      focus: "Mileage Run Deals or Trip Reports only after you have a real travel contribution",
    },
    {
      name: "r/travel",
      url: "https://www.reddit.com/r/travel/",
      type: "Social",
      difficulty: "Medium",
      focus: "itinerary-help posts — this subreddit is strict about blog and affiliate spam",
    },
    {
      name: "r/solotravel",
      url: "https://www.reddit.com/r/solotravel/",
      type: "Social",
      focus: "first-trip or safety questions where a planning resource is actually useful",
    },
    {
      name: "TripAdvisor Forums",
      url: "https://www.tripadvisor.com/Forums",
      type: "Forum",
      focus: "the destination forum for a place you can actually help with, then use a signature if allowed",
    },
    {
      name: "Lonely Planet",
      url: "https://www.lonelyplanet.com/",
      type: "Blog",
      focus: "a destination article or Thorn Tree-style discussion with one practical extra tip",
    },
    {
      name: "Fodor's Travel Talk",
      url: "https://www.fodors.com/community/",
      type: "Forum",
      focus: "destination boards where people are building itineraries",
    },
    {
      name: "Travel Stack Exchange",
      url: "https://travel.stackexchange.com/",
      type: "Q&A",
      focus: "specific how-to travel questions — answers must be complete without the link",
    },
    {
      name: "Nomadic Matt",
      url: "https://www.nomadicmatt.com/",
      type: "Blog",
      focus: "a related destination or budgeting article comment with one extra planning step",
    },
  ],
} as const satisfies Record<AutopilotNicheKey, CuratedDefinitionTuple>;

function buildCuratedSource(
  key: AutopilotNicheKey,
  definition: CuratedDefinition,
  index: number
): TrafficSource {
  const profile = AUTOPILOT_NICHE_PROFILES[key];
  return {
    id: `${key}-c${index + 1}`,
    name: definition.name,
    niche: profile.label,
    type: definition.type,
    difficulty: definition.difficulty ?? "Easy",
    traffic: definition.traffic ?? "50-300 visitors/month",
    time: definition.time ?? "10 minutes",
    url: definition.url,
    description: buildSubmissionDescription({
      type: definition.type,
      name: definition.name,
      offerAngle: profile.offerAngle,
      variant: index,
    }),
    instructions: buildCuratedInstructions({
      type: definition.type,
      name: definition.name,
      url: definition.url,
      community: profile.community,
      focus: definition.focus,
    }),
  };
}

function buildCuratedSourcesByNiche(): Record<
  AutopilotNicheKey,
  readonly TrafficSource[]
> {
  const result = {} as Record<AutopilotNicheKey, readonly TrafficSource[]>;

  for (const key of Object.keys(
    CURATED_DEFINITIONS
  ) as AutopilotNicheKey[]) {
    result[key] = CURATED_DEFINITIONS[key].map((definition, index) =>
      buildCuratedSource(key, definition, index)
    );
  }

  return result;
}

export const CURATED_SOURCES_BY_NICHE = buildCuratedSourcesByNiche();
