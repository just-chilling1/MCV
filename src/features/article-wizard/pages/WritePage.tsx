'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  PenTool,
  Sparkles,
  Copy,
  Save,
  Check,
  RefreshCw,
  Link as LinkIcon,
  ArrowRight,
  ArrowLeft,
  Lightbulb,
  Loader2,
  CheckCircle2,
  Image,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  ShoppingBag,
  Store,
  ShoppingCart,
  Tag,
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { PageContainer } from '@/components/ui/page-container'
import { ErrorBanner } from '@/components/ui/error-banner'
import { useAppStore } from '@/store'
import {
  ArticleTone,
  GeneratedArticle,
  AffiliatePlatform,
  type Article,
} from '@/types'
import type { ArmedLink } from '@/features/blog-builder/types'
import {
  detectLinkNetwork,
  isValidAffiliateUrl,
  normalizeAffiliateUrl,
} from '@/features/blog-builder/lib/affiliate-url'
import { fetchJson } from '@/lib/api-client'
import { copyToClipboard } from '@/lib/clipboard'
import { invalidateClientFetchCache } from '@/lib/client-fetch-cache'
import { useToast } from '@/contexts/ToastContext'
import GenerationProgress from '@/components/ui/generation-progress'
import { useScrollOnGenerationComplete } from '@/hooks/use-scroll-on-generation-complete'
import { sanitizeArticleContent } from '@/lib/rapidapi-chat'
import PageHeader from '@/components/ui/page-header'

function platformToNetwork(
  platform: AffiliatePlatform | null,
  url: string
): ArmedLink['network'] {
  if (platform === 'digistore24') return 'digistore'
  if (platform === 'amazon') return 'amazon'
  return detectLinkNetwork(url)
}

const nicheOptions = [
  { value: 'health', label: 'Health & Wellness' },
  { value: 'finance', label: 'Finance & Investing' },
  { value: 'tech', label: 'Technology' },
  { value: 'marketing', label: 'Digital Marketing' },
  { value: 'ecommerce', label: 'E-Commerce' },
  { value: 'fitness', label: 'Fitness & Sports' },
  { value: 'education', label: 'Education & Learning' },
  { value: 'realestate', label: 'Real Estate' },
  { value: 'travel', label: 'Travel & Lifestyle' },
  { value: 'food', label: 'Food & Nutrition' },
  { value: 'beauty', label: 'Beauty & Skincare' },
  { value: 'business', label: 'Business & Entrepreneurship' },
  { value: 'selfhelp', label: 'Self-Help & Personal Development' },
  { value: 'crypto', label: 'Crypto & Blockchain' },
  { value: 'saas', label: 'SaaS & Software' },
]

const toneOptions = [
  { value: 'authoritative', label: 'Authoritative' },
  { value: 'conversational', label: 'Conversational' },
  { value: 'bold', label: 'Bold' },
]

const steps = [
  { number: 1, title: 'Link & Niche', description: 'Set your promotional link and niche' },
  { number: 2, title: 'Topic & Settings', description: 'Choose your headline and preferences' },
  { number: 3, title: 'Generated Article', description: 'Review and save your article' },
]

const affiliatePlatforms: {
  value: AffiliatePlatform
  label: string
  description: string
  icon: typeof ShoppingBag
}[] = [
  { value: 'digistore24', label: 'Digistore24', description: 'Digital products marketplace', icon: ShoppingBag },
  { value: 'amazon', label: 'Amazon', description: 'Amazon Associates program', icon: ShoppingCart },
  { value: 'etsy', label: 'Etsy', description: 'Etsy affiliate program', icon: Tag },
  { value: 'ebay', label: 'eBay', description: 'eBay Partner Network', icon: Store },
]

const platformInstructions: Record<
  AffiliatePlatform,
  { steps: string[]; linkUrl: string; linkLabel: string }
> = {
  digistore24: {
    steps: [
      'Go to Digistore24.com and create a free account',
      'Navigate to the Marketplace and find your product',
      'Click "Promote Now" to get your unique affiliate link',
      'Copy your affiliate link',
      'Paste it below and click "Save Link"',
    ],
    linkUrl: 'https://www.digistore24.com',
    linkLabel: 'Open Digistore24',
  },
  amazon: {
    steps: [
      'Go to Amazon Associates and create a free account',
      'Search for a product you want to promote',
      'Use the SiteStripe bar to generate your affiliate link',
      'Copy your affiliate link',
      'Paste it below and click "Save Link"',
    ],
    linkUrl: 'https://affiliate-program.amazon.com',
    linkLabel: 'Open Amazon Associates',
  },
  etsy: {
    steps: [
      "Go to Etsy's Affiliate Program via Awin",
      'Sign up and get approved as an affiliate',
      'Browse Etsy and find products to promote',
      'Generate your affiliate link through Awin dashboard',
      'Paste it below and click "Save Link"',
    ],
    linkUrl: 'https://www.awin.com/us/affiliate/etsy',
    linkLabel: 'Open Etsy Affiliates',
  },
  ebay: {
    steps: [
      'Go to eBay Partner Network',
      'Create a free account and get approved',
      'Use the link generator to create affiliate links for any eBay listing',
      'Copy your affiliate link',
      'Paste it below and click "Save Link"',
    ],
    linkUrl: 'https://partnernetwork.ebay.com',
    linkLabel: 'Open eBay Partners',
  },
}

function stepCircleClass(current: number, step: number) {
  if (current === step) {
    return 'bg-brass-500 text-brass-900 shadow-[var(--mcv-shadow-brass)] ring-2 ring-[var(--mcv-brass-700)]/35'
  }
  if (current > step) {
    return 'bg-brass-100 text-brass-700 border border-[var(--mcv-line-brass)]'
  }
  return 'bg-field text-text-muted border border-border-dim'
}

export default function CreateArticlePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { isGenerating, setIsGenerating, currentArticle } = useAppStore()

  const [currentStep, setCurrentStep] = useState(1)

  const [affiliateLink, setAffiliateLink] = useState('')
  const [niche, setNiche] = useState('')
  const [productInfo, setProductInfo] = useState<Record<string, string> | null>(null)
  const [isScraping, setIsScraping] = useState(false)
  const [selectedAffiliatePlatform, setSelectedAffiliatePlatform] =
    useState<AffiliatePlatform | null>(null)
  const [showInstructions, setShowInstructions] = useState(false)
  const [linkSaved, setLinkSaved] = useState(false)
  const [linkSaving, setLinkSaving] = useState(false)
  const [linkLabel, setLinkLabel] = useState('')
  const [vaultLinks, setVaultLinks] = useState<ArmedLink[]>([])
  const [vaultLoading, setVaultLoading] = useState(true)

  const [topic, setTopic] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['linkedin'])
  const [tone, setTone] = useState<ArticleTone>('authoritative')
  const [suggestedHeadlines, setSuggestedHeadlines] = useState<string[]>([])
  const [previousHeadlines, setPreviousHeadlines] = useState<string[]>([])
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [isSuggestingTone, setIsSuggestingTone] = useState(false)
  const [suggestedTone, setSuggestedTone] = useState<string | null>(null)
  const [suggestedToneReason, setSuggestedToneReason] = useState('')

  const [generatedArticle, setGeneratedArticle] = useState<GeneratedArticle | null>(null)
  const [editedContent, setEditedContent] = useState('')
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  useScrollOnGenerationComplete(isGenerating, !!generatedArticle, 'generated-article-result')

  const loadVaultLinks = useCallback(async () => {
    setVaultLoading(true)
    try {
      const res = await fetch('/api/blog/link-vault', { cache: 'no-store' })
      if (!res.ok) return
      const data = (await res.json()) as { links?: ArmedLink[] }
      setVaultLinks((data.links ?? []).filter((l) => isValidAffiliateUrl(l.url)))
    } catch {
      /* ignore */
    } finally {
      setVaultLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadVaultLinks()
  }, [loadVaultLinks])

  const handleSaveToLinkVault = async () => {
    const url = normalizeAffiliateUrl(affiliateLink)
    if (!isValidAffiliateUrl(url)) {
      setError('Enter a valid URL starting with https://')
      return
    }

    setLinkSaving(true)
    setError('')
    const newLink: ArmedLink = {
      label: linkLabel.trim() || 'Promotional Offer',
      url,
      network: platformToNetwork(selectedAffiliatePlatform, url),
    }
    const nextLinks = [
      newLink,
      ...vaultLinks.filter((l) => normalizeAffiliateUrl(l.url) !== url),
    ]

    try {
      const res = await fetch('/api/blog/link-vault', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ links: nextLinks }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error || 'Save failed')
      }
      setVaultLinks(nextLinks)
      setAffiliateLink(url)
      setLinkSaved(true)
      invalidateClientFetchCache('/api/blog/link-vault')
      toast('Saved to Link Vault', { variant: 'success' })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not save to Link Vault. Try again.'
      setError(msg)
      toast(msg, { variant: 'error' })
    } finally {
      setLinkSaving(false)
    }
  }

  useEffect(() => {
    const article = useAppStore.getState().currentArticle
    if (article) {
      const cleanContent = sanitizeArticleContent(article.content)
      setTopic(article.title)
      setEditedContent(cleanContent)
      setAffiliateLink(article.affiliate_link || '')
      setNiche(article.niche || '')
      setSelectedPlatforms(
        Array.isArray(article.platform) ? article.platform : [article.platform as string]
      )
      setTone(article.tone)
      setGeneratedArticle({
        hook: article.hook || '',
        body: '',
        cta: article.cta || '',
        fullContent: cleanContent,
      })
      setCurrentStep(3)
    }
  }, [])

  // Old card/TOC HTML stays in React state after layout change — scrub it live.
  useEffect(() => {
    if (!editedContent) return
    if (!/article-(?:layout|section|toc|kicker)|class=['"]lead['"]/.test(editedContent)) return
    const cleaned = sanitizeArticleContent(editedContent)
    if (cleaned !== editedContent) {
      setEditedContent(cleaned)
      setGeneratedArticle((prev) => (prev ? { ...prev, fullContent: cleaned } : prev))
    }
  }, [editedContent])

  const handleNext = async () => {
    if (!niche) {
      setError('Please select a niche')
      return
    }
    setError('')

    if (affiliateLink.trim() && !productInfo) {
      setIsScraping(true)
      try {
        const response = await fetch('/api/scrape-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: affiliateLink }),
        })
        if (response.ok) {
          const data = await response.json()
          setProductInfo(data.productInfo || null)
        }
      } catch (err) {
        console.error('Scrape failed:', err)
      } finally {
        setIsScraping(false)
      }
    }

    setCurrentStep(2)
  }

  const handleBack = () => {
    setError('')
    setCurrentStep(currentStep - 1)
  }

  const handleSuggestHeadlines = async () => {
    setIsSuggesting(true)
    setError('')
    try {
      const response = await fetch('/api/suggest-headlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          affiliateLink,
          niche: nicheOptions.find((n) => n.value === niche)?.label || niche,
          previousHeadlines,
          productInfo,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.details || 'Failed to suggest headlines')
      }

      const data = await response.json()
      setSuggestedHeadlines(data.headlines || [])
      setPreviousHeadlines((prev) => [...prev, ...(data.headlines || [])])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to suggest headlines. Please try again.')
      console.error(err)
    } finally {
      setIsSuggesting(false)
    }
  }

  const handleSuggestTone = async () => {
    setIsSuggestingTone(true)
    try {
      const nicheLabel = nicheOptions.find((n) => n.value === niche)?.label || niche
      const response = await fetch('/api/suggest-headlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          affiliateLink,
          niche: nicheLabel,
          previousHeadlines: [],
          productInfo,
          suggestTone: true,
          topic,
        }),
      })
      if (response.ok) {
        const data = await response.json()
        if (data.suggestedTone) {
          const toneLower = data.suggestedTone.toLowerCase() as ArticleTone
          if (['authoritative', 'conversational', 'bold'].includes(toneLower)) {
            setTone(toneLower)
            setSuggestedTone(toneLower)
            setSuggestedToneReason(data.toneReason || 'Best fit for your niche and topic')
          }
        }
      }
    } catch (err) {
      console.error('Tone suggestion failed:', err)
    } finally {
      setIsSuggestingTone(false)
    }
  }

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError('Please enter or select a topic')
      return
    }

    setError('')
    setIsGenerating(true)
    setGeneratedArticle(null)
    setCurrentStep(3)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          platforms: selectedPlatforms,
          tone,
          length: 'long',
          affiliateLink,
          niche: nicheOptions.find((n) => n.value === niche)?.label || niche,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.details || 'Generation failed')
      }

      const data: GeneratedArticle = await response.json()
      const cleanContent = sanitizeArticleContent(data.fullContent)
      setGeneratedArticle({ ...data, fullContent: cleanContent })
      setEditedContent(cleanContent)
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Failed to generate article. Please try again.'
      setError(msg)
      toast(msg, { variant: 'error' })
      console.error(err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = async () => {
    await copyToClipboard(editedContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError('')
    const isUpdate = !!currentArticle?.id
    const url = isUpdate ? `/api/articles?id=${currentArticle!.id}` : '/api/articles'
    const method = isUpdate ? 'PATCH' : 'POST'

    let snapshot: Article | null = null
    if (isUpdate && currentArticle) {
      snapshot = { ...currentArticle }
      useAppStore.getState().updateArticle(currentArticle.id, {
        title: topic,
        content: editedContent,
        affiliate_link: affiliateLink,
        niche,
        platform: selectedPlatforms,
        tone,
        length: 'long',
        hook: generatedArticle?.hook || currentArticle.hook,
        cta: generatedArticle?.cta || currentArticle.cta,
      })
    }

    const res = await fetchJson<{ article: Article }>(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: topic,
        content: editedContent,
        affiliate_link: affiliateLink,
        niche,
        platform: selectedPlatforms,
        tone,
        length: 'long',
        hook: generatedArticle?.hook || currentArticle?.hook,
        cta: generatedArticle?.cta || currentArticle?.cta,
      }),
    })

    setIsSaving(false)

    if (!res.ok) {
      if (snapshot) {
        useAppStore.getState().updateArticle(snapshot.id, snapshot)
      }
      const msg = res.error || 'Failed to save article. Please try again.'
      setError(msg)
      toast(msg, { variant: 'error' })
      return
    }

    if (res.data.article) {
      if (isUpdate) {
        useAppStore.getState().updateArticle(res.data.article.id, res.data.article)
      } else {
        useAppStore.getState().addArticle(res.data.article)
        useAppStore.getState().setCurrentArticle(res.data.article)
      }
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <PageContainer className="w-full max-w-none !gap-0">
      <PageHeader
        eyebrow="Craft"
        title="Article Generator"
        subtitle="Generate authority-building content in 3 simple steps"
      />

      <nav className="mb-10 flex items-center gap-2 animate-fade-in" aria-label="Craft steps">
        {steps.map((step, index) => (
          <div key={step.number} className="flex flex-1 items-center">
            <div className="flex flex-1 items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${stepCircleClass(currentStep, step.number)}`}
              >
                {currentStep > step.number ? <Check size={16} /> : step.number}
              </div>
              <div className="hidden min-w-0 sm:block">
                <p
                  className={`text-sm font-medium ${currentStep >= step.number ? 'text-ink' : 'text-text-muted'}`}
                >
                  {step.title}
                </p>
                <p className="truncate text-xs text-text-muted">{step.description}</p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`mx-3 h-px flex-1 transition-colors duration-300 ${
                  currentStep > step.number ? 'bg-brass-500/50' : 'bg-border-dim'
                }`}
              />
            )}
          </div>
        ))}
      </nav>

      {currentStep === 1 && (
        <div className="animate-fade-in space-y-6">
          <Card>
            <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-ink">
              <LinkIcon size={20} className="text-brass-700" />
              Step 1: Link & Niche
            </h2>
            <p className="mb-4 text-sm text-text-muted">
              Add any promotional or affiliate link you&apos;d like placed in your article.
            </p>

            <div className="mb-6 rounded-2xl border-2 border-[var(--mcv-line-brass)] bg-brass-100/50 p-4 shadow-[var(--mcv-shadow-brass)] sm:p-5">
              <button
                type="button"
                onClick={() => setShowInstructions(!showInstructions)}
                className="flex w-full items-center justify-between gap-3 text-left"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--mcv-line-brass)] bg-brass-200 shadow-sm">
                    <Lightbulb size={20} className="text-brass-700" />
                  </div>
                  <div className="min-w-0">
                    <div className="mb-0.5 flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-ink">Want to use an affiliate link?</h3>
                      <span className="rounded-md bg-brass-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brass-900">
                        Guide
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary">
                      Pick a network below to see how to get your affiliate link
                    </p>
                  </div>
                </div>
                {showInstructions ? (
                  <ChevronUp size={20} className="shrink-0 text-brass-700" />
                ) : (
                  <ChevronDown size={20} className="shrink-0 text-brass-700" />
                )}
              </button>

              {showInstructions && (
                <div className="mt-5 space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    {affiliatePlatforms.map((platform) => {
                      const isSelected = selectedAffiliatePlatform === platform.value
                      return (
                        <button
                          key={platform.value}
                          type="button"
                          onClick={() =>
                            setSelectedAffiliatePlatform(
                              selectedAffiliatePlatform === platform.value ? null : platform.value
                            )
                          }
                          className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all duration-200 ${
                            isSelected
                              ? 'border-[var(--mcv-line-brass)] bg-brass-100'
                              : 'border-border-dim bg-field/40 hover:border-[var(--mcv-line-brass)] hover:bg-brass-100/40'
                          }`}
                        >
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                              isSelected
                                ? 'border border-[var(--mcv-line-brass)] bg-brass-200'
                                : 'bg-field'
                            }`}
                          >
                            <platform.icon
                              size={18}
                              className={isSelected ? 'text-brass-700' : 'text-text-muted'}
                            />
                          </div>
                          <div className="min-w-0">
                            <p
                              className={`text-sm font-medium ${isSelected ? 'text-ink' : 'text-text-secondary'}`}
                            >
                              {platform.label}
                            </p>
                            <p className="truncate text-xs text-text-muted">{platform.description}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {selectedAffiliatePlatform && (
                    <div className="space-y-3 rounded-xl border border-border-dim bg-field/60 p-4">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-brass-700">
                        How to get your{' '}
                        {
                          affiliatePlatforms.find((p) => p.value === selectedAffiliatePlatform)
                            ?.label
                        }{' '}
                        link
                      </h4>
                      {platformInstructions[selectedAffiliatePlatform].steps.map((step, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brass-100 text-xs font-bold text-brass-700">
                            {i + 1}
                          </div>
                          <div className="pt-0.5 text-sm text-text-secondary">
                            {step}
                            {i === 0 && (
                              <a
                                href={platformInstructions[selectedAffiliatePlatform].linkUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-2 inline-flex items-center gap-1 font-medium text-brass-700 hover:underline"
                              >
                                {platformInstructions[selectedAffiliatePlatform].linkLabel}
                                <ExternalLink size={13} />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-5">
              {vaultLoading ? (
                <div className="rounded-2xl border-2 border-dashed border-[var(--mcv-line-brass)] bg-brass-100/30 px-4 py-5">
                  <p className="flex items-center gap-2 text-sm text-text-muted">
                    <Loader2 size={14} className="animate-spin text-brass-700" />
                    Loading saved links…
                  </p>
                </div>
              ) : vaultLinks.length > 0 ? (
                <div className="rounded-2xl border-2 border-[var(--mcv-line-brass)] bg-brass-100/40 p-4 shadow-[0_0_0_1px_color-mix(in_srgb,var(--mcv-brass-500)_20%,transparent)]">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--mcv-line-brass)] bg-brass-200">
                        <LinkIcon size={15} className="text-brass-700" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-ink">Your saved links</p>
                        <p className="text-xs text-text-muted">Tap one to use it in this article</p>
                      </div>
                    </div>
                    <span className="rounded-full border border-[var(--mcv-line-brass)] bg-brass-200 px-2.5 py-0.5 text-[11px] font-bold text-brass-700">
                      {vaultLinks.length} saved
                    </span>
                  </div>
                  <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                    {vaultLinks.map((sl) => {
                      const isSelected =
                        normalizeAffiliateUrl(affiliateLink) === normalizeAffiliateUrl(sl.url)
                      return (
                        <button
                          key={sl.url}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setAffiliateLink('')
                              setLinkLabel('')
                              setLinkSaved(false)
                              return
                            }
                            setAffiliateLink(sl.url)
                            setLinkLabel(sl.label || '')
                            setLinkSaved(true)
                          }}
                          className={`flex w-full items-center gap-3 rounded-xl border-2 p-3.5 text-left transition-all duration-[160ms] ${
                            isSelected
                              ? 'border-[var(--mcv-brass-500)] bg-brass-200 shadow-[var(--mcv-shadow-brass)]'
                              : 'border-border-dim bg-[var(--mcv-surface)] hover:border-[var(--mcv-line-brass)] hover:bg-brass-100/60'
                          }`}
                        >
                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                              isSelected
                                ? 'border-transparent bg-brass-500 text-brass-900'
                                : 'border-[var(--mcv-line-brass)] bg-brass-100 text-brass-700'
                            }`}
                          >
                            <LinkIcon size={16} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p
                              className={`truncate text-sm font-semibold ${
                                isSelected ? 'text-brass-700' : 'text-ink'
                              }`}
                            >
                              {sl.label || 'Untitled Link'}
                            </p>
                            <p className="truncate text-xs text-text-muted">{sl.url}</p>
                          </div>
                          {isSelected ? (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-brass-500 px-2 py-1 text-[11px] font-bold text-brass-900">
                              <Check size={12} strokeWidth={3} />
                              Selected
                            </span>
                          ) : (
                            <span className="shrink-0 text-[11px] font-medium text-brass-700">
                              Use
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-[var(--mcv-line-brass)] bg-brass-100/25 px-4 py-4">
                  <p className="text-sm font-medium text-ink">No saved links yet</p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    Paste a URL below and hit Save — it shows up here and in Link Vault.
                  </p>
                </div>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border-dim" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-[var(--mcv-surface)] px-3 text-xs font-medium uppercase tracking-wider text-text-muted">
                    or enter manually
                  </span>
                </div>
              </div>

              <Input
                label="Link Name"
                placeholder="e.g. My Fitness eBook, Keto Supplement, etc."
                value={linkLabel}
                onChange={(e) => {
                  setLinkLabel(e.target.value)
                  setLinkSaved(false)
                }}
              />

              <Input
                label="URL"
                placeholder="https://example.com/product?ref=your-id"
                value={affiliateLink}
                onChange={(e) => {
                  setAffiliateLink(e.target.value)
                  setLinkSaved(false)
                }}
              />

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => void handleSaveToLinkVault()}
                  disabled={!affiliateLink.trim() || linkSaving}
                  loading={linkSaving}
                  size="sm"
                  variant={linkSaved ? 'secondary' : 'primary'}
                  className="!h-10 md:!h-11 text-[13px]"
                >
                  {linkSaved && !linkSaving ? <Check size={15} /> : <Save size={15} />}
                  <span>{linkSaved ? 'Saved to Link Vault' : 'Save to Link vault'}</span>
                </Button>

                {linkSaved && (
                  <span className="flex items-center gap-1.5 text-sm text-brass-700">
                    <CheckCircle2 size={15} />
                    Link saved — open Link Vault in the sidebar
                  </span>
                )}
              </div>
            </div>
          </Card>

          <Card>
            <div className="space-y-6">
              <Select
                label="Niche"
                options={[{ value: '', label: 'Select your niche...' }, ...nicheOptions]}
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
              />

              {error ? <ErrorBanner message={error} /> : null}

              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleNext}
                  size="md"
                  loading={isScraping}
                  className="!h-11 !rounded-2xl md:!h-12"
                >
                  <span>{isScraping ? 'Analyzing link...' : 'Next: Topic & Settings'}</span>
                  {!isScraping && <ArrowRight size={16} />}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {currentStep === 2 && (
        <div className="animate-fade-in space-y-6">
          <Card>
            <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-ink">
              <PenTool size={20} className="text-brass-700" />
              Step 2: Topic & Settings
            </h2>

            <div className="space-y-6">
              <div>
                <Input
                  label="Topic / Headline"
                  placeholder="e.g., 5 Leadership Lessons from Building a $10M Startup"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />

                <button
                  type="button"
                  onClick={handleSuggestHeadlines}
                  disabled={isSuggesting}
                  className="mt-3 flex items-center gap-2 rounded-xl border border-[var(--mcv-line-brass)] px-4 py-2.5 text-sm font-medium text-brass-700 transition-all duration-200 hover:bg-brass-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSuggesting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Lightbulb size={16} />
                  )}
                  {isSuggesting ? 'Generating suggestions...' : 'Suggest 5 Headlines (AI)'}
                </button>

                {suggestedHeadlines.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
                      AI Suggestions — click to select:
                    </p>
                    {suggestedHeadlines.map((headline, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setTopic(headline)}
                        className={`select-row w-full rounded-xl border p-3 text-left text-sm transition-all duration-200 ${
                          topic === headline
                            ? 'is-selected border-[var(--mcv-line-brass)] text-ink'
                            : 'border-border-dim bg-field/40 text-text-secondary hover:border-[var(--mcv-line-brass)] hover:bg-brass-100/40'
                        }`}
                      >
                        <span className="mr-2 font-bold text-brass-700">{i + 1}.</span>
                        {headline}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={handleSuggestHeadlines}
                      disabled={isSuggesting}
                      className="mt-2 flex items-center gap-1.5 text-xs text-text-muted transition-colors hover:text-brass-700"
                    >
                      <RefreshCw size={12} className={isSuggesting ? 'animate-spin' : ''} />
                      Regenerate suggestions
                    </button>
                  </div>
                )}
              </div>

              <div>
                <Select
                  label="Tone"
                  options={toneOptions}
                  value={tone}
                  onChange={(e) => setTone(e.target.value as ArticleTone)}
                />
                <button
                  type="button"
                  onClick={handleSuggestTone}
                  disabled={isSuggestingTone}
                  className="mt-2 flex items-center gap-2 rounded-xl border border-[var(--mcv-line-brass)] px-3 py-2 text-xs font-medium text-brass-700 transition-all duration-200 hover:bg-brass-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSuggestingTone ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Sparkles size={14} />
                  )}
                  {isSuggestingTone ? 'Analyzing...' : 'Suggest Best Tone (AI)'}
                </button>
                {suggestedTone && (
                  <div className="mt-3 animate-fade-in rounded-xl border border-[var(--mcv-line-brass)] bg-brass-100/50 p-3">
                    <div className="flex items-start gap-2.5">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brass-200">
                        <Sparkles size={14} className="text-brass-700" />
                      </div>
                      <div>
                        <p className="mb-0.5 text-xs font-semibold text-ink">
                          AI Tip: {suggestedTone.charAt(0).toUpperCase() + suggestedTone.slice(1)}{' '}
                          Tone
                        </p>
                        <p className="text-[11px] leading-relaxed text-text-secondary">
                          {suggestedToneReason}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {error ? <ErrorBanner message={error} /> : null}

              <div className="flex justify-between gap-3 pt-2">
                <Button
                  onClick={handleBack}
                  variant="secondary"
                  size="sm"
                  className="!h-10 !rounded-2xl"
                >
                  <ArrowLeft size={15} />
                  <span>Back</span>
                </Button>
                <Button
                  onClick={handleGenerate}
                  size="md"
                  loading={isGenerating}
                  className="!h-11 !rounded-2xl md:!h-12"
                >
                  <Sparkles size={16} />
                  <span>{isGenerating ? 'Generating...' : 'Generate Article'}</span>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {currentStep === 3 && (
        <div className="animate-fade-in">
          <Card className="flex flex-col" hover={false}>
            <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-ink">
              <Sparkles size={20} className="text-brass-700" />
              Step 3: Your Article
            </h2>

            {isGenerating ? (
              <GenerationProgress label="Generating your article..." />
            ) : generatedArticle ? (
              <>
                <div id="generated-article-result" className="relative mb-8 scroll-mt-28">
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e) => setEditedContent(e.currentTarget.innerHTML)}
                    onClick={(e) => {
                      const target = e.target as HTMLElement
                      if (target.tagName.toLowerCase() === 'a') {
                        e.preventDefault()
                        window.open(
                          (target as HTMLAnchorElement).href,
                          '_blank',
                          'noopener,noreferrer'
                        )
                      }
                    }}
                    className="editor-content prose-bp editor-cursor-behavior scrollbar-custom h-[550px] w-full overflow-y-auto rounded-2xl border border-border-dim bg-field/40 p-8 outline-none transition-all focus:border-[var(--mcv-line-brass)] focus:ring-1 focus:ring-[var(--mcv-brass-700)]/40"
                    ref={(el) => {
                      if (el && el.innerHTML !== editedContent) {
                        el.innerHTML = editedContent
                      }
                    }}
                  />
                  <div className="absolute right-4 top-4 text-[10px] uppercase tracking-widest text-text-muted opacity-50">
                    Live Editor
                  </div>
                </div>

                {error ? <ErrorBanner message={error} className="mb-4" /> : null}

                {saved && (
                  <div className="mb-4 flex items-center gap-2 rounded-xl border border-[var(--mcv-success)]/30 bg-[var(--mcv-success)]/10 p-3 text-sm text-[var(--mcv-success)]">
                    <CheckCircle2 size={16} />
                    Article saved successfully!
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 [&_button]:!h-9 [&_button]:!min-h-9 [&_button]:!rounded-xl [&_button]:!px-3.5 [&_button]:!py-0 [&_button]:!text-[13px] [&_button]:!font-medium [&_button]:!leading-none">
                  <Button onClick={handleBack} variant="secondary" size="sm">
                    <ArrowLeft size={14} />
                    <span>Back</span>
                  </Button>

                  <div className="flex-1" />

                  <Button onClick={handleCopy} variant="secondary" size="sm">
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </Button>

                  <Button onClick={handleGenerate} variant="ghost" size="sm">
                    <RefreshCw size={14} />
                    <span>Regenerate</span>
                  </Button>

                  <Button onClick={handleSave} loading={isSaving} size="sm">
                    {saved ? <Check size={14} /> : <Save size={14} />}
                    <span>{saved ? 'Saved!' : isSaving ? 'Saving...' : 'Save Article'}</span>
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      if (generatedArticle && !currentArticle) {
                        void handleSave()
                      }
                      router.push('/images')
                    }}
                  >
                    <Image size={14} />
                    <span>Generate Images</span>
                  </Button>

                  {currentArticle && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        useAppStore.getState().setCurrentArticle(null)
                        window.location.reload()
                      }}
                    >
                      <PenTool size={14} />
                      <span>New Article</span>
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-border-dim bg-brass-100">
                  <PenTool className="text-brass-700" size={28} />
                </div>
                {error ? (
                  <>
                    <p className="mb-2 font-medium text-ink">Generation failed</p>
                    <ErrorBanner message={error} className="mb-4 max-w-md text-left" />
                  </>
                ) : (
                  <>
                    <p className="mb-2 text-text-muted">No article generated yet</p>
                    <p className="text-sm text-text-muted opacity-75">
                      Go back and click Generate to create your article
                    </p>
                  </>
                )}
                <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                  {error && (
                    <Button onClick={handleGenerate} loading={isGenerating}>
                      <RefreshCw size={18} />
                      <span>Try Again</span>
                    </Button>
                  )}
                  <Button onClick={handleBack} variant="secondary">
                    <ArrowLeft size={18} />
                    <span>Back to Settings</span>
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </PageContainer>
  )
}
