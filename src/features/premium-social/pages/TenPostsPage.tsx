'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Zap, 
  FileText, 
  TrendingUp,
  Check,
  ArrowRight,
  Facebook,
  Link as LinkIcon,
  Sparkles,
  Copy,
  Loader2,
  Save,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Share2,
  Target,
  BarChart3,
  Lightbulb,
  Clock,
  Users,
  MessageCircle,
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import { useAppStore } from '@/store'
import { AffiliateLink as AffiliateLinkType } from '@/types'
import GenerationProgress from '@/components/ui/generation-progress'
import EarningsBanner from '@/components/ui/earnings-banner'
import { useScrollOnGenerationComplete } from '@/hooks/use-scroll-on-generation-complete'
import PageHeader from '@/components/ui/page-header'
import PremiumFeatureVideo from '@/components/ui/premium-feature-video'
import { SOCIAL_PAYOUTS_VIDEO } from '@/lib/training-videos'
import { newId } from '@/lib/id'
import { copyToClipboard } from '@/lib/clipboard'
import { useToast } from '@/contexts/ToastContext'
import type { ArmedLink } from '@/features/blog-builder/types'

interface GeneratedPost {
  hook: string
  body: string
  cta: string
  angle: string
}

export default function TenXPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { affiliateLinks } = useAppStore()
  
  const [selectedLink, setSelectedLink] = useState('')
  const [linkLabel, setLinkLabel] = useState('')
  const [linkSaved, setLinkSaved] = useState(false)
  const [showPortfolio, setShowPortfolio] = useState(false)

  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([])
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [showOfferBanner, setShowOfferBanner] = useState(false)

  useScrollOnGenerationComplete(isGenerating, generatedPosts.length > 0, 'generated-posts-result')

  const handleGenerate10Posts = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLink.trim()) return

    setShowOfferBanner(true)
    setIsGenerating(true)
    setGeneratedPosts([])
    setError('')

    const delayMs = 4500
    const start = Date.now()

    try {
      const response = await fetch('/api/generate-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          link: selectedLink.trim(),
          linkName: linkLabel.trim() || undefined,
        })
      })

      const elapsed = Date.now() - start
      if (elapsed < delayMs) {
        await new Promise((resolve) => setTimeout(resolve, delayMs - elapsed))
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to generate posts')
      }
      
      const data = await response.json()
      setGeneratedPosts(data.posts || [])
    } catch (err: unknown) {
      console.error('Error generating posts:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate posts. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const getPostText = (post: GeneratedPost) => {
    return `${post.hook}\n\n${post.body}\n\n${post.cta}`
  }

  const handleCopy = (index: number) => {
    const post = generatedPosts[index]
    if (!post) return
    copyToClipboard(getPostText(post))
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const handleCopyAll = () => {
    const allText = generatedPosts.map((post, i) =>
      `--- Post ${i + 1}: ${post.angle} ---\n\n${getPostText(post)}`
    ).join('\n\n\n')
    copyToClipboard(allText)
    setCopiedIndex(-1)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const handleSaveLink = async () => {
    if (!selectedLink.trim()) return
    const url = selectedLink.trim()
    const label = linkLabel.trim() || 'Saved promotion link'
    const newLink: AffiliateLinkType = {
      id: newId(),
      link: url,
      label,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    try {
      const existingRes = await fetch('/api/blog/link-vault', { cache: 'no-store' })
      if (!existingRes.ok) throw new Error('Could not load link vault')
      const existingJson = (await existingRes.json()) as { links?: ArmedLink[] }
      const existing = Array.isArray(existingJson.links) ? existingJson.links : []
      const next: ArmedLink[] = [
        ...existing.filter((l) => l.url !== url),
        { label, url, network: 'other' },
      ]
      const saveRes = await fetch('/api/blog/link-vault', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ links: next }),
      })
      if (!saveRes.ok) throw new Error('Could not save link')
      useAppStore.getState().addAffiliateLink(newLink)
      setLinkSaved(true)
    } catch {
      toast('Could not save link. Please try again.', { variant: 'error' })
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        eyebrow="Social Payouts"
        title="10X Facebook Post Generator"
        subtitle="Generate 10 unique, high-converting Facebook posts from a single link — each with a different angle to maximize reach and clicks."
        actions={<Badge variant="blue">Social Payouts Active</Badge>}
      />

      <PremiumFeatureVideo video={SOCIAL_PAYOUTS_VIDEO} />

      {/* What You Get Panels */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 animate-fade-in stagger-1">
        {[
          { icon: Share2, title: '10 Unique Posts', desc: '10 different hooks & angles per link', gradient: 'from-blue-600 to-blue-400' },
          { icon: Target, title: 'High-Converting Copy', desc: 'Optimized for clicks & engagement', gradient: 'from-accent-blue to-blue-500' },
          { icon: BarChart3, title: 'Ready to Post', desc: 'Copy-paste directly into Facebook', gradient: 'from-cyan-500 to-blue-400' },
        ].map((item) => (
          <Card key={item.title} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg bg-linear-to-r ${item.gradient} flex items-center justify-center shrink-0`}>
                <item.icon size={18} className="text-ink" />
              </div>
              <div>
                <h3 className="font-semibold text-ink text-sm">{item.title}</h3>
                <p className="text-xs text-bp-muted">{item.desc}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Main Generator Card */}
      <Card className="animate-fade-in stagger-2 relative overflow-hidden border-accent-blue/20">
        <div className="absolute inset-0 bg-linear-to-br from-accent-blue/5 via-transparent to-blue-600/5 pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-lg bg-linear-to-r from-blue-700 to-accent-blue flex items-center justify-center">
              <Facebook size={18} className="text-ink" />
            </div>
            <h2 className="text-xl font-bold text-ink">Generate 10 Facebook Posts</h2>
            <Badge variant="blue" className="ml-auto">10X</Badge>
          </div>

          <form onSubmit={handleGenerate10Posts} className="space-y-5">
            {affiliateLinks.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowPortfolio(!showPortfolio)}
                  className="flex items-center gap-2 text-sm font-medium text-bp-blue hover:text-ink transition-colors mb-2"
                >
                  <LinkIcon size={14} />
                  Select from Content Reserve ({affiliateLinks.length})
                  {showPortfolio ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                
                {showPortfolio && (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1 mb-4">
                    {affiliateLinks.map((sl) => {
                      const isSelected = selectedLink === sl.link
                      return (
                        <button
                          key={sl.id}
                          type="button"
                          onClick={() => {
                            setSelectedLink(sl.link)
                            setLinkLabel(sl.label || '')
                            setLinkSaved(true)
                            setShowPortfolio(false)
                          }}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 ${isSelected ? 'border-bp-teal bg-bp-blue/10' : 'border-bp-border bg-[rgba(255,255,255,0.02)] hover:border-bp-teal/50'}`}
                        >
                          <LinkIcon size={16} className={isSelected ? 'text-bp-blue shrink-0' : 'text-bp-muted shrink-0'} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${isSelected ? 'text-ink' : 'text-bp-text'}`}>
                              {sl.label || 'Untitled Link'}
                            </p>
                            <p className="text-xs text-bp-muted truncate">{sl.link}</p>
                          </div>
                          {isSelected && <Check size={16} className="text-bp-blue shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              <Input
                label="Link Name"
                placeholder="e.g. My Fitness eBook, Water Filter System, etc."
                value={linkLabel}
                onChange={(e) => { setLinkLabel(e.target.value); setLinkSaved(false) }}
              />
              <Input
                label="Promotional Link"
                placeholder="https://example.com/product?ref=your-id"
                value={selectedLink}
                onChange={(e) => { setSelectedLink(e.target.value); setLinkSaved(false) }}
                icon={<LinkIcon size={18} />}
                required
              />
            </div>

            {selectedLink.trim() && !linkSaved && (
              <button
                type="button"
                onClick={handleSaveLink}
                className="flex items-center gap-2 text-xs text-bp-muted hover:text-bp-blue transition-colors"
              >
                <Save size={13} />
                Save this link to Content Reserve
              </button>
            )}
            {linkSaved && (
              <span className="flex items-center gap-1.5 text-xs text-bp-blue">
                <CheckCircle2 size={13} />
                Saved to portfolio
              </span>
            )}
            
            <Button 
              type="submit" 
              className="w-full bg-linear-to-r from-blue-600 to-accent-blue hover:from-blue-500 hover:to-blue-400" 
              disabled={isGenerating || !selectedLink.trim()}
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Generating 10 Posts...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Generate 10 Facebook Posts</span>
                </>
              )}
            </Button>

            {isGenerating && (
              <div className="py-3 animate-fade-in">
                <GenerationProgress label="Generating 10 Facebook posts..." />
              </div>
            )}
            
            {error && (
              <div className="p-3 rounded-xl bg-brass-100 border border-error text-error text-sm animate-fade-in">
                {error}
              </div>
            )}
          </form>
        </div>
      </Card>

      {/* Generated Posts */}
      {!isGenerating && showOfferBanner && generatedPosts.length > 0 && (
        <div className="mt-8">
          <EarningsBanner />
        </div>
      )}
      {generatedPosts.length > 0 && (
        <div id="generated-posts-result" className="mt-8 animate-fade-in scroll-mt-28">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-ink flex items-center gap-2">
              <Sparkles size={18} className="text-warning" />
              {generatedPosts.length} Facebook Posts Ready
            </h3>
            <button 
              onClick={handleCopyAll}
              className="flex items-center gap-2 text-sm font-medium text-bp-blue hover:text-ink transition-colors px-4 py-2 rounded-xl border border-bp-border hover:border-bp-teal"
            >
              {copiedIndex === -1 ? <Check size={14} /> : <Copy size={14} />}
              {copiedIndex === -1 ? 'All Copied!' : 'Copy All Posts'}
            </button>
          </div>
          
          <div className="space-y-4">
            {generatedPosts.map((post, index) => (
              <Card
                key={index}
                className="group hover:border-[rgba(34,211,238,0.3)] transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-brass-100 text-info flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </span>
                    <div>
                      <span className="text-sm font-semibold text-ink">Post {index + 1}</span>
                      <span className="text-xs text-info ml-2">{post.angle}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleCopy(index)}
                    className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg transition-all border border-bp-border hover:border-bp-teal text-bp-muted hover:text-bp-blue"
                  >
                    {copiedIndex === index ? <Check size={13} /> : <Copy size={13} />}
                    {copiedIndex === index ? 'Copied!' : 'Copy Post'}
                  </button>
                </div>

                <div className="bg-[rgba(255,255,255,0.02)] rounded-xl p-5 border border-white/5">
                  <p className="font-bold text-ink text-[15px] mb-3 leading-relaxed whitespace-pre-wrap">{post.hook}</p>
                  <p className="text-sm text-bp-text mb-3 leading-relaxed whitespace-pre-wrap">{post.body}</p>
                  <p className="text-sm text-bp-blue leading-relaxed whitespace-pre-wrap">{post.cta}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Facebook Tips Box */}
      <Card className="mt-8 animate-fade-in stagger-3 border-brass-300 bg-accent-blue/5">
        <div className="flex items-center gap-2 mb-5">
          <Lightbulb size={18} className="text-info" />
          <h3 className="font-bold text-ink">Pro Tips: How to Go Viral on Facebook</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
              <Users size={14} className="text-info" />
              Where to Share
            </h4>
            <ul className="space-y-2.5 text-sm text-bp-text">
              <li className="flex items-start gap-2">
                <span className="text-info mt-0.5">•</span>
                <span><strong className="text-ink">Niche Facebook Groups</strong> — Find groups with 10K–100K members related to your product. Avoid spammy mega-groups.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-info mt-0.5">•</span>
                <span><strong className="text-ink">Your Profile & Stories</strong> — Post on your personal profile too. Facebook&apos;s algorithm favors personal accounts.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-info mt-0.5">•</span>
                <span><strong className="text-ink">Facebook Pages You Manage</strong> — If you have a page, post there and boost the best-performing posts.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-info mt-0.5">•</span>
                <span><strong className="text-ink">Comment Sections</strong> — Reply to relevant viral posts with your take and a subtle link. High-traffic comments = free visibility.</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
              <Clock size={14} className="text-info" />
              When & How to Post
            </h4>
            <ul className="space-y-2.5 text-sm text-bp-text">
              <li className="flex items-start gap-2">
                <span className="text-info mt-0.5">•</span>
                <span><strong className="text-ink">Best times:</strong> 9–11 AM and 7–9 PM in your audience&apos;s timezone. Tuesday–Thursday perform best.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-info mt-0.5">•</span>
                <span><strong className="text-ink">Space them out:</strong> Post 1–2 per day across different groups. Never spam the same group twice in a day.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-info mt-0.5">•</span>
                <span><strong className="text-ink">Engage immediately:</strong> Reply to every comment within the first hour. Facebook rewards fast engagement with more reach.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-info mt-0.5">•</span>
                <span><strong className="text-ink">Use all 10 angles:</strong> Different posts resonate with different people. The curiosity angle might flop where storytelling goes viral.</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-5 p-4 rounded-xl bg-brass-100 border border-brass-300">
          <div className="flex items-start gap-3">
            <MessageCircle size={16} className="text-info shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-ink mb-1">The Golden Rule of Facebook Groups</p>
              <p className="text-xs text-bp-text leading-relaxed">
                Contribute value to the group FIRST. Comment on other people&apos;s posts, answer questions, and be helpful for a few days before sharing your own link posts. Group admins are more likely to approve your posts, and members are more likely to engage with someone they recognize. A warm audience converts 5–10x better than cold posting.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 animate-fade-in stagger-3">
        <Card className="p-4 cursor-pointer hover:border-bp-teal/30 transition-all" onClick={() => router.push('/write')}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-bp-blue/15 flex items-center justify-center">
              <FileText size={18} className="text-bp-blue" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-ink">Create Full Article</h4>
              <p className="text-xs text-bp-muted">Write a long-form SEO article instead</p>
            </div>
            <ArrowRight size={16} className="text-bp-muted" />
          </div>
        </Card>
        <Card className="p-4 cursor-pointer hover:border-bp-teal/30 transition-all" onClick={() => router.push('/links')}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-bp-blue/15 flex items-center justify-center">
              <LinkIcon size={18} className="text-bp-blue" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-ink">Content Reserve</h4>
              <p className="text-xs text-bp-muted">Manage your saved links & articles</p>
            </div>
            <ArrowRight size={16} className="text-bp-muted" />
          </div>
        </Card>
      </div>
    </div>
  )
}
