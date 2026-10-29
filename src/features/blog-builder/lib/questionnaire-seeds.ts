import type { TemplateStructureId } from "../themes/ready-templates";
import { NICHE_OPTIONS } from "../types";
import type { QuestionnaireCopy, QuestionnaireQuestion } from "./questionnaire-copy";

export type NicheKey = (typeof NICHE_OPTIONS)[number]["value"];

type QuestionSeed = {
  editorial: string;
  conversion: string;
  minimal: string;
  options: { label: string; value: string }[];
};

type NicheSeed = {
  title: { editorial: string; conversion: string; minimal: string };
  subtitle: { editorial: string; conversion: string; minimal: string };
  intro: { editorial: string; conversion: string; minimal: string };
  questions: QuestionSeed[];
  resultHeadline: { editorial: string; conversion: string; minimal: string };
  resultMessage: { editorial: string; conversion: string; minimal: string };
  promoHeadline: { editorial: string; conversion: string; minimal: string };
  promoBullets: string[];
};

const TEMPLATE_PROMO: Record<
  TemplateStructureId,
  { cta: string; subtext: string }
> = {
  editorial: {
    cta: "Explore the recommended resource",
    subtext: "See how this fits your journey — no pressure, just clarity.",
  },
  conversion: {
    cta: "See your matched offer now",
    subtext: "Tap below — takes 30 seconds to check if it's right for you.",
  },
  minimal: {
    cta: "View the recommended option",
    subtext: "One click to review details. No signup required.",
  },
  magazine: {
    cta: "See what we picked for you",
    subtext: "Your personalized pick is one tap away.",
  },
  authority: {
    cta: "Review the expert recommendation",
    subtext: "Evidence-based next step based on your answers.",
  },
  luxury: {
    cta: "Discover your curated recommendation",
    subtext: "A refined match for where you are today.",
  },
};

export const NICHE_SEEDS: Record<NicheKey, NicheSeed> = {
  health: {
    title: {
      editorial: "Your Wellness Story Starts Here",
      conversion: "Wellness Readiness Quiz",
      minimal: "Health & Wellness Check-In",
    },
    subtitle: {
      editorial: "Five thoughtful questions about your habits, energy, and goals.",
      conversion: "Find out what's blocking your best health — in 60 seconds.",
      minimal: "A short assessment of your current wellness priorities.",
    },
    intro: {
      editorial:
        "Everyone's path to feeling better looks different. Share where you are today and we'll point you toward insights — and a resource — that fit your lifestyle.",
      conversion:
        "Answer 5 quick questions. We'll pinpoint your biggest wellness gap and show you a proven next step.",
      minimal:
        "Answer five questions about sleep, nutrition, and daily habits. You'll get a clear summary and one recommended resource.",
    },
    questions: [
      {
        editorial: "When you think about your daily energy, what feels most true lately?",
        conversion: "How's your daily energy right now?",
        minimal: "How would you describe your typical energy level?",
        options: [
          { label: "Steady most days", value: "steady" },
          { label: "Up and down — hard to predict", value: "variable" },
          { label: "Often drained by afternoon", value: "low" },
          { label: "Rebuilding after burnout", value: "recovering" },
        ],
      },
      {
        editorial: "Which part of your wellness routine feels hardest to stay consistent with?",
        conversion: "What's your #1 wellness struggle?",
        minimal: "Which habit is hardest to maintain?",
        options: [
          { label: "Quality sleep", value: "sleep" },
          { label: "Balanced nutrition", value: "nutrition" },
          { label: "Regular movement", value: "movement" },
          { label: "Stress and mental calm", value: "stress" },
        ],
      },
      {
        editorial: "If you could improve one health marker in the next 90 days, what would matter most?",
        conversion: "Pick your top health goal for the next 90 days:",
        minimal: "Primary health focus right now:",
        options: [
          { label: "More energy and vitality", value: "energy" },
          { label: "Better sleep and recovery", value: "sleep" },
          { label: "Healthy weight management", value: "weight" },
          { label: "Less stress, more balance", value: "balance" },
        ],
      },
      {
        editorial: "How do you usually approach new health advice or programs?",
        conversion: "How do you like to take action on health advice?",
        minimal: "Preferred way to follow health guidance:",
        options: [
          { label: "Small daily tweaks", value: "micro" },
          { label: "A structured step-by-step plan", value: "plan" },
          { label: "Expert guidance I can trust", value: "expert" },
          { label: "Tools and trackers that keep me accountable", value: "tools" },
        ],
      },
      {
        editorial: "What would 'feeling your best' actually look like in everyday life?",
        conversion: "What does winning at wellness mean for you?",
        minimal: "Best outcome you want from better wellness:",
        options: [
          { label: "Waking up refreshed", value: "morning" },
          { label: "Fewer aches and more mobility", value: "mobility" },
          { label: "Confidence in my body", value: "confidence" },
          { label: "Calm mind, less anxiety", value: "calm" },
        ],
      },
    ],
    resultHeadline: {
      editorial: "Your wellness profile is ready",
      conversion: "Your wellness gap — identified",
      minimal: "Assessment complete",
    },
    resultMessage: {
      editorial:
        "Your answers paint a clear picture of where you are and what would help most. The next step is finding a resource built for your goals and lifestyle.",
      conversion:
        "Based on your answers, we know exactly what's holding you back. Here's a resource matched to fix it fast.",
      minimal:
        "Your responses point to a specific priority. Below is a recommended resource aligned with that focus.",
    },
    promoHeadline: {
      editorial: "A thoughtful next step for your wellness journey",
      conversion: "The wellness shortcut matched to your answers",
      minimal: "Recommended resource for your focus area",
    },
    promoBullets: [
      "Built for real-life habits, not extreme routines",
      "Clear steps you can start this week",
      "Designed for people at your stage",
    ],
  },

  finance: {
    title: {
      editorial: "Map Your Money Mindset",
      conversion: "Financial Freedom Score",
      minimal: "Personal Finance Snapshot",
    },
    subtitle: {
      editorial: "Reflect on your goals, habits, and relationship with money.",
      conversion: "5 questions to expose what's keeping you from building wealth.",
      minimal: "Five questions about your finances and goals.",
    },
    intro: {
      editorial:
        "Money decisions are deeply personal. Take a moment to reflect on where you stand — we'll share tailored insights and a resource that fits your financial stage.",
      conversion:
        "Quick quiz. We'll spot your biggest money leak and show you a tool to fix it.",
      minimal:
        "Answer five questions about savings, investing, and financial goals. You'll receive a concise summary and one suggested resource.",
    },
    questions: [
      {
        editorial: "How would you describe your current relationship with managing money?",
        conversion: "Where are you with money management today?",
        minimal: "Current money management stage:",
        options: [
          { label: "Just starting to get organized", value: "beginner" },
          { label: "Tracking income but not investing yet", value: "tracking" },
          { label: "Saving regularly, learning to invest", value: "saving" },
          { label: "Actively growing and optimizing wealth", value: "growing" },
        ],
      },
      {
        editorial: "What financial worry keeps showing up for you?",
        conversion: "What's your biggest money pain point?",
        minimal: "Primary financial concern:",
        options: [
          { label: "Not enough emergency savings", value: "emergency" },
          { label: "Debt weighing me down", value: "debt" },
          { label: "Don't know how to invest", value: "investing" },
          { label: "Income feels stuck", value: "income" },
        ],
      },
      {
        editorial: "If your finances improved dramatically in one year, what would change first?",
        conversion: "Pick the win you'd feel first:",
        minimal: "Most important financial outcome:",
        options: [
          { label: "Debt-free and stress-free", value: "debtfree" },
          { label: "Reliable monthly savings", value: "savings" },
          { label: "Growing investment portfolio", value: "portfolio" },
          { label: "More income streams", value: "income" },
        ],
      },
      {
        editorial: "How do you prefer to learn about money and investing?",
        conversion: "How do you want financial advice delivered?",
        minimal: "Preferred learning format:",
        options: [
          { label: "Simple bite-sized lessons", value: "bite" },
          { label: "Step-by-step blueprint", value: "blueprint" },
          { label: "Expert strategies with proof", value: "expert" },
          { label: "Calculators and actionable tools", value: "tools" },
        ],
      },
      {
        editorial: "When you think about your future self financially, what matters most?",
        conversion: "What financial future are you building toward?",
        minimal: "Long-term financial priority:",
        options: [
          { label: "Security for my family", value: "security" },
          { label: "Retire early or work optional", value: "freedom" },
          { label: "Build generational wealth", value: "legacy" },
          { label: "Fund a dream lifestyle", value: "lifestyle" },
        ],
      },
    ],
    resultHeadline: {
      editorial: "Your financial snapshot is ready",
      conversion: "Your money profile — decoded",
      minimal: "Finance snapshot ready",
    },
    resultMessage: {
      editorial:
        "You have clear priorities — the missing piece is often the right framework. Here's a resource aligned with where you are today.",
      conversion:
        "We identified your main blocker. The offer below is built to help you break through it.",
      minimal:
        "Your answers highlight a specific financial focus. Review the recommended resource below.",
    },
    promoHeadline: {
      editorial: "A smart next move for your financial goals",
      conversion: "Your wealth-building shortcut",
      minimal: "Suggested resource for your financial stage",
    },
    promoBullets: [
      "Practical strategies, not get-rich-quick hype",
      "Clear action steps for your level",
      "Built for real budgets and real life",
    ],
  },

  fitness: {
    title: {
      editorial: "Discover Your Training Identity",
      conversion: "Fitness Level & Goal Matcher",
      minimal: "Fitness Profile Quiz",
    },
    subtitle: {
      editorial: "Five questions about how you move, train, and recover.",
      conversion: "Find your perfect training path in under a minute.",
      minimal: "Short quiz on your fitness goals and habits.",
    },
    intro: {
      editorial:
        "Whether you're lacing up for the first time or chasing a new PR, your answers help us understand your training style — and recommend something that actually fits.",
      conversion:
        "5 questions. We'll match your goal, schedule, and experience to the right training approach.",
      minimal:
        "Answer five questions about your workouts, goals, and schedule. You'll get a summary and one training resource recommendation.",
    },
    questions: [
      {
        editorial: "How would you describe your training life right now?",
        conversion: "What's your current fitness level?",
        minimal: "Current training experience:",
        options: [
          { label: "Brand new — ready to start", value: "new" },
          { label: "Work out sometimes, not consistent", value: "casual" },
          { label: "Training 3–4 times a week", value: "regular" },
          { label: "Serious athlete or advanced lifter", value: "advanced" },
        ],
      },
      {
        editorial: "What kind of physical result would make you proudest right now?",
        conversion: "Pick your #1 fitness goal:",
        minimal: "Primary fitness goal:",
        options: [
          { label: "Lose fat and lean out", value: "fatloss" },
          { label: "Build muscle and strength", value: "muscle" },
          { label: "Improve endurance and stamina", value: "endurance" },
          { label: "Move better — flexibility and mobility", value: "mobility" },
        ],
      },
      {
        editorial: "Where do you most enjoy working out?",
        conversion: "Where do you actually train?",
        minimal: "Preferred training environment:",
        options: [
          { label: "Home workouts", value: "home" },
          { label: "Commercial gym", value: "gym" },
          { label: "Outdoors — running, hiking, sports", value: "outdoor" },
          { label: "Mix of home and gym", value: "hybrid" },
        ],
      },
      {
        editorial: "What usually breaks your workout consistency?",
        conversion: "What's killing your gym consistency?",
        minimal: "Biggest barrier to consistency:",
        options: [
          { label: "Not enough time", value: "time" },
          { label: "No clear program to follow", value: "program" },
          { label: "Lost motivation", value: "motivation" },
          { label: "Plateau — not seeing results", value: "plateau" },
        ],
      },
      {
        editorial: "How do you like your training guidance structured?",
        conversion: "How do you want your workouts delivered?",
        minimal: "Preferred workout format:",
        options: [
          { label: "Quick daily sessions under 30 min", value: "quick" },
          { label: "Full weekly program with progression", value: "program" },
          { label: "Video coaching I can follow along", value: "video" },
          { label: "Sport-specific skill development", value: "sport" },
        ],
      },
    ],
    resultHeadline: {
      editorial: "Your training profile is set",
      conversion: "Your fitness match is ready",
      minimal: "Fitness profile complete",
    },
    resultMessage: {
      editorial:
        "You've got real motivation — what helps most is a plan built for your goal, schedule, and experience level.",
      conversion:
        "Your answers lock in the perfect training approach. Here's the resource built for athletes like you.",
      minimal:
        "Your responses indicate a clear training direction. See the matched resource below.",
    },
    promoHeadline: {
      editorial: "A training resource matched to your profile",
      conversion: "Your personalized training shortcut",
      minimal: "Recommended program for your goals",
    },
    promoBullets: [
      "Built for your experience level",
      "Fits real schedules — not 2-hour gym marathons",
      "Progressive plan that adapts as you improve",
    ],
  },

  marketing: {
    title: {
      editorial: "Your Marketing DNA Quiz",
      conversion: "Digital Marketing Readiness Test",
      minimal: "Marketing Skills Assessment",
    },
    subtitle: {
      editorial: "Explore how you attract, convert, and grow online.",
      conversion: "Expose your biggest marketing bottleneck in 5 questions.",
      minimal: "Five questions on your marketing skills and goals.",
    },
    intro: {
      editorial:
        "Every marketer has strengths and blind spots. Share yours and we'll highlight where to focus — plus a resource that matches your growth stage.",
      conversion:
        "Quick 5-question audit. We'll find what's blocking your traffic, leads, or sales.",
      minimal:
        "Answer five questions about your marketing channels and goals. You'll get a summary and one tool recommendation.",
    },
    questions: [
      {
        editorial: "Where are you in your digital marketing journey today?",
        conversion: "What's your marketing experience level?",
        minimal: "Current marketing experience:",
        options: [
          { label: "Just getting started online", value: "new" },
          { label: "Posting but not getting traction", value: "posting" },
          { label: "Getting traffic, struggling to convert", value: "convert" },
          { label: "Scaling campaigns profitably", value: "scaling" },
        ],
      },
      {
        editorial: "Which marketing challenge feels most urgent right now?",
        conversion: "What's your #1 marketing headache?",
        minimal: "Top marketing challenge:",
        options: [
          { label: "Getting consistent traffic", value: "traffic" },
          { label: "Building an email list", value: "email" },
          { label: "Converting visitors to buyers", value: "conversion" },
          { label: "Creating content that performs", value: "content" },
        ],
      },
      {
        editorial: "Which channel do you want to master next?",
        conversion: "Pick the channel you want to dominate:",
        minimal: "Priority marketing channel:",
        options: [
          { label: "Social media organic", value: "social" },
          { label: "Paid ads (Meta, Google, etc.)", value: "paid" },
          { label: "Email and automation", value: "email" },
          { label: "SEO and search traffic", value: "seo" },
        ],
      },
      {
        editorial: "How do you prefer to learn and implement marketing tactics?",
        conversion: "How do you want marketing training delivered?",
        minimal: "Preferred learning approach:",
        options: [
          { label: "Copy-paste templates and swipes", value: "templates" },
          { label: "Video walkthroughs step by step", value: "video" },
          { label: "Live coaching or community", value: "coaching" },
          { label: "Data-driven frameworks", value: "frameworks" },
        ],
      },
      {
        editorial: "What would a marketing win look like for you in the next 90 days?",
        conversion: "Pick your 90-day marketing win:",
        minimal: "Target marketing outcome:",
        options: [
          { label: "First $1K in online sales", value: "sales" },
          { label: "1,000 new email subscribers", value: "subscribers" },
          { label: "Consistent daily leads", value: "leads" },
          { label: "Viral content that builds authority", value: "authority" },
        ],
      },
    ],
    resultHeadline: {
      editorial: "Your marketing profile is ready",
      conversion: "Your growth bottleneck — found",
      minimal: "Marketing assessment complete",
    },
    resultMessage: {
      editorial:
        "You know what you want to achieve — the right system makes all the difference at your stage.",
      conversion:
        "We pinpointed what's holding your marketing back. Here's the tool to fix it.",
      minimal:
        "Your answers reveal a clear marketing priority. Review the recommended resource.",
    },
    promoHeadline: {
      editorial: "A growth resource built for your marketing stage",
      conversion: "Your marketing accelerator — unlocked",
      minimal: "Suggested tool for your marketing goals",
    },
    promoBullets: [
      "Tactics that work in today's algorithms",
      "No fluff — actionable from day one",
      "Designed for solo marketers and small teams",
    ],
  },

  selfhelp: {
    title: {
      editorial: "Your Personal Growth Compass",
      conversion: "Self-Improvement Scorecard",
      minimal: "Personal Development Check-In",
    },
    subtitle: {
      editorial: "Reflect on mindset, habits, and the change you want most.",
      conversion: "5 questions to reveal what's blocking your breakthrough.",
      minimal: "Five questions about your growth goals and habits.",
    },
    intro: {
      editorial:
        "Growth is a journey, not a destination. Take a honest look at where you are — we'll share insights and a resource that supports your next chapter.",
      conversion:
        "Answer fast. We'll identify your biggest mindset or habit blocker and match you with a solution.",
      minimal:
        "Answer five questions about habits, mindset, and goals. You'll receive a summary and one recommended resource.",
    },
    questions: [
      {
        editorial: "Which area of personal growth feels most alive for you right now?",
        conversion: "What area needs the most work?",
        minimal: "Primary growth focus:",
        options: [
          { label: "Confidence and self-belief", value: "confidence" },
          { label: "Productivity and focus", value: "productivity" },
          { label: "Relationships and communication", value: "relationships" },
          { label: "Purpose and direction in life", value: "purpose" },
        ],
      },
      {
        editorial: "What pattern keeps repeating and holding you back?",
        conversion: "What's your recurring bad habit?",
        minimal: "Most persistent obstacle:",
        options: [
          { label: "Procrastination and avoidance", value: "procrastination" },
          { label: "Negative self-talk", value: "selftalk" },
          { label: "Fear of failure or judgment", value: "fear" },
          { label: "Lack of clear goals", value: "goals" },
        ],
      },
      {
        editorial: "How do you usually try to improve yourself?",
        conversion: "How do you typically work on yourself?",
        minimal: "Usual self-improvement method:",
        options: [
          { label: "Reading books and articles", value: "reading" },
          { label: "Courses and structured programs", value: "courses" },
          { label: "Journaling and reflection", value: "journaling" },
          { label: "Coaching or accountability groups", value: "coaching" },
        ],
      },
      {
        editorial: "What would real transformation feel like for you?",
        conversion: "Pick the transformation you want most:",
        minimal: "Desired transformation:",
        options: [
          { label: "Unshakeable daily confidence", value: "confidence" },
          { label: "Discipline that sticks", value: "discipline" },
          { label: "Clarity on my life direction", value: "clarity" },
          { label: "Inner peace and less anxiety", value: "peace" },
        ],
      },
      {
        editorial: "How much time can you honestly invest in growth each week?",
        conversion: "Real talk — how much time do you have?",
        minimal: "Weekly time for personal growth:",
        options: [
          { label: "15 minutes a day", value: "15min" },
          { label: "30–60 minutes a day", value: "30min" },
          { label: "A few focused hours weekly", value: "hours" },
          { label: "Ready for an intensive program", value: "intensive" },
        ],
      },
    ],
    resultHeadline: {
      editorial: "Your growth profile is ready",
      conversion: "Your breakthrough blocker — identified",
      minimal: "Personal development snapshot ready",
    },
    resultMessage: {
      editorial:
        "You're clearly ready for change. The right framework can turn intention into lasting habit.",
      conversion:
        "We found what's been stopping you. Here's the resource to break through.",
      minimal:
        "Your answers highlight a specific growth area. See the recommended resource below.",
    },
    promoHeadline: {
      editorial: "A resource aligned with your growth journey",
      conversion: "Your personal breakthrough tool",
      minimal: "Recommended resource for your growth focus",
    },
    promoBullets: [
      "Evidence-based habits, not empty motivation",
      "Designed for busy people who want real change",
      "Clear daily actions you can start immediately",
    ],
  },

  beauty: {
    title: {
      editorial: "Your Skin & Beauty Blueprint",
      conversion: "Skincare Match Quiz",
      minimal: "Beauty Routine Assessment",
    },
    subtitle: {
      editorial: "Five questions about your skin, routine, and beauty goals.",
      conversion: "Find your perfect skincare approach in 60 seconds.",
      minimal: "Short quiz on your skin type and beauty priorities.",
    },
    intro: {
      editorial:
        "Great skin starts with understanding what yours actually needs. Tell us about your routine and concerns — we'll recommend something tailored to you.",
      conversion:
        "5 quick questions. We'll match your skin type and concerns to the right products and routine.",
      minimal:
        "Answer five questions about your skin and routine. You'll get a summary and one product recommendation.",
    },
    questions: [
      {
        editorial: "How would you describe your skin on a typical day?",
        conversion: "What's your skin type?",
        minimal: "Primary skin type:",
        options: [
          { label: "Dry and tight", value: "dry" },
          { label: "Oily and shiny", value: "oily" },
          { label: "Combination — oily T-zone", value: "combo" },
          { label: "Sensitive and reactive", value: "sensitive" },
        ],
      },
      {
        editorial: "What's your biggest skin or beauty concern right now?",
        conversion: "Pick your #1 skin concern:",
        minimal: "Top skin concern:",
        options: [
          { label: "Acne and breakouts", value: "acne" },
          { label: "Fine lines and aging", value: "aging" },
          { label: "Dark spots and uneven tone", value: "tone" },
          { label: "Dullness and lack of glow", value: "dull" },
        ],
      },
      {
        editorial: "What does your current skincare routine look like?",
        conversion: "How complex is your routine now?",
        minimal: "Current routine complexity:",
        options: [
          { label: "Just cleanser (or nothing)", value: "minimal" },
          { label: "Basic cleanse + moisturize", value: "basic" },
          { label: "Multi-step with serums", value: "multi" },
          { label: "Full regimen with actives", value: "full" },
        ],
      },
      {
        editorial: "What kind of beauty results matter most to you?",
        conversion: "What result do you want fastest?",
        minimal: "Priority beauty outcome:",
        options: [
          { label: "Clear, blemish-free skin", value: "clear" },
          { label: "Hydrated, plump complexion", value: "hydrated" },
          { label: "Brighter, more even skin tone", value: "bright" },
          { label: "Youthful, firm appearance", value: "youthful" },
        ],
      },
      {
        editorial: "How do you prefer to discover and shop for beauty products?",
        conversion: "How do you like buying skincare?",
        minimal: "Preferred shopping approach:",
        options: [
          { label: "Simple routine kits — fewer decisions", value: "kits" },
          { label: "Ingredient-focused recommendations", value: "ingredients" },
          { label: "Trending products with reviews", value: "trending" },
          { label: "Expert-curated regimens", value: "expert" },
        ],
      },
    ],
    resultHeadline: {
      editorial: "Your beauty profile is ready",
      conversion: "Your skincare match — found",
      minimal: "Beauty assessment complete",
    },
    resultMessage: {
      editorial:
        "Your skin has specific needs — generic products rarely deliver. Here's something matched to your profile.",
      conversion:
        "We matched your skin type and concerns. Here's the routine built for you.",
      minimal:
        "Your answers indicate specific skin priorities. Review the recommended product below.",
    },
    promoHeadline: {
      editorial: "A beauty solution tailored to your skin",
      conversion: "Your personalized skincare pick",
      minimal: "Recommended product for your skin profile",
    },
    promoBullets: [
      "Matched to your skin type and concerns",
      "Ingredients that target your goals",
      "Routine you can actually stick to",
    ],
  },

  education: {
    title: {
      editorial: "Your Learning Style Explorer",
      conversion: "Learning Path Finder",
      minimal: "Education & Skills Quiz",
    },
    subtitle: {
      editorial: "Discover how you learn best and what to study next.",
      conversion: "Find the fastest way to master your next skill.",
      minimal: "Five questions about your learning goals and style.",
    },
    intro: {
      editorial:
        "Learning is personal — what works for one person frustrates another. Share your goals and style, and we'll point you toward the right path.",
      conversion:
        "5 questions. We'll match your learning style to the fastest path to mastery.",
      minimal:
        "Answer five questions about skills and learning preferences. You'll get a summary and one course recommendation.",
    },
    questions: [
      {
        editorial: "What kind of skill or knowledge are you most eager to gain?",
        conversion: "What do you want to learn next?",
        minimal: "Primary learning goal:",
        options: [
          { label: "Career-advancing professional skill", value: "career" },
          { label: "Creative hobby or passion", value: "creative" },
          { label: "Language or communication", value: "language" },
          { label: "Tech, coding, or digital tools", value: "tech" },
        ],
      },
      {
        editorial: "What's been your biggest obstacle when trying to learn something new?",
        conversion: "What stops you from finishing courses?",
        minimal: "Biggest learning obstacle:",
        options: [
          { label: "Too busy — no time to study", value: "time" },
          { label: "Material feels too dry or boring", value: "boring" },
          { label: "Overwhelmed by where to start", value: "overwhelm" },
          { label: "No accountability or structure", value: "accountability" },
        ],
      },
      {
        editorial: "How do you absorb new information most effectively?",
        conversion: "How do you learn best?",
        minimal: "Preferred learning format:",
        options: [
          { label: "Short video lessons", value: "video" },
          { label: "Reading with exercises", value: "reading" },
          { label: "Hands-on projects and practice", value: "hands-on" },
          { label: "Live classes with a teacher", value: "live" },
        ],
      },
      {
        editorial: "How much time can you dedicate to learning each week?",
        conversion: "Realistically, how much study time do you have?",
        minimal: "Weekly study time available:",
        options: [
          { label: "30 minutes — micro-learning", value: "micro" },
          { label: "2–3 hours on weekends", value: "weekend" },
          { label: "5+ hours spread across the week", value: "regular" },
          { label: "Intensive — several hours daily", value: "intensive" },
        ],
      },
      {
        editorial: "What would success look like after completing your next course?",
        conversion: "Pick your learning win:",
        minimal: "Target learning outcome:",
        options: [
          { label: "New certification or credential", value: "cert" },
          { label: "Practical skill I use immediately", value: "practical" },
          { label: "Career change or promotion", value: "career" },
          { label: "Personal satisfaction and mastery", value: "mastery" },
        ],
      },
    ],
    resultHeadline: {
      editorial: "Your learning profile is ready",
      conversion: "Your ideal learning path — mapped",
      minimal: "Learning assessment complete",
    },
    resultMessage: {
      editorial:
        "You learn best in a specific way — finding content that matches that style changes everything.",
      conversion:
        "We matched your style and goal. Here's the fastest route to your next skill.",
      minimal:
        "Your answers suggest a clear learning path. See the recommended course below.",
    },
    promoHeadline: {
      editorial: "A learning resource matched to your style",
      conversion: "Your skill-building shortcut",
      minimal: "Recommended course for your goals",
    },
    promoBullets: [
      "Structured for your learning style",
      "Fits your available study time",
      "Practical outcomes, not just theory",
    ],
  },

  business: {
    title: {
      editorial: "Your Entrepreneur Profile",
      conversion: "Business Builder Assessment",
      minimal: "Entrepreneurship Snapshot",
    },
    subtitle: {
      editorial: "Five questions about your venture, goals, and challenges.",
      conversion: "Find what's blocking your business growth in 5 questions.",
      minimal: "Short quiz on your business stage and priorities.",
    },
    intro: {
      editorial:
        "Every entrepreneur faces different hurdles at different stages. Tell us where you are — we'll share insights and a resource built for your journey.",
      conversion:
        "Quick quiz. We'll expose your biggest business bottleneck and show you how to fix it.",
      minimal:
        "Answer five questions about your business. You'll get a summary and one tool recommendation.",
    },
    questions: [
      {
        editorial: "Where is your business journey today?",
        conversion: "What stage is your business at?",
        minimal: "Current business stage:",
        options: [
          { label: "Idea stage — validating concept", value: "idea" },
          { label: "Early startup — first customers", value: "startup" },
          { label: "Growing — scaling revenue", value: "growing" },
          { label: "Established — optimizing operations", value: "established" },
        ],
      },
      {
        editorial: "What's the single biggest challenge keeping you up at night?",
        conversion: "What's your #1 business headache?",
        minimal: "Top business challenge:",
        options: [
          { label: "Finding customers and leads", value: "leads" },
          { label: "Managing cash flow", value: "cashflow" },
          { label: "Building the right team", value: "team" },
          { label: "Standing out from competitors", value: "differentiation" },
        ],
      },
      {
        editorial: "Which business skill do you most want to strengthen?",
        conversion: "Pick the skill you need most:",
        minimal: "Priority skill to develop:",
        options: [
          { label: "Sales and closing deals", value: "sales" },
          { label: "Marketing and brand building", value: "marketing" },
          { label: "Operations and systems", value: "operations" },
          { label: "Leadership and management", value: "leadership" },
        ],
      },
      {
        editorial: "How do you prefer to grow your business knowledge?",
        conversion: "How do you want business advice delivered?",
        minimal: "Preferred learning format:",
        options: [
          { label: "Case studies and real examples", value: "cases" },
          { label: "Step-by-step playbooks", value: "playbooks" },
          { label: "Mentorship and coaching", value: "coaching" },
          { label: "Tools and templates I can use today", value: "tools" },
        ],
      },
      {
        editorial: "What would a business breakthrough look like in the next 6 months?",
        conversion: "Pick your 6-month business win:",
        minimal: "Target business outcome:",
        options: [
          { label: "First profitable month", value: "profit" },
          { label: "Consistent recurring revenue", value: "recurring" },
          { label: "Launch a new product or service", value: "launch" },
          { label: "Double my current revenue", value: "double" },
        ],
      },
    ],
    resultHeadline: {
      editorial: "Your entrepreneur profile is ready",
      conversion: "Your growth blocker — identified",
      minimal: "Business snapshot complete",
    },
    resultMessage: {
      editorial:
        "You're building something real — the right framework at the right stage accelerates everything.",
      conversion:
        "We found what's slowing you down. Here's the tool to break through.",
      minimal:
        "Your answers highlight a specific business priority. Review the recommended resource.",
    },
    promoHeadline: {
      editorial: "A business resource for your current stage",
      conversion: "Your business growth accelerator",
      minimal: "Recommended tool for your business goals",
    },
    promoBullets: [
      "Built for entrepreneurs at your stage",
      "Actionable playbooks, not theory",
      "Proven strategies from real businesses",
    ],
  },

  travel: {
    title: {
      editorial: "Your Travel Style Quiz",
      conversion: "Dream Trip Matcher",
      minimal: "Travel Preferences Assessment",
    },
    subtitle: {
      editorial: "Five questions about how you explore, unwind, and wander.",
      conversion: "Find your perfect travel style in under a minute.",
      minimal: "Short quiz on your travel habits and dream destinations.",
    },
    intro: {
      editorial:
        "Travel means different things to different people — adventure, relaxation, culture, or connection. Tell us your style and we'll recommend something you'll love.",
      conversion:
        "5 questions. We'll match your travel personality to the perfect experience or resource.",
      minimal:
        "Answer five questions about how you travel. You'll get a summary and one travel resource recommendation.",
    },
    questions: [
      {
        editorial: "What kind of traveler are you at heart?",
        conversion: "What's your travel personality?",
        minimal: "Travel style:",
        options: [
          { label: "Adventure seeker — off the beaten path", value: "adventure" },
          { label: "Relaxation lover — beaches and spas", value: "relax" },
          { label: "Culture explorer — museums and history", value: "culture" },
          { label: "Foodie — culinary experiences", value: "foodie" },
        ],
      },
      {
        editorial: "What's your biggest travel planning frustration?",
        conversion: "What kills your travel planning?",
        minimal: "Top travel planning challenge:",
        options: [
          { label: "Finding affordable deals", value: "budget" },
          { label: "Choosing where to go", value: "destination" },
          { label: "Building the perfect itinerary", value: "itinerary" },
          { label: "Finding authentic local experiences", value: "authentic" },
        ],
      },
      {
        editorial: "How do you usually travel?",
        conversion: "How do you typically travel?",
        minimal: "Usual travel format:",
        options: [
          { label: "Solo — my own pace", value: "solo" },
          { label: "Couple's getaway", value: "couple" },
          { label: "Family vacation", value: "family" },
          { label: "Group trips with friends", value: "group" },
        ],
      },
      {
        editorial: "What matters most when you pick a destination?",
        conversion: "Pick your #1 destination priority:",
        minimal: "Top destination factor:",
        options: [
          { label: "Stunning natural scenery", value: "nature" },
          { label: "Rich history and architecture", value: "history" },
          { label: "Vibrant nightlife and entertainment", value: "nightlife" },
          { label: "Wellness and rejuvenation", value: "wellness" },
        ],
      },
      {
        editorial: "What would your ideal next trip feel like?",
        conversion: "Describe your dream next trip:",
        minimal: "Ideal next trip experience:",
        options: [
          { label: "Bucket-list adventure I'll never forget", value: "bucket" },
          { label: "Stress-free escape from daily life", value: "escape" },
          { label: "Deep cultural immersion", value: "immersion" },
          { label: "Luxury experience — worth splurging", value: "luxury" },
        ],
      },
    ],
    resultHeadline: {
      editorial: "Your travel profile is ready",
      conversion: "Your dream trip match — found",
      minimal: "Travel assessment complete",
    },
    resultMessage: {
      editorial:
        "Your travel style is unique — the best recommendations come from understanding what actually excites you.",
      conversion:
        "We matched your travel personality. Here's the resource to plan your next adventure.",
      minimal:
        "Your answers reveal clear travel preferences. See the recommended resource below.",
    },
    promoHeadline: {
      editorial: "A travel resource matched to your wanderlust",
      conversion: "Your personalized travel pick",
      minimal: "Recommended resource for your travel style",
    },
    promoBullets: [
      "Tailored to how you actually travel",
      "Insider tips, not generic guides",
      "Helps you plan smarter and save more",
    ],
  },
};

const TEMPLATE_STYLE_GUIDANCE: Record<TemplateStructureId, string> = {
  editorial:
    "Use narrative, empathetic phrasing. Questions should feel like a thoughtful conversation. Title and intro should be story-driven.",
  conversion:
    "Use punchy, direct phrasing. Questions should be short and action-oriented. Create urgency on the promo page only.",
  minimal:
    "Use plain, precise language. Questions should be concise with zero hype. Keep everything clean and factual.",
  magazine: "Bold, energetic phrasing with vivid language.",
  authority: "Expert, analytical phrasing that builds trust.",
  luxury: "Refined, aspirational phrasing focused on transformation.",
};

export function resolveNicheKey(niche: string): NicheKey {
  const normalized = niche.trim().toLowerCase();
  const byValue = NICHE_OPTIONS.find((n) => n.value === normalized);
  if (byValue) return byValue.value;
  const byLabel = NICHE_OPTIONS.find((n) => n.label.toLowerCase() === normalized);
  if (byLabel) return byLabel.value;
  const partial = NICHE_OPTIONS.find(
    (n) =>
      normalized.includes(n.value) ||
      n.label.toLowerCase().includes(normalized) ||
      normalized.includes(n.label.toLowerCase())
  );
  return partial?.value ?? "health";
}

type TemplateVariantSeed = {
  editorial: string;
  conversion: string;
  minimal: string;
} & Partial<Record<TemplateStructureId, string>>;

function pickTemplateVariant(map: TemplateVariantSeed, toneId: TemplateStructureId): string {
  return map[toneId] ?? map.editorial;
}

export function buildSeededQuestionnaireCopy(input: {
  niche: string;
  nicheKey?: NicheKey;
  productName: string;
  description?: string;
  copyToneId?: TemplateStructureId;
}): QuestionnaireCopy {
  const nicheKey = input.nicheKey ?? resolveNicheKey(input.niche);
  const toneId = input.copyToneId ?? "editorial";
  const seed = NICHE_SEEDS[nicheKey];
  const promo = TEMPLATE_PROMO[toneId];

  const questions: QuestionnaireQuestion[] = seed.questions.map((q, i) => ({
    id: `q${i + 1}`,
    question: pickTemplateVariant(q, toneId),
    options: q.options,
  }));

  return {
    title: pickTemplateVariant(seed.title, toneId),
    subtitle: pickTemplateVariant(seed.subtitle, toneId),
    intro: pickTemplateVariant(seed.intro, toneId),
    questions,
    resultHeadline: pickTemplateVariant(seed.resultHeadline, toneId),
    resultMessage: pickTemplateVariant(seed.resultMessage, toneId),
    promoHeadline: pickTemplateVariant(seed.promoHeadline, toneId),
    promoBody: `${input.productName} is a focused solution for people interested in ${input.niche}.${input.description ? ` ${input.description}` : ""}`,
    promoBullets: seed.promoBullets,
    promoCta: promo.cta,
    promoSubtext: promo.subtext,
  };
}

export function buildQuestionnairePromptContext(input: {
  niche: string;
  nicheKey?: NicheKey;
  copyToneId?: TemplateStructureId;
  templateName?: string;
}): string {
  const nicheKey = input.nicheKey ?? resolveNicheKey(input.niche);
  const toneId = input.copyToneId ?? "editorial";
  const seed = NICHE_SEEDS[nicheKey];
  const seeded = buildSeededQuestionnaireCopy({
    niche: input.niche,
    nicheKey,
    productName: "Example Product",
    copyToneId: toneId,
  });

  const questionExamples = seeded.questions
    .map((q, i) => `  Q${i + 1}: "${q.question}" → options: ${q.options.map((o) => o.label).join(", ")}`)
    .join("\n");

  return `NICHE KEY: ${nicheKey}
NICHE LABEL: ${input.niche}
TEMPLATE STYLE: ${input.templateName ?? toneId} (${TEMPLATE_STYLE_GUIDANCE[toneId]})

REQUIRED TOPICS (cover all five — use niche-specific language, NOT generic self-help):
${seed.questions.map((q, i) => `  ${i + 1}. ${pickTemplateVariant(q, toneId)}`).join("\n")}

EXAMPLE QUESTION STYLE FOR THIS NICHE + TEMPLATE:
${questionExamples}

TITLE STYLE: "${seeded.title}"
INTRO STYLE: "${seeded.intro}"

CRITICAL: Questions MUST be about ${input.niche} specifically — habits, goals, challenges, and preferences unique to this niche.
Do NOT reuse generic questions that could apply to any industry.
Each question must feel written for ${input.niche} readers using the ${toneId} template voice.`;
}
