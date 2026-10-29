export type Platform = 'linkedin' | 'medium' | 'quora' | 'reddit' | 'twitter' | 'facebook'

export type ArticleTone = 'authoritative' | 'conversational' | 'bold'

export type ArticleLength = 'short' | 'medium' | 'long'

export type ArticleStatus = 'draft' | 'published'

export interface Article {
  id: string
  user_id: string
  title: string
  content: string
  platform: Platform | string[]
  tone: ArticleTone
  length: ArticleLength
  status: ArticleStatus
  affiliate_link?: string
  niche?: string
  hook?: string
  cta?: string
  images?: ArticleImage[]
  created_at: string
  updated_at: string
}

export interface ArticleImage {
  id: string
  url: string
  alt: string
  section: string
  position: 'top' | 'middle' | 'bottom'
}

export type AffiliatePlatform = 'digistore24' | 'etsy' | 'amazon' | 'ebay'

export interface AffiliateLink {
  id: string
  platform?: AffiliatePlatform
  link: string
  label?: string
  created_at: string
  updated_at: string
}

export type SnippetKind = 'snippet' | 'cta'

export interface Snippet {
  id: string
  user_id: string
  title: string
  body: string
  kind: SnippetKind
  created_at: string
  updated_at: string
}

export type UpsellType = '10x' | 'infinite' | 'automation' | 'protector'

export const ALL_POWERUPS: UpsellType[] = ['10x', 'infinite', 'automation', 'protector']

export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  upsells_unlocked: UpsellType[]
  articles_generated: number
  created_at: string
}

export interface GenerateArticleInput {
  topic: string
  platform?: Platform
  platforms?: string[]
  tone: ArticleTone
  length: ArticleLength
  affiliateLink?: string
  niche?: string
}

export interface GeneratedArticle {
  hook: string
  body: string
  cta: string
  fullContent: string
}

export interface DashboardStats {
  articlesGenerated: number
  savedDrafts: number
  publishedArticles: number
}

export interface UpsellConfig {
  type: UpsellType
  name: string
  description: string
  headline: string
  features: string[]
  icon: string
}

export const UPSELL_CONFIGS: Record<UpsellType, UpsellConfig> = {
  '10x': {
    type: '10x',
    name: 'Social Payouts',
    description: '10 unique Facebook posts from one link',
    headline: '10X Your Social Reach From One Link',
    features: [
      '10 unique high-converting Facebook posts',
      'Different angles for maximum engagement',
      'Copy-paste ready for groups and feeds',
      'Tips for sharing in Facebook communities'
    ],
    icon: 'Zap'
  },
  'infinite': {
    type: 'infinite',
    name: 'Recurring Wealth',
    description: '100 pre-written SEO authority articles',
    headline: '100 Ready-to-Publish Authority Articles',
    features: [
      '100 SEO-optimized articles across 10 niches',
      'Images already generated for every article',
      'Strategic promotional link placement built in',
      'Just add your links and publish for commissions'
    ],
    icon: 'Infinity'
  },
  'automation': {
    type: 'automation',
    name: 'Automated Profits',
    description: '60 free traffic sources with step-by-step instructions',
    headline: 'Post Once. Get Traffic Forever.',
    features: [
      '60 high-quality traffic sources',
      'Step-by-step posting instructions',
      'Niche-organized source library',
      'Copy-paste comment and post templates'
    ],
    icon: 'Bot'
  },
  'protector': {
    type: 'protector',
    name: 'Wealth Protector',
    description: 'Your account security overview',
    headline: 'Your Account Security Overview',
    features: [
      'Real-time security monitoring',
      'Account verification status',
      'Encrypted connection checks',
      'Session and data protection'
    ],
    icon: 'ShieldCheck'
  }
}

export const PLATFORM_INFO: Record<Platform, {
  name: string
  url: string
  icon: string
  tagLabel: string
  instructions: string[]
  seoTips: string[]
}> = {
  linkedin: {
    name: 'LinkedIn',
    url: 'https://www.linkedin.com/feed/',
    icon: 'Linkedin',
    tagLabel: 'Hashtags',
    instructions: [
      'Go to linkedin.com and click "Start a post" or "Write article" at the top of your feed.',
      'For long-form articles, click "Write article" to open the LinkedIn publishing editor — this gives you a headline field, rich text formatting, and a featured image slot.',
      'Paste your article title as the headline. Paste the body content into the editor. Add your header image as the cover photo.',
      'At the bottom of the article editor, add 3-5 relevant hashtags (e.g. #DigitalMarketing #SEO). LinkedIn indexes these for search.',
      'Click "Publish" when ready. After publishing, share the article as a post with a short teaser to boost initial reach.',
    ],
    seoTips: [
      'The first 2-3 lines of your post show before "...see more" — make them a powerful hook.',
      'Post on Tuesday–Thursday between 8-10 AM in your target audience\'s timezone for maximum reach.',
      'Tag relevant people or companies to boost engagement and comments.',
      'Reply to every comment within the first hour — LinkedIn\'s algorithm heavily rewards early engagement.',
      'Use 3-5 hashtags max. Mix broad (#Marketing) with niche (#AffiliateSEO) for best discoverability.',
    ],
  },
  quora: {
    name: 'Quora',
    url: 'https://www.quora.com/',
    icon: 'MessageSquare',
    tagLabel: 'Topics',
    instructions: [
      'Go to quora.com and use the search bar to find questions related to your article topic (e.g. "best way to start affiliate marketing").',
      'Look for questions with lots of followers and recent activity — these are the ones people are actively reading.',
      'Click on the question and hit "Answer". Paste a condensed version of your article — Quora works best with 300-600 word answers, not full articles.',
      'Include your key insights and actionable tips. You can add a link at the end like "I wrote a detailed guide on this here: [link]".',
      'Add your answer to relevant Quora Spaces (communities) for additional reach. You can also create your own posts in Spaces.',
    ],
    seoTips: [
      'Quora answers rank on Google — target questions with high search volume for organic traffic.',
      'Answer the question directly in the first sentence, then expand with detail. Quora penalizes vague intros.',
      'Use formatting: bold key points, bullet lists, and numbered steps. Well-formatted answers get 2-3x more upvotes.',
      'Add your answer to 2-3 relevant Quora Spaces to multiply visibility.',
      'Answer 2-3 related questions with variations of your content — this creates a backlink web that boosts all your answers.',
    ],
  },
  medium: {
    name: 'Medium',
    url: 'https://medium.com/new-story',
    icon: 'FileText',
    tagLabel: 'Tags',
    instructions: [
      'Go to medium.com and click "Write" in the top navigation (or go directly to medium.com/new-story).',
      'Paste your article title as the headline. Paste the full body content below. Medium\'s editor supports rich formatting, code blocks, and embedded media.',
      'Add a featured image by clicking the "+" icon at the top — this image appears as the thumbnail when shared on social media.',
      'Before publishing, click the "..." menu and add up to 5 tags. Choose tags that are actively followed (e.g. "Marketing", "Affiliate Marketing", "Side Hustle").',
      'Submit your story to popular Medium publications in your niche (e.g. "The Startup", "Better Marketing") to get in front of their audience.',
    ],
    seoTips: [
      'Medium articles rank well on Google. Include your target keyword in the title, subtitle, and first paragraph.',
      'Use H2 and H3 headings to break up content — Medium\'s algorithm and Google both favor well-structured articles.',
      'Stories submitted to publications with 10K+ followers get dramatically more reads than self-published ones.',
      'The first 24 hours matter most. Share your article on social media immediately and ask 5-10 people to clap and highlight.',
      'Add 5 tags — mix popular broad tags ("Productivity") with specific niche tags ("Email Marketing Tips").',
    ],
  },
  reddit: {
    name: 'Reddit',
    url: 'https://www.reddit.com/submit',
    icon: 'Hash',
    tagLabel: 'Flair / Keywords',
    instructions: [
      'Find 2-3 subreddits related to your topic. Use redditlist.com or search Reddit for communities (e.g. r/Entrepreneur, r/SEO, r/AffiliateMarketing).',
      'Read each subreddit\'s rules before posting — many have specific formatting requirements, minimum karma thresholds, and no self-promotion rules.',
      'Create a text post (not a link post). Rewrite your article intro as a genuine, helpful post. Reddit users reject anything that feels like marketing.',
      'Share real value upfront in the post body. You can add "Full article here: [link]" at the very end, but only if the subreddit allows it.',
      'Engage with every comment on your post. Genuine, helpful replies build karma and trust, leading to more upvotes and visibility.',
    ],
    seoTips: [
      'Reddit posts rank on Google, especially from high-authority subreddits. Include your target keywords naturally in the post title.',
      'Post timing matters: weekdays 9 AM–12 PM EST gets the most initial upvotes on business subreddits.',
      'Use the subreddit\'s post flair system — posts with flair get better visibility in filtered views.',
      'Write a TL;DR at the bottom summarizing key takeaways in 2-3 bullet points. Reddit users love this.',
      'Cross-post to 2-3 related subreddits (use Reddit\'s built-in crosspost feature) to multiply reach without being flagged as spam.',
    ],
  },
  twitter: {
    name: 'X (Twitter)',
    url: 'https://twitter.com/compose/tweet',
    icon: 'Twitter',
    tagLabel: 'Hashtags',
    instructions: [
      'Go to twitter.com (x.com) and click "Post". For short content, write a compelling tweet thread. For full articles, use the long-form "Articles" feature (available to Premium users).',
      'Turn your article into a thread: Tweet 1 is the hook (biggest insight or bold claim), then break key points into individual tweets (280 chars each).',
      'Add your header image to the first tweet for visual impact — tweets with images get 150% more engagement.',
      'End your thread with a CTA: ask a question, invite replies, or link to the full article. Pin the thread to your profile.',
      'Add 2-3 relevant hashtags in the final tweet of the thread (not every tweet). Over-hashtagging reduces engagement on X.',
    ],
    seoTips: [
      'Tweet threads that get engagement in the first 30 minutes get pushed to wider audiences. Share the link in DMs and ask 5-10 people to like and retweet.',
      'Post threads between 8-10 AM or 5-7 PM in your target timezone. Weekday mornings perform best for business content.',
      'Quote-tweet your own thread with a one-line summary or hot take to re-surface it in the feed.',
      'Use 1-3 hashtags max. X\'s algorithm deprioritizes tweets with more than 3 hashtags.',
      'Engage with replies quickly — threads with active comment sections get boosted by the algorithm.',
    ],
  },
  facebook: {
    name: 'Facebook',
    url: 'https://www.facebook.com/',
    icon: 'Facebook',
    tagLabel: 'Hashtags',
    instructions: [
      'Go to facebook.com and click "What\'s on your mind?".',
      'Paste the generated post content.',
      'Add a relevant image or the product preview if available.',
      'Click "Post" to share with your audience or in relevant groups.',
    ],
    seoTips: [
      'The first sentence is crucial for stopping the scroll.',
      'Use emojis to break up text and add personality.',
      'Post in relevant groups to reach a targeted audience.',
      'Engage with comments to boost the post in the Facebook algorithm.',
    ],
  },
}
