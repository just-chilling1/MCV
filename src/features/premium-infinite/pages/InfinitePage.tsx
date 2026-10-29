'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Zap,
  Search,
  ChevronRight,
  ArrowLeft,
  Image as ImageIcon,
  FileText,
  Link as LinkIcon,
  Send,
  Copy,
  Check,
  Sparkles,
  TrendingUp,
  DollarSign,
  BookOpen,
  X,
  Save,
  Download,
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { useAppStore } from '@/store'
import { ArticleImage } from '@/types'
import GenerationProgress from '@/components/ui/generation-progress'
import EarningsBanner from '@/components/ui/earnings-banner'
import { useScrollOnGenerationComplete } from '@/hooks/use-scroll-on-generation-complete'
import PageHeader from '@/components/ui/page-header'
import { PageContainer } from '@/components/ui/page-container'
import PremiumFeatureVideo from '@/components/ui/premium-feature-video'
import { RECURRING_WEALTH_VIDEO } from '@/lib/training-videos'
import { newId } from '@/lib/id'
import { copyToClipboard } from '@/lib/clipboard'
import { sanitizePostHtml } from '@/features/blog-builder/lib/sanitize-html'
import { useToast } from '@/contexts/ToastContext'

function splitHtmlAroundMid(html: string) {
  const parts = html.split(/(?=<h2\b)/i).filter(Boolean)
  if (parts.length >= 2) {
    const mid = Math.ceil(parts.length / 2)
    return { before: parts.slice(0, mid).join(''), after: parts.slice(mid).join('') }
  }
  const blocks = html.split(/(?=<p\b|<ul\b|<h3\b)/i).filter(Boolean)
  const mid = Math.max(1, Math.ceil(blocks.length / 2))
  return { before: blocks.slice(0, mid).join(''), after: blocks.slice(mid).join('') }
}

function ArticleFigure({
  img,
  label,
}: {
  img: ArticleImage
  label: string
}) {
  return (
    <figure className="overflow-hidden rounded-xl border border-border-dim">
      <img
        src={img.url}
        alt={img.alt || label}
        className="aspect-video w-full object-cover"
        loading="lazy"
      />
      <figcaption className="flex items-center gap-1.5 bg-raised/60 px-3 py-1.5 text-xs text-ink-4">
        <ImageIcon size={12} aria-hidden />
        {label}
      </figcaption>
    </figure>
  )
}

const NICHES = [
  { id: 'health', label: 'Health & Wellness', emoji: '💪', count: 10 },
  { id: 'finance', label: 'Personal Finance', emoji: '💰', count: 10 },
  { id: 'tech', label: 'Tech & Gadgets', emoji: '🔧', count: 10 },
  { id: 'beauty', label: 'Beauty & Skincare', emoji: '✨', count: 10 },
  { id: 'fitness', label: 'Fitness & Weight Loss', emoji: '🏋️', count: 10 },
  { id: 'business', label: 'Online Business', emoji: '🚀', count: 10 },
  { id: 'education', label: 'Education & Courses', emoji: '📚', count: 10 },
  { id: 'travel', label: 'Travel & Lifestyle', emoji: '✈️', count: 10 },
  { id: 'pets', label: 'Pets & Animals', emoji: '🐾', count: 10 },
  { id: 'home', label: 'Home & Garden', emoji: '🏡', count: 10 },
]

interface PrewrittenArticle {
  id: string
  niche: string
  title: string
  seoKeywords: string[]
  suggestedProducts: string[]
  sections: string[]
  content: string
  images: ArticleImage[]
}

function buildArticleContent(title: string, nicheLabel: string, keywords: string[], products: string[]): string {
  const kw0 = keywords[0] || 'this topic'
  const kw1 = keywords[1] || 'related products'
  const kw2 = keywords[2] || 'best options'
  const p0 = products[0] || 'Product A'
  const p1 = products[1] || 'Product B'
  const p2 = products[2] || 'Product C'

  return `<p>If you've been searching for reliable information about <strong>${kw0}</strong>, you're in the right place. With so many options flooding the market in 2025, it can be overwhelming to separate what actually works from what's just clever marketing. This comprehensive guide cuts through the noise and gives you evidence-based recommendations you can trust.</p>

<p>Whether you're completely new to ${nicheLabel.toLowerCase()} or looking to upgrade your current approach, this article covers everything you need to know — from the fundamentals to specific product recommendations that deliver real results. By the end, you'll have a clear action plan and know exactly which products are worth your investment.</p>

<h2>Why ${title.replace(/^(The |How to |Best )/i, '')} Matters More Than Ever</h2>

<p>The landscape of ${nicheLabel.toLowerCase()} has shifted dramatically. Recent studies show that consumers who take the time to research <strong>${kw1}</strong> before purchasing save an average of 40% and report significantly higher satisfaction with their choices. The problem? Most review sites are paid promotions disguised as honest assessments.</p>

<p>What sets this guide apart is that we've spent weeks testing, comparing, and analyzing real user feedback across thousands of reviews. We looked at price-to-performance ratios, long-term reliability, customer support quality, and overall value. The result is a guide you can actually trust when making your decision about <strong>${kw2}</strong>.</p>

<p>Here are the key trends shaping this space right now:</p>
<ul>
<li><strong>Quality over quantity</strong> — consumers are gravitating toward fewer, better products rather than cluttering their lives with mediocre options</li>
<li><strong>Transparency demands</strong> — brands that openly share their ingredients, sourcing, and testing data are winning customer loyalty</li>
<li><strong>Personalization</strong> — one-size-fits-all solutions are being replaced by tailored approaches based on individual needs</li>
</ul>

<h2>Our Research Methodology</h2>

<p>Before diving into the recommendations, it's important to understand how we arrived at our picks. We evaluated over 50 options in the ${nicheLabel.toLowerCase()} category using a weighted scoring system that prioritizes the factors that matter most to real users.</p>

<p>Our evaluation criteria included: effectiveness and performance (35%), value for money (25%), ease of use (20%), customer reviews and reputation (15%), and return policy and guarantees (5%). Products that scored below 7.5 out of 10 were eliminated from consideration.</p>

<h2>Detailed Breakdown: What We Found</h2>

<h3>Key Finding #1: Premium Doesn't Always Mean Better</h3>

<p>One of the most surprising discoveries in our research was that the most expensive option in the <strong>${kw0}</strong> category wasn't the best performer. In fact, our top pick — <strong>${p0}</strong> — sits in the mid-price range while outperforming products that cost twice as much. This is because ${p0} focuses on the fundamentals rather than flashy features that look good on paper but rarely matter in real-world use.</p>

<p>The data consistently showed that products in the $30-$80 range offered the best balance of quality and value. Below that threshold, you start sacrificing reliability. Above it, you're often paying for brand prestige rather than measurable improvements.</p>

<h3>Key Finding #2: User Experience Is the Differentiator</h3>

<p>When two products perform similarly on paper, what separates the winner from the runner-up is almost always user experience. Products like <strong>${p1}</strong> have invested heavily in making their offering intuitive and enjoyable to use, which translates directly to consistency — you'll actually use it regularly instead of abandoning it after a week.</p>

<p>We found that products with simpler designs and clearer instructions had 3x higher long-term satisfaction rates compared to feature-heavy alternatives that require a learning curve.</p>

<h3>Key Finding #3: Community and Support Matter</h3>

<p>The best products in the <strong>${kw2}</strong> space are backed by active communities and responsive customer support. <strong>${p2}</strong> stands out here with their dedicated user community, detailed FAQ section, and average support response time of under 2 hours. When you're investing in your ${nicheLabel.toLowerCase()} journey, knowing that help is available when you need it makes a significant difference.</p>

<h2>Product Comparisons & Our Top 3 Recommendations</h2>

<p>After extensive testing and analysis, here are our top three recommendations for anyone looking for the best <strong>${kw0}</strong> options in 2025. Each product has been personally tested and verified against our rigorous evaluation criteria.</p>

<h3>#1: ${p0} — Best Overall</h3>

<p><strong>${p0}</strong> earns our top spot for delivering exceptional performance at a reasonable price point. What impressed us most was the consistency — it performed reliably across every test we ran, with no significant drop-off over extended use. The build quality is excellent, the design is intuitive, and customer reviews align closely with our findings.</p>

<p><strong>Why we recommend it:</strong> Best balance of quality, price, and reliability. Perfect for both beginners and experienced users. <a href='#' class='text-bp-blue font-bold underline decoration-2 underline-offset-4 hover:text-bp-blue transition-all'>[YOUR LINK HERE]</a></p>

<h3>#2: ${p1} — Best Premium Option</h3>

<p><strong>${p1}</strong> is the choice for those who want the absolute best and don't mind paying a premium. It edges out ${p0} in raw performance by about 10-15%, with superior materials and a more polished experience. If ${nicheLabel.toLowerCase()} is a priority for you and budget isn't the primary concern, this is the one to go with.</p>

<p><strong>Why we recommend it:</strong> Top-tier performance and premium experience for serious enthusiasts. <a href='#' class='text-bp-blue font-bold underline decoration-2 underline-offset-4 hover:text-bp-blue transition-all'>[YOUR LINK HERE]</a></p>

<h3>#3: ${p2} — Best Budget Pick</h3>

<p><strong>${p2}</strong> proves that you don't need to break the bank to get a solid product. At roughly half the price of our top pick, it delivers about 80% of the performance — which for most people is more than enough. It's an ideal entry point if you're just starting your journey with <strong>${kw1}</strong> and want to test the waters before committing to a higher investment.</p>

<p><strong>Why we recommend it:</strong> Outstanding value for money, perfect for beginners. <a href='#' class='text-bp-blue font-bold underline decoration-2 underline-offset-4 hover:text-bp-blue transition-all'>[YOUR LINK HERE]</a></p>

<h2>Pros & Cons at a Glance</h2>

<p>Here's a quick comparison to help you decide:</p>

<p><strong>${p0} (Best Overall):</strong></p>
<ul>
<li>✅ Excellent performance-to-price ratio</li>
<li>✅ Intuitive design, easy to use</li>
<li>✅ Strong customer reviews</li>
<li>❌ Limited color/style options</li>
<li>❌ Shipping can take 5-7 days</li>
</ul>

<p><strong>${p1} (Premium):</strong></p>
<ul>
<li>✅ Best-in-class performance</li>
<li>✅ Premium materials and build</li>
<li>✅ Fast shipping and great support</li>
<li>❌ Significantly higher price point</li>
<li>❌ May be overkill for casual users</li>
</ul>

<p><strong>${p2} (Budget):</strong></p>
<ul>
<li>✅ Very affordable</li>
<li>✅ Solid performance for the price</li>
<li>✅ Great for beginners</li>
<li>❌ Fewer features than premium options</li>
<li>❌ Build quality is adequate but not exceptional</li>
</ul>

<h2>Our #1 Pick: ${p0}</h2>

<p>If we had to choose just one product to recommend, it would be <strong>${p0}</strong> without hesitation. It strikes the perfect balance between performance, price, and usability that most people are looking for when researching <strong>${kw0}</strong>. The overwhelmingly positive user reviews confirm what our testing showed — this is a product that consistently delivers on its promises.</p>

<p><strong>Ready to get started?</strong> <a href='#' class='text-bp-blue font-bold underline decoration-2 underline-offset-4 hover:text-bp-blue transition-all'>[YOUR LINK HERE]</a></p>

<h2>Conclusion: Your Next Step</h2>

<p>Choosing the right product in the <strong>${kw2}</strong> space doesn't have to be complicated. If you want the best overall value, go with <strong>${p0}</strong>. If budget is your primary concern, <strong>${p2}</strong> is a solid starting point. And if you want the absolute best regardless of price, <strong>${p1}</strong> won't disappoint.</p>

<p>The most important thing is to take action. Research paralysis is real — don't let the pursuit of the "perfect" option prevent you from getting started. Any of our three recommended products will serve you well, and you can always upgrade later as your needs evolve.</p>

<p>We hope this guide has helped clarify your options for <strong>${kw0}</strong>. If you found it valuable, consider sharing it with someone who's also navigating this space. And if you have questions or want personalized advice, drop a comment below — we read and respond to every one.</p>

<p><em>Keywords: ${keywords.join(', ')}</em></p>`
}

function getArticles(): PrewrittenArticle[] {
  const data: Record<string, { titles: string[]; keywords: string[][]; products: string[][] }> = {
    health: {
      titles: [
        'The Ultimate Guide to Immune-Boosting Supplements in 2025',
        '7 Science-Backed Vitamins That Actually Work (Reviewed)',
        'How to Build a Morning Wellness Routine That Sticks',
        'Best Probiotics for Gut Health: A Comprehensive Review',
        'Why Magnesium Is the Most Underrated Supplement (And Which to Buy)',
        'The Complete Guide to Intermittent Fasting for Beginners',
        'Top 10 Superfoods That Are Worth the Hype',
        'How to Naturally Lower Blood Pressure: Evidence-Based Methods',
        'The Truth About Collagen Supplements: Do They Really Work?',
        'Sleep Optimization: The Supplements and Tools That Changed My Life',
      ],
      keywords: [
        ['immune supplements', 'best vitamins immunity', 'supplement guide'],
        ['best vitamins', 'science backed supplements', 'vitamin review'],
        ['morning routine wellness', 'healthy habits', 'daily routine'],
        ['best probiotics', 'gut health supplements', 'probiotic review'],
        ['magnesium supplement', 'best magnesium', 'magnesium benefits'],
        ['intermittent fasting guide', 'fasting for beginners', 'IF diet'],
        ['superfoods list', 'healthy superfoods', 'nutrition guide'],
        ['lower blood pressure naturally', 'natural BP remedies', 'heart health'],
        ['collagen supplements review', 'do collagen supplements work', 'best collagen'],
        ['sleep supplements', 'better sleep', 'sleep optimization tools'],
      ],
      products: [
        ['Vitamin C complex', 'Zinc tablets', 'Elderberry extract'],
        ['Multivitamin packs', 'Vitamin D3', 'Omega-3 capsules'],
        ['Wellness journal', 'Morning routine planner', 'Essential oils kit'],
        ['Probiotic supplements', 'Prebiotic fiber', 'Gut health test kits'],
        ['Magnesium glycinate', 'Magnesium spray', 'Electrolyte packets'],
        ['Fasting timer app', 'Meal prep containers', 'Electrolyte powder'],
        ['Superfood powder blends', 'Acai supplements', 'Spirulina tablets'],
        ['Blood pressure monitors', 'Herbal tea blends', 'Beet root powder'],
        ['Marine collagen powder', 'Collagen capsules', 'Bone broth powder'],
        ['Melatonin gummies', 'Blue light glasses', 'Weighted blankets'],
      ],
    },
    finance: {
      titles: ['How to Start Investing with Just $100: A Complete Beginner\'s Guide','The 5 Best Budgeting Apps That Will Save You Thousands','Passive Income 101: 7 Realistic Ways to Earn Money While You Sleep','Credit Score Secrets: How I Raised Mine 200 Points in 6 Months','The Best High-Yield Savings Accounts Compared (2025)','Cryptocurrency for Beginners: What to Buy and How to Start','How to Pay Off Debt Fast: The Strategy That Saved Me $40K','Side Hustles That Actually Pay: 10 Ideas You Can Start This Week','Retirement Planning in Your 30s: The Guide I Wish I Had','Best Cashback Credit Cards: Maximize Every Dollar You Spend'],
      keywords: [['investing for beginners','start investing $100','investment guide'],['best budgeting apps','money saving apps','budget tracker'],['passive income ideas','make money while sleeping','income streams'],['improve credit score','raise credit score fast','credit tips'],['high yield savings','best savings accounts','HYSA comparison'],['crypto for beginners','buy cryptocurrency','crypto guide'],['pay off debt fast','debt payoff strategy','debt free journey'],['best side hustles','make extra money','side income ideas'],['retirement planning 30s','401k guide','retirement savings'],['best cashback cards','credit card rewards','cashback comparison']],
      products: [['Investment courses','Stock market books','Brokerage accounts'],['Budgeting app subscriptions','Financial planners','Expense trackers'],['Online course platforms','Print on demand tools','Domain hosting'],['Credit monitoring services','Credit repair tools','Financial books'],['Savings account offers','CD ladders','Money market accounts'],['Crypto wallets','Trading platforms','Crypto courses'],['Debt payoff planners','Consolidation loans','Financial coaching'],['Freelance platforms','Side hustle toolkits','Business starter kits'],['Retirement calculators','IRA accounts','Financial planning books'],['Credit card offers','Reward optimization tools','Travel credit cards']],
    },
    tech: {
      titles: ['Best Laptops for Remote Workers in 2025: Complete Buying Guide','Smart Home Essentials: 10 Devices That Are Actually Worth It','The Best Noise-Cancelling Headphones Compared (Budget to Premium)','How to Set Up a Home Office That Boosts Productivity','Top 10 Must-Have iPhone Accessories You\'re Missing Out On','Best VPN Services Reviewed: Protect Your Privacy in 2025','The Ultimate Streaming Setup: Cameras, Mics, and Lights','Robot Vacuums Ranked: Which One Cleans Best for the Price?','Best Portable Chargers and Power Banks: Never Run Out Again','AI Tools That Will Save You 10 Hours a Week (Tried and Tested)'],
      keywords: [['best laptops remote work','laptop buying guide','work from home laptop'],['smart home devices','best smart gadgets','home automation'],['noise cancelling headphones','best headphones','headphone review'],['home office setup','productivity desk','work from home gear'],['best iPhone accessories','iPhone gadgets','phone accessories'],['best VPN services','VPN comparison','online privacy'],['streaming setup guide','best webcam','content creator gear'],['best robot vacuum','robot vacuum review','automated cleaning'],['best portable charger','power bank review','travel charger'],['best AI tools','AI productivity','AI automation tools']],
      products: [['MacBook Air','ThinkPad X1','Laptop stands'],['Smart speakers','Smart bulbs','Smart plugs'],['Sony WH-1000XM5','AirPods Pro','Budget earbuds'],['Standing desks','Monitor arms','Ergonomic chairs'],['MagSafe chargers','Phone grips','Screen protectors'],['NordVPN','ExpressVPN','Surfshark'],['Webcams','USB microphones','Ring lights'],['Roomba','Roborock','Ecovacs'],['Anker power banks','Solar chargers','USB-C hubs'],['ChatGPT Plus','Jasper','Notion AI']],
    },
    beauty: {
      titles: ['The 10-Step Skincare Routine That Transformed My Skin','Best Retinol Products for Every Skin Type (Dermatologist-Approved)','How to Build a Minimalist Makeup Kit That Does It All','Sunscreen Guide: The Products Dermatologists Actually Use','Anti-Aging Skincare on a Budget: Drugstore Products That Work','The Best Hair Growth Products That Deliver Real Results','Clean Beauty Brands Worth Switching To in 2025','How to Get Glass Skin: The Korean Skincare Method Explained','Best Under-Eye Products for Dark Circles and Puffiness','The Ultimate Guide to Chemical Exfoliants (AHA, BHA, PHA)'],
      keywords: [['skincare routine','best skincare products','10 step skincare'],['best retinol','retinol for beginners','anti aging retinol'],['minimalist makeup','essential makeup products','makeup kit'],['best sunscreen face','SPF guide','dermatologist sunscreen'],['anti aging drugstore','budget skincare','affordable anti aging'],['hair growth products','best hair serum','hair loss treatment'],['clean beauty brands','natural skincare','non toxic beauty'],['glass skin routine','Korean skincare','dewy skin how to'],['under eye treatment','dark circle cream','eye cream best'],['chemical exfoliant guide','AHA BHA','exfoliating acids']],
      products: [['Cleanser sets','Serum bundles','Moisturizer packs'],['Retinol serums','Retinoid creams','Night treatments'],['Foundation','Concealer','Setting spray'],['SPF 50 sunscreens','Tinted moisturizers','UV protection'],['CeraVe products','The Ordinary serums','Neutrogena line'],['Hair growth serums','Biotin supplements','Scalp treatments'],['Clean foundation','Organic moisturizer','Natural lip products'],['Essence toners','Sheet masks','Hydrating mists'],['Eye creams','Eye patches','Cooling rollers'],['AHA toners','BHA serums','PHA pads']],
    },
    fitness: {
      titles: ['The Best Home Gym Equipment for Under $500','How to Lose 20 Pounds Without a Gym Membership','Protein Powders Ranked: The Best (and Worst) Options in 2025','The 30-Day Workout Plan for Complete Beginners','Best Fitness Trackers Compared: Which One Is Right for You?','Meal Prep for Weight Loss: A Full Week of Recipes and Plans','Running Shoes Guide: How to Pick the Perfect Pair','The Science of Building Muscle After 40','Best Pre-Workout Supplements That Actually Boost Performance','Yoga for Beginners: Equipment, Apps, and Programs Reviewed'],
      keywords: [['home gym equipment','best home gym','budget gym setup'],['lose weight no gym','weight loss at home','home workouts'],['best protein powder','protein comparison','whey protein review'],['beginner workout plan','30 day fitness','exercise for beginners'],['best fitness tracker','fitness watch comparison','activity tracker'],['meal prep weight loss','healthy meal prep','weekly meal plan'],['best running shoes','running shoe guide','shoes for runners'],['build muscle over 40','strength training age','muscle after 40'],['best pre workout','pre workout review','energy supplements'],['yoga for beginners','best yoga mat','yoga equipment guide']],
      products: [['Adjustable dumbbells','Resistance bands','Pull-up bars'],['Yoga mats','Jump ropes','Workout apps'],['Whey protein','Plant protein','Protein bars'],['Workout programs','Fitness journals','Exercise guides'],['Apple Watch','Fitbit','Garmin watches'],['Meal prep containers','Kitchen scales','Cookbooks'],['Nike running shoes','Brooks','ASICS'],['Creatine','Testosterone boosters','Recovery supplements'],['Pre-workout powder','Energy drinks','Beta-alanine'],['Yoga mats','Yoga blocks','Online yoga subscriptions']],
    },
    business: {
      titles: ['How to Start an Online Business in 2025: The Complete Roadmap','Best Email Marketing Platforms for Small Businesses (Compared)','Dropshipping vs Print on Demand: Which Model Makes More Money?','The Ultimate Guide to Affiliate Marketing for Beginners','Best Website Builders for Non-Technical Entrepreneurs','How to Create and Sell Digital Products (Step-by-Step)','Social Media Management Tools That Save Hours Per Week','The Best CRM Software for Small Business Owners','How I Built a 6-Figure Blog in 18 Months (Exact Blueprint)','SEO Tools Every Online Business Needs (Free and Paid)'],
      keywords: [['start online business','online business ideas','internet business'],['email marketing platforms','best email tool','email automation'],['dropshipping vs POD','ecommerce comparison','online store models'],['affiliate marketing guide','affiliate for beginners','make money affiliate'],['best website builders','create website easy','business website'],['sell digital products','digital product ideas','online products'],['social media tools','scheduling tools','social management'],['best CRM','small business CRM','customer management'],['start a blog','blogging for money','profitable blog'],['SEO tools','best SEO software','keyword research tools']],
      products: [['Business courses','Domain registrars','Hosting plans'],['Mailchimp','ConvertKit','ActiveCampaign'],['Shopify plans','Printful','Oberlo alternatives'],['Affiliate networks','Link tracking tools','Affiliate courses'],['Wix','Squarespace','WordPress themes'],['Gumroad','Teachable','Canva Pro'],['Buffer','Hootsuite','Later'],['HubSpot','Salesforce','Zoho CRM'],['Hosting plans','WordPress themes','SEO courses'],['Ahrefs','SEMrush','Ubersuggest']],
    },
    education: {
      titles: ['Best Online Learning Platforms Compared: Which One Is Worth It?','How to Learn Any Skill in 30 Days (Proven Method)','The Best Coding Bootcamps for Career Changers in 2025','Top 10 Productivity Apps Every Student Needs','How to Build a Second Income with Online Courses You Create','Speed Reading Techniques That Actually Work (Tools Included)','The Best Language Learning Apps Reviewed and Ranked','Study Tools and Apps That Top Students Swear By','How to Get Certified in High-Demand Skills Without a Degree','Best Books for Self-Education: The Ultimate Reading List'],
      keywords: [['best online learning','online courses comparison','learning platforms'],['learn new skill fast','self learning method','skill development'],['best coding bootcamps','learn to code','career change tech'],['student productivity apps','study apps','organization tools'],['create online course','sell courses online','course creator'],['speed reading','read faster','reading techniques'],['language learning apps','best language app','learn language online'],['study tools','flashcard apps','note taking apps'],['online certifications','professional certificates','upskill online'],['best self help books','learning books','self education reading']],
      products: [['Coursera','Udemy','Skillshare'],['Learning journals','Habit trackers','Online courses'],['Bootcamp subscriptions','Code editors','Coding books'],['Notion','Todoist','Forest app'],['Teachable','Thinkific','Kajabi'],['Speed reading apps','Kindle','Book summaries'],['Duolingo Plus','Babbel','Rosetta Stone'],['Anki','Quizlet Plus','GoodNotes'],['Google certificates','LinkedIn Learning','edX courses'],['Book bundles','Audiobook subscriptions','Reading lists']],
    },
    travel: {
      titles: ['Best Travel Credit Cards for Free Flights and Hotels','How to Travel the World on $50 a Day (Complete Budget Guide)','The Best Travel Gear and Accessories for 2025','Digital Nomad Guide: Best Countries to Work From Remotely','Best Travel Insurance Plans Compared (Don\'t Skip This)','Packing Like a Pro: The Minimalist Travel Checklist','How to Find Cheap Flights Every Time (My Exact Strategy)','Best Luggage Sets Reviewed: Carry-On to Checked Bags','Travel Photography Guide: Gear, Settings, and Tips','The Best Travel Apps That Will Save You Time and Money'],
      keywords: [['travel credit cards','free flights card','travel rewards'],['budget travel guide','travel cheap','backpacking budget'],['best travel gear','travel accessories','packing essentials'],['digital nomad countries','remote work abroad','work from anywhere'],['best travel insurance','travel insurance comparison','trip protection'],['packing checklist','minimalist packing','travel packing tips'],['cheap flights','flight deals','save on airfare'],['best luggage','carry on suitcase','luggage review'],['travel photography','best travel camera','photo tips'],['travel apps','best apps travelers','travel planning tools']],
      products: [['Chase Sapphire','Amex Platinum','Capital One Venture'],['Hostel booking','Budget airlines','Travel guides'],['Packing cubes','Travel adapters','Portable chargers'],['Co-working spaces','VPN services','Remote work tools'],['World Nomads','SafetyWing','Allianz Travel'],['Compression bags','Travel bottles','Toiletry bags'],['Google Flights','Skyscanner','Scott\'s Cheap Flights'],['Away luggage','Samsonite','Osprey backpacks'],['Sony cameras','GoPro','DJI drones'],['Google Maps','TripIt','Hopper']],
    },
    pets: {
      titles: ['Best Dog Food Brands Reviewed by Veterinarians','How to Train Your Puppy in 7 Days (Positive Reinforcement Guide)','The Best Cat Litter Options: Odor Control, Clumping, and Eco-Friendly','Top 10 Must-Have Products for New Dog Owners','Best Pet Insurance Plans Compared: Is It Worth It?','How to Keep Your Pet Healthy on a Budget','The Best Interactive Toys to Keep Your Dog Entertained','Raw Diet for Dogs: Benefits, Risks, and Best Products','Best Flea and Tick Prevention Products That Actually Work','How to Travel with Pets: Carriers, Tips, and Essentials'],
      keywords: [['best dog food','vet recommended dog food','dog food review'],['puppy training guide','train puppy fast','dog training tips'],['best cat litter','cat litter review','odor control litter'],['new dog owner essentials','dog supplies list','puppy starter kit'],['best pet insurance','pet insurance comparison','dog insurance'],['budget pet care','affordable pet products','cheap vet care'],['dog toys','interactive pet toys','puzzle toys dogs'],['raw dog food','BARF diet dogs','raw pet food brands'],['flea prevention','best tick treatment','flea and tick products'],['travel with pets','pet carrier','pet travel essentials']],
      products: [['Premium dog food','Grain-free options','Dog food toppers'],['Training treats','Clickers','Puppy pads'],['Clumping litter','Crystal litter','Litter boxes'],['Leashes','Crates','Dog beds'],['Lemonade Pet','Healthy Paws','Embrace'],['Generic medications','Pet supplements','DIY grooming kits'],['Kong toys','Puzzle feeders','Snuffle mats'],['Raw food delivery','Freeze-dried food','Raw food supplements'],['Seresto collars','Frontline','Natural repellents'],['Pet carriers','Car seat covers','Travel water bowls']],
    },
    home: {
      titles: ['Best Air Purifiers for Allergies: Tested and Reviewed','How to Start a Low-Maintenance Garden (Even If You Kill Everything)','The Best Kitchen Gadgets That Are Actually Worth Buying','Smart Thermostat Guide: Save Money and Stay Comfortable','Best Mattresses for Every Sleep Style (2025 Guide)','How to Organize Your Home Like a Minimalist','The Best Water Filters for Clean, Great-Tasting Water','Energy-Saving Products That Pay for Themselves','Best Indoor Plants for Air Quality (And How to Not Kill Them)','The Complete Guide to Home Security Systems'],
      keywords: [['best air purifier','air purifier allergies','HEPA air purifier'],['beginner gardening','low maintenance garden','easy plants'],['best kitchen gadgets','kitchen essentials','cooking tools'],['smart thermostat','best thermostat','save on heating'],['best mattress','mattress review','mattress guide'],['home organization','minimalist home','declutter tips'],['best water filter','water purifier','filtered water'],['energy saving products','save electricity','eco home'],['best indoor plants','air purifying plants','easy houseplants'],['home security systems','best security camera','smart security']],
      products: [['Dyson purifiers','HEPA filters','Air quality monitors'],['Garden tool sets','Raised bed kits','Seed starter kits'],['Instant Pot','Air fryers','Knife sets'],['Nest thermostat','Ecobee','Smart plugs'],['Memory foam mattresses','Hybrid mattresses','Pillows'],['Storage bins','Label makers','Shelf organizers'],['Brita filters','Berkey','Under-sink systems'],['LED bulbs','Smart power strips','Solar chargers'],['Snake plants','Pothos','Plant care kits'],['Ring doorbell','SimpliSafe','Wyze cameras']],
    },
  }

  const sections = ['Introduction & Hook','Why This Matters','Detailed Breakdown','Expert Analysis','Product Comparisons','Pros & Cons','Our Top Pick','Conclusion & CTA']
  const articles: PrewrittenArticle[] = []

  for (const [nicheId, templates] of Object.entries(data)) {
    const nicheLabel = NICHES.find(n => n.id === nicheId)?.label || nicheId
    templates.titles.forEach((title, index) => {
      const artId = `${nicheId}-${index + 1}`
      articles.push({
        id: artId,
        niche: nicheId,
        title,
        seoKeywords: templates.keywords[index],
        suggestedProducts: templates.products[index],
        sections,
        content: buildArticleContent(title, nicheLabel, templates.keywords[index], templates.products[index]),
        images: [
          { id: `${artId}-header`, url: `https://picsum.photos/seed/${artId}-h/800/450`, alt: 'Header Image', section: 'Header Image', position: 'top' as const },
          { id: `${artId}-mid`, url: `https://picsum.photos/seed/${artId}-m/800/450`, alt: 'Mid-Article Image', section: 'Mid-Article Image', position: 'middle' as const },
          { id: `${artId}-end`, url: `https://picsum.photos/seed/${artId}-e/800/450`, alt: 'Conclusion Image', section: 'Conclusion Image', position: 'bottom' as const },
        ],
      })
    })
  }
  return articles
}

const ALL_ARTICLES = getArticles()

export default function InfinitePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { setCurrentArticle } = useAppStore()
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [previewArticle, setPreviewArticle] = useState<PrewrittenArticle | null>(null)
  const [copied, setCopied] = useState(false)
  const [usedArticles, setUsedArticles] = useState<Set<string>>(new Set())
  const [promoLink, setPromoLink] = useState('')
  const [showPortfolioLinks, setShowPortfolioLinks] = useState(false)
  const [linkApplied, setLinkApplied] = useState(false)
  const [showOfferBanner, setShowOfferBanner] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [scrollTargetId, setScrollTargetId] = useState<string | null>(null)
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const affiliateLinks = useAppStore(s => s.affiliateLinks)

  const runGenerationAction = async (action: () => void, delayMs = 4000, scrollTo = 'article-library-results') => {
    if (delayRef.current) clearTimeout(delayRef.current)
    setScrollTargetId(scrollTo)
    setShowOfferBanner(true)
    setIsGenerating(true)
    await new Promise<void>((resolve) => {
      delayRef.current = setTimeout(resolve, delayMs)
    })
    action()
    setIsGenerating(false)
  }

  useEffect(() => {
    return () => {
      if (delayRef.current) clearTimeout(delayRef.current)
    }
  }, [])

  const displayContent = useMemo(() => {
    if (!previewArticle) return ''
    const trimmed = promoLink.trim()
    let safeUrl = ''
    if (trimmed) {
      try {
        const parsed = new URL(trimmed)
        if (parsed.protocol === 'https:') safeUrl = parsed.toString()
      } catch {
        safeUrl = ''
      }
    }
    const withLink = !safeUrl
      ? previewArticle.content
      : previewArticle.content
          .replace(/href='#'/g, `href='${safeUrl}' target='_blank' rel='noopener noreferrer'`)
          .replace(/\[YOUR LINK HERE\]/g, 'Your Promotional Link ✓')
    return sanitizePostHtml(withLink)
  }, [previewArticle, promoLink])

  const filteredArticles = useMemo(() => {
    let items = ALL_ARTICLES
    if (selectedNiche) items = items.filter(a => a.niche === selectedNiche)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      items = items.filter(a => a.title.toLowerCase().includes(q) || a.seoKeywords.some(k => k.toLowerCase().includes(q)))
    }
    return items
  }, [selectedNiche, searchQuery])

  useScrollOnGenerationComplete(
    isGenerating,
    previewArticle ? true : filteredArticles.length > 0,
    scrollTargetId,
  )

  const handleSaveArticle = async (navigateTo: 'saved' | 'publish') => {
    if (!previewArticle) return

    setShowOfferBanner(true)
    setIsGenerating(true)
    await new Promise<void>((resolve) => setTimeout(resolve, 4000))
    setIsGenerating(false)

    const nicheLabel = NICHES.find(n => n.id === previewArticle.niche)?.label || ''
    const articleId = newId()

    const newArticle = {
      id: articleId,
      user_id: '',
      title: previewArticle.title,
      content: displayContent,
      platform: ['linkedin'],
      tone: 'authoritative' as const,
      length: 'long' as const,
      status: 'draft' as const,
      niche: nicheLabel,
      images: previewArticle.images,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    useAppStore.getState().addArticle(newArticle)
    useAppStore.getState().saveArticleImages(articleId, previewArticle.images)
    setCurrentArticle(newArticle)
    setUsedArticles(prev => new Set(prev).add(previewArticle.id))

    try {
      const resp = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newArticle),
      })
      if (!resp.ok) {
        useAppStore.getState().deleteArticle(articleId)
        useAppStore.getState().deleteArticleImages(articleId)
        setCurrentArticle(null)
        setUsedArticles((prev) => {
          const next = new Set(prev)
          next.delete(previewArticle.id)
          return next
        })
        toast('Could not save article. Please try again.', { variant: 'error' })
        return
      }
      const data = await resp.json()
      if (data.article) {
        useAppStore.getState().updateArticle(articleId, { ...data.article, images: previewArticle.images })
        setCurrentArticle({ ...data.article, images: previewArticle.images })
      }
    } catch {
      useAppStore.getState().deleteArticle(articleId)
      useAppStore.getState().deleteArticleImages(articleId)
      setCurrentArticle(null)
      toast('Could not save article. Please try again.', { variant: 'error' })
      return
    }

    if (navigateTo === 'publish') {
      router.push('/publish')
    } else {
      router.push('/dashboard')
    }
  }

  const handleCopyContent = async () => {
    if (!previewArticle) return
    const text = displayContent.replace(/<[^>]*>/g, '')
    await copyToClipboard(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadImages = async () => {
    if (!previewArticle) return
    for (const img of previewArticle.images) {
      try {
        const resp = await fetch(img.url)
        const blob = await resp.blob()
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `${previewArticle.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${img.section.replace(/\s+/g, '-').toLowerCase()}.jpg`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(a.href)
      } catch {}
    }
  }

  // ═══════════════ ARTICLE PREVIEW ═══════════════
  if (previewArticle) {
    const niche = NICHES.find(n => n.id === previewArticle.niche)
    const headerImg =
      previewArticle.images.find((img) => img.position === 'top') || previewArticle.images[0]
    const midImg =
      previewArticle.images.find((img) => img.position === 'middle') || previewArticle.images[1]
    const endImg =
      previewArticle.images.find((img) => img.position === 'bottom') || previewArticle.images[2]
    const { before, after } = splitHtmlAroundMid(displayContent)

    return (
      <PageContainer className="mx-auto max-w-5xl animate-fade-in">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="secondary"
            size="sm"
            className="!h-9 md:!h-9 gap-1.5 px-3 text-sm"
            onClick={() => {
              setPreviewArticle(null)
              setPromoLink('')
              setLinkApplied(false)
              setShowPortfolioLinks(false)
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to library</span>
          </Button>
          <span className="text-xs tabular-nums text-ink-4">
            {previewArticle.images.length} images in layout
          </span>
        </div>

        {isGenerating ? (
          <div className="mb-8">
            <GenerationProgress label="Preparing your article…" />
          </div>
        ) : showOfferBanner ? (
          <div className="mb-8">
            <EarningsBanner />
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <article id="article-preview-result" className="scroll-mt-28 lg:col-span-2">
            <Card className="overflow-hidden p-0">
              {headerImg && (
                <div className="relative">
                  <img
                    src={headerImg.url}
                    alt={headerImg.alt || 'Header'}
                    className="aspect-21/9 w-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-surface to-transparent" />
                  <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-lg bg-black/65 px-2.5 py-1 text-[11px] text-ink backdrop-blur-sm">
                    <ImageIcon size={12} aria-hidden />
                    Header
                  </span>
                </div>
              )}

              <div className="space-y-6 p-5 sm:p-7">
                <header>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge variant="warning">Unlimited</Badge>
                    <Badge variant="default">
                      {niche?.emoji} {niche?.label}
                    </Badge>
                  </div>
                  <h1 className="brand-font text-2xl leading-snug text-ink sm:text-3xl">
                    {previewArticle.title}
                  </h1>
                  <p className="mt-2 text-sm text-ink-4">
                    ~1,500 words · SEO-optimized · Ready to broadcast
                  </p>
                </header>

                <div
                  className="prose prose-invert max-w-none text-sm leading-relaxed text-ink-2"
                  dangerouslySetInnerHTML={{ __html: before }}
                />

                {midImg && <ArticleFigure img={midImg} label="Mid-article" />}

                {after ? (
                  <div
                    className="prose prose-invert max-w-none text-sm leading-relaxed text-ink-2"
                    dangerouslySetInnerHTML={{ __html: after }}
                  />
                ) : null}

                {endImg && <ArticleFigure img={endImg} label="Conclusion" />}
              </div>
            </Card>
          </article>

          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <Card className="border-brass-300/40">
              <div className="mb-3 flex items-center gap-2">
                <LinkIcon size={16} className="text-brass-700" aria-hidden />
                <h3 className="font-semibold text-ink">Your promotional link</h3>
              </div>
              <p className="mb-3 text-xs text-ink-4">
                Paste your link — it replaces every placeholder in the article.
              </p>
              <input
                type="url"
                placeholder="https://your-link.com/ref=…"
                value={promoLink}
                onChange={(e) => {
                  setPromoLink(e.target.value)
                  setLinkApplied(!!e.target.value.trim())
                }}
                className="mb-3 w-full rounded-xl border border-border-dim bg-field px-3 py-2.5 text-sm text-ink placeholder:text-ink-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-500"
              />
              {linkApplied && (
                <div className="mb-3 flex items-center gap-2 text-xs text-success">
                  <Check size={14} aria-hidden />
                  <span>Link applied</span>
                </div>
              )}
              {affiliateLinks.length > 0 && (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowPortfolioLinks(!showPortfolioLinks)}
                    className="flex items-center gap-1 text-xs text-brass-700 transition-colors hover:text-ink"
                  >
                    <ChevronRight
                      size={12}
                      className={`transition-transform ${showPortfolioLinks ? 'rotate-90' : ''}`}
                    />
                    From My Vault ({affiliateLinks.length})
                  </button>
                  {showPortfolioLinks && (
                    <div className="mt-2 max-h-40 space-y-1.5 overflow-y-auto">
                      {affiliateLinks.map((link) => (
                        <button
                          key={link.id}
                          type="button"
                          onClick={() => {
                            void runGenerationAction(() => {
                              setPromoLink(link.link)
                              setLinkApplied(true)
                              setShowPortfolioLinks(false)
                            }, 3500)
                          }}
                          className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                            promoLink === link.link
                              ? 'border-brass-300 bg-brass-100 text-brass-700'
                              : 'border-border-dim bg-surface text-ink-2 hover:border-brass-300/60'
                          }`}
                        >
                          <span className="block truncate font-medium">
                            {link.label || link.link}
                          </span>
                          <span className="block truncate text-ink-4">{link.link}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>

            <Card>
              <h3 className="mb-4 font-semibold text-ink">Article details</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-ink-4">SEO keywords</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {previewArticle.seoKeywords.map((k) => (
                      <span
                        key={k}
                        className="rounded-lg border border-border-dim bg-brass-100 px-2 py-1 text-xs text-brass-700"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-ink-4">Suggested products</p>
                  <div className="mt-2 space-y-2">
                    {previewArticle.suggestedProducts.map((p) => (
                      <div key={p} className="flex items-center gap-2 text-sm text-ink-2">
                        <DollarSign size={14} className="shrink-0 text-brass-700" aria-hidden />
                        <span>{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-ink-4">Quick steps</p>
                  <div className="mt-2 space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                          linkApplied
                            ? 'bg-brass-100 text-success'
                            : 'bg-brass-100 text-warning'
                        }`}
                      >
                        {linkApplied ? '✓' : '1'}
                      </span>
                      <span className="text-ink-2">
                        {linkApplied ? 'Promotional link added' : 'Add your promotional link'}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brass-100 text-[10px] font-bold text-success">
                        ✓
                      </span>
                      <span className="text-ink-2">Header · mid · conclusion images placed</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brass-100 text-[10px] font-bold text-warning">
                        2
                      </span>
                      <span className="text-ink-2">Save & broadcast</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-2 border-t border-border-dim pt-5">
                <Button
                  onClick={() => void handleCopyContent()}
                  variant="secondary"
                  size="sm"
                  className="!h-9 md:!h-9 w-full text-sm"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copied ? 'Copied!' : 'Copy article'}</span>
                </Button>
                <Button
                  onClick={() => void handleDownloadImages()}
                  variant="secondary"
                  size="sm"
                  className="!h-9 md:!h-9 w-full text-sm"
                >
                  <Download size={16} />
                  <span>Download images</span>
                </Button>
                <Button
                  onClick={() => void handleSaveArticle('saved')}
                  size="sm"
                  className="!h-9 md:!h-9 w-full text-sm"
                >
                  <Save size={16} />
                  <span>Save to My Vault</span>
                </Button>
                <Button
                  onClick={() => void handleSaveArticle('publish')}
                  variant="secondary"
                  size="sm"
                  className="!h-9 md:!h-9 w-full text-sm"
                >
                  <Send size={16} />
                  <span>Save & Broadcast</span>
                </Button>
              </div>
            </Card>
          </aside>
        </div>
      </PageContainer>
    )
  }

  // ═══════════════ LIBRARY VIEW ═══════════════
  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        eyebrow="Unlimited"
        title="Unlimited Authority Articles"
        subtitle="100 complete SEO-optimized articles with images across 10 profitable niches — add your promotional links and broadcast. Every article includes 3 professional images, ready to go."
        actions={<Badge variant="blue">Unlimited</Badge>}
      />

      <PremiumFeatureVideo
        video={{
          ...RECURRING_WEALTH_VIDEO,
          id: '1215530104',
          title: 'Unlimited',
          description:
            'Browse 100 ready-to-broadcast authority articles with images — add your link and ship.',
        }}
        thumbnailSrc="/thumbnails/mcv-thumb-10-unlimited.png"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 animate-fade-in stagger-1">
        {[
          { label: 'Total Articles', value: '100', icon: FileText, color: 'text-bp-blue' },
          { label: 'Images Included', value: '300', icon: ImageIcon, color: 'text-warning' },
          { label: 'Words Each', value: '~1,500', icon: Sparkles, color: 'text-success' },
          { label: 'SEO-Optimized', value: '100%', icon: TrendingUp, color: 'text-brass-700' },
        ].map((stat, i) => (
          <Card key={i} className="text-center py-4">
          <stat.icon size={20} className={`${stat.color.replace('text-bp-blue', 'text-accent-blue').replace('text-brass-700', 'text-accent-blue')} mx-auto mb-2`} />
            <p className="text-xl font-bold text-ink">{stat.value}</p>
            <p className="text-xs text-bp-muted">{stat.label}</p>
          </Card>
        ))}
      </div>

      <Card className="mb-8 animate-fade-in stagger-2 border-accent-blue/20 bg-accent-blue/5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={18} className="text-accent-blue" />
          <h3 className="font-semibold text-ink">How It Works — 3 Simple Steps</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { step: '1', title: 'Pick an Article', desc: 'Browse 100 pre-written articles. Every article is complete, SEO-optimized, and ready to go.', icon: BookOpen },
            { step: '2', title: 'Add Your Links', desc: 'Replace [YOUR LINK HERE] placeholders with your promotional links. Images are already included.', icon: LinkIcon },
            { step: '3', title: 'Broadcast & Earn', desc: 'Post on LinkedIn, Medium, Quora, Reddit, or X. Start earning commissions.', icon: DollarSign },
          ].map(item => (
            <div key={item.step} className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent-blue/15 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-accent-blue">{item.step}</span>
              </div>
              <div>
                <h4 className="font-medium text-ink text-sm mb-1">{item.title}</h4>
                <p className="text-xs text-bp-muted leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {isGenerating ? (
        <div className="mb-8">
          <GenerationProgress label="Loading articles..." />
        </div>
      ) : showOfferBanner ? (
        <div className="mb-8">
          <EarningsBanner />
        </div>
      ) : null}

      <div className="flex flex-col sm:flex-row gap-4 mb-6 animate-fade-in stagger-3">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-bp-muted" />
          <input
            type="text"
            placeholder="Search by title or keyword..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-[rgba(255,255,255,0.05)] border border-bp-border text-ink placeholder-bp-muted text-sm focus:outline-none focus:border-bp-teal transition-colors"
          />
        </div>
        {selectedNiche && (
          <button onClick={() => void runGenerationAction(() => setSelectedNiche(null), 3500)} className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[rgba(20,184,166,0.1)] border border-[rgba(20,184,166,0.3)] text-bp-blue text-sm">
            <span>{NICHES.find(n => n.id === selectedNiche)?.emoji} {NICHES.find(n => n.id === selectedNiche)?.label}</span>
            <X size={14} />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-8 animate-fade-in stagger-3">
        <button
          onClick={() => void runGenerationAction(() => setSelectedNiche(null), 3500)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${!selectedNiche ? 'bg-accent-blue text-ink' : 'bg-[rgba(255,255,255,0.05)] text-bp-muted hover:text-ink border border-bp-border'}`}
        >
          All Niches (100)
        </button>
        {NICHES.map(niche => (
          <button
            key={niche.id}
            onClick={() => void runGenerationAction(() => setSelectedNiche(niche.id), 3800)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedNiche === niche.id ? 'bg-accent-blue text-ink' : 'bg-[rgba(255,255,255,0.05)] text-bp-muted hover:text-ink border border-bp-border'}`}
          >
            {niche.emoji} {niche.label} ({niche.count})
          </button>
        ))}
      </div>

      <div id="article-library-results" className="grid grid-cols-1 md:grid-cols-2 gap-4 scroll-mt-28">
        {filteredArticles.map((article, index) => {
          const niche = NICHES.find(n => n.id === article.niche)
          const isUsed = usedArticles.has(article.id)
          return (
            <Card
              key={article.id}
              className={`animate-fade-in cursor-pointer group hover:border-[rgba(20,184,166,0.3)] transition-all ${isUsed ? 'opacity-70' : ''}`}
              style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}
              onClick={() => void runGenerationAction(() => setPreviewArticle(article), 4200, 'article-preview-result')}
            >
              <div className="mb-3 rounded-lg overflow-hidden h-28 relative">
                <img src={article.images[0]?.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-md bg-black/60 text-[10px] text-ink">
                  <ImageIcon size={10} /> 3 images
                </div>
                <button
                  type="button"
                  aria-pressed={isUsed}
                  className={`absolute top-2 right-2 z-10 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-500 ${
                    isUsed
                      ? 'border-brass-500 bg-brass-500 text-[var(--color-text-on-accent)] hover:bg-[var(--mcv-brand-hover)] hover:border-[var(--mcv-brand-hover)] hover:shadow-[0_0_16px_rgba(212,175,55,0.45)]'
                      : 'border-white/40 bg-black/80 text-ink hover:border-brass-500 hover:bg-brass-500 hover:text-[var(--color-text-on-accent)] hover:shadow-[0_0_16px_rgba(212,175,55,0.35)]'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation()
                    setUsedArticles((prev) => {
                      const next = new Set(prev)
                      if (next.has(article.id)) next.delete(article.id)
                      else next.add(article.id)
                      return next
                    })
                  }}
                >
                  <Check size={13} className={isUsed ? 'opacity-100' : 'opacity-50'} aria-hidden />
                  <span>{isUsed ? 'Used' : 'Mark used'}</span>
                </button>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center shrink-0 text-lg border border-cyan-400/20">
                  {niche?.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-accent-blue/70">{niche?.label}</span>
                    {isUsed && <Badge variant="success" className="text-[9px]">Used</Badge>}
                  </div>
                  <h3 className="font-semibold text-ink text-sm mb-2 line-clamp-2 group-hover:text-accent-blue transition-colors">
                    {article.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-bp-muted">
                    <span className="flex items-center gap-1"><FileText size={11} /> ~1,500 words</span>
                    <span className="flex items-center gap-1"><ImageIcon size={11} /> 3 images</span>
                    <span className="flex items-center gap-1"><TrendingUp size={11} /> SEO</span>
                    <span className="flex items-center gap-1 text-success"><Check size={11} /> Ready</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-bp-muted group-hover:text-accent-blue transition-colors shrink-0 mt-1" />
              </div>
            </Card>
          )
        })}
      </div>

      {filteredArticles.length === 0 && (
        <Card className="text-center py-12">
          <Search size={28} className="text-bp-muted mx-auto mb-3" />
          <p className="text-bp-muted">No articles match your search</p>
          <p className="text-sm text-bp-muted/60 mt-1">Try a different keyword or clear the niche filter</p>
        </Card>
      )}
    </div>
  )
}
