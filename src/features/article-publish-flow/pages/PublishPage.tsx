'use client'

import { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Copy,
  Check,
  ExternalLink,
  Linkedin,
  FileText,
  Hash,
  MessageSquare,
  AlertTriangle,
  Loader2,
  Wand2,
  ChevronRight,
  BookOpen,
  TrendingUp,
  Twitter,
  Sparkles,
  Download,
  Image as ImageIcon,
  Clock,
  Search,
  ClipboardList,
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/empty-state'
import { useAppStore } from '@/store'
import { PLATFORM_INFO, Platform, Article, type Snippet } from '@/types'
import { fetchJson } from '@/lib/api-client'
import { copyToClipboard } from '@/lib/clipboard'
import { useToast } from '@/contexts/ToastContext'
import { SaveStatusBar } from '@/components/ui/SaveStatusBar'
import GenerationProgress from '@/components/ui/generation-progress'
import EarningsBanner from '@/components/ui/earnings-banner'
import { useScrollOnGenerationComplete } from '@/hooks/use-scroll-on-generation-complete'
import { markPublishCopyDone } from '@/lib/onboarding'
import PageHeader from '@/components/ui/page-header'

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Linkedin,
  FileText,
  MessageSquare,
  Hash,
  Twitter,
}

const platformCards: {
  id: Platform
  name: string
  accent: string
  tagline: string
}[] = [
  { id: 'linkedin', name: 'LinkedIn', accent: 'border-l-[#0A66C2] bg-[#0A66C2]', tagline: 'B2B, thought leadership & professional authority' },
  { id: 'quora', name: 'Quora', accent: 'border-l-[#B92B27] bg-[#B92B27]', tagline: 'Answer-based SEO & evergreen Google traffic' },
  { id: 'medium', name: 'Medium', accent: 'border-l-[#1A1A1A] bg-[#292929]', tagline: 'Long-form content, tutorials & publication reach' },
  { id: 'reddit', name: 'Reddit', accent: 'border-l-[#FF4500] bg-[#FF4500]', tagline: 'Community-driven traffic & niche subreddit reach' },
  { id: 'twitter', name: 'X (Twitter)', accent: 'border-l-[#1D9BF0] bg-[#1D9BF0]', tagline: 'Viral threads, hot takes & real-time engagement' },
]

const STEPS = [
  { num: 1 as const, label: 'Article' },
  { num: 2 as const, label: 'Platform' },
  { num: 3 as const, label: 'Launch' },
]

interface SuggestedTag {
  tag: string
  reason: string
}

function withSavedImages(article: Article): Article {
  const saved = useAppStore.getState().articleImages?.[article.id]
  if (saved && saved.length > 0 && (!article.images || article.images.length === 0)) {
    return { ...article, images: saved }
  }
  return article
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function PublishPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { currentArticle, setCurrentArticle, updateArticle, articles } = useAppStore()
  const syncedArticleQueryRef = useRef<string | null>(null)
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const nudgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const snippetsFetchedRef = useRef(false)

  const [step, setStep] = useState<1 | 2 | 3>(currentArticle ? 2 : 1)
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [showStackNudge, setShowStackNudge] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)
  const [activeTab, setActiveTab] = useState<'instructions' | 'seo' | 'tags'>('instructions')
  const [suggestedTags, setSuggestedTags] = useState<SuggestedTag[]>([])
  const [isLoadingTags, setIsLoadingTags] = useState(false)
  const [isLoadingArticles, setIsLoadingArticles] = useState(() => articles.length === 0)
  const [publishSave, setPublishSave] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [publishSaveAt, setPublishSaveAt] = useState<Date | null>(null)
  const [publishSaveErr, setPublishSaveErr] = useState<string | null>(null)
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [snippetsLoading, setSnippetsLoading] = useState(false)
  const [showOfferBanner, setShowOfferBanner] = useState(false)
  const [downloadingImages, setDownloadingImages] = useState(false)

  useScrollOnGenerationComplete(isLoadingTags, suggestedTags.length > 0, 'suggested-tags-result')

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
      if (nudgeTimerRef.current) clearTimeout(nudgeTimerRef.current)
    }
  }, [])

  // Enrich currentArticle with saved images when it changes
  useEffect(() => {
    if (!currentArticle) return
    const enriched = withSavedImages(currentArticle)
    if (enriched !== currentArticle && enriched.images !== currentArticle.images) {
      setCurrentArticle(enriched)
    }
  }, [currentArticle?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (articles.length > 0) {
      setIsLoadingArticles(false)
      return
    }
    let cancelled = false
    setIsLoadingArticles(true)
    void fetchJson<{ articles?: Article[] }>('/api/articles').then((res) => {
      if (cancelled) return
      if (!res.ok) {
        setIsLoadingArticles(false)
        return
      }
      const fetched = res.data.articles ?? []
      const local = useAppStore.getState().articles
      const fetchedIds = new Set(fetched.map((a) => a.id))
      const combined = [
        ...fetched,
        ...local.filter((a) => !fetchedIds.has(a.id)),
      ].map(withSavedImages)
      useAppStore.getState().setArticles(combined)
      setIsLoadingArticles(false)
    })
    return () => {
      cancelled = true
    }
  }, [articles.length])

  useEffect(() => {
    const id = searchParams.get('articleId')
    if (!id) {
      syncedArticleQueryRef.current = null
      return
    }
    if (articles.length === 0) return
    if (syncedArticleQueryRef.current === id) return
    const article = articles.find((a) => a.id === id)
    if (!article) {
      syncedArticleQueryRef.current = null
      router.replace('/publish')
      return
    }
    syncedArticleQueryRef.current = id
    setCurrentArticle(withSavedImages(article))
    setStep(2)
    setSelectedPlatform(null)
    router.replace('/publish')
  }, [searchParams, articles, router, setCurrentArticle])

  useEffect(() => {
    if (step !== 3 || snippetsFetchedRef.current) return
    snippetsFetchedRef.current = true
    let cancelled = false
    setSnippetsLoading(true)
    void fetchJson<{ snippets?: Snippet[] }>('/api/snippets').then((res) => {
      if (cancelled) return
      setSnippetsLoading(false)
      if (res.ok) setSnippets(res.data.snippets ?? [])
    })
    return () => {
      cancelled = true
    }
  }, [step])

  const copy = useCallback(
    async (text: string, key: string, msg?: string) => {
      try {
        await copyToClipboard(text)
        if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
        setCopiedKey(key)
        if (msg) toast(msg, { variant: 'success' })
        copiedTimerRef.current = setTimeout(() => setCopiedKey(null), 2000)
        return true
      } catch {
        toast('Could not copy', { variant: 'error' })
        return false
      }
    },
    [toast]
  )

  const filteredArticles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return articles
    return articles.filter((a) => a.title.toLowerCase().includes(q))
  }, [articles, searchQuery])

  const handleSelectArticle = (article: Article) => {
    setCurrentArticle(withSavedImages(article))
    setStep(2)
  }

  const handleSelectPlatform = (id: Platform) => {
    setSelectedPlatform(id)
    setStep(3)
    setActiveTab('instructions')
    setSuggestedTags([])
  }

  const handleCopyArticle = async () => {
    if (!currentArticle) return
    const ok = await copy(currentArticle.content, 'article')
    if (ok) {
      markPublishCopyDone()
      setShowStackNudge(true)
      if (nudgeTimerRef.current) clearTimeout(nudgeTimerRef.current)
      nudgeTimerRef.current = setTimeout(() => setShowStackNudge(false), 12000)
    }
  }

  const handleMarkPublished = async () => {
    if (!currentArticle) return
    const snapshot = { ...currentArticle }
    setPublishSave('saving')
    setPublishSaveErr(null)
    updateArticle(currentArticle.id, { status: 'published' })
    setCurrentArticle({ ...currentArticle, status: 'published' })

    const res = await fetchJson<{ article: Article }>(`/api/articles?id=${currentArticle.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'published' }),
    })

    if (!res.ok) {
      updateArticle(snapshot.id, snapshot)
      setCurrentArticle(snapshot)
      const msg = res.error || 'Could not mark as published'
      setPublishSave('error')
      setPublishSaveErr(msg)
      toast(msg, { variant: 'error' })
      return
    }
    if (res.data.article) {
      updateArticle(res.data.article.id, res.data.article)
      setCurrentArticle(res.data.article)
    }
    setPublishSave('saved')
    setPublishSaveAt(new Date())
    toast('Marked as published', { variant: 'success' })
  }

  const handleDownloadImages = async () => {
    if (!currentArticle?.images || currentArticle.images.length === 0) return
    setDownloadingImages(true)
    const slug = currentArticle.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 40)
    const results = await Promise.allSettled(
      currentArticle.images.map(async (img) => {
        const response = await fetch(img.url)
        if (!response.ok) throw new Error('fetch failed')
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${slug}_${img.section || img.position}.${blob.type.split('/')[1] || 'png'}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      })
    )
    setDownloadingImages(false)
    const failed = results.filter((r) => r.status === 'rejected').length
    if (failed > 0) {
      toast(`${failed} image${failed === 1 ? '' : 's'} failed to download`, { variant: 'error' })
    } else {
      toast('Images downloaded', { variant: 'success' })
    }
  }

  const handleSuggestTags = async () => {
    if (!selectedPlatform || !currentArticle) return
    setShowOfferBanner(true)
    setIsLoadingTags(true)
    setSuggestedTags([])
    const res = await fetchJson<{ tags: SuggestedTag[] }>('/api/suggest-tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: selectedPlatform,
        articleTitle: currentArticle.title,
        articleContent: currentArticle.content,
        niche: currentArticle.niche || '',
      }),
    })
    setIsLoadingTags(false)
    if (!res.ok) {
      toast(res.error || 'Tag suggestions failed', { variant: 'error' })
      return
    }
    if (res.data.tags?.length) setSuggestedTags(res.data.tags)
  }

  const platformInfo = selectedPlatform ? PLATFORM_INFO[selectedPlatform] : null
  const PlatformIcon = selectedPlatform ? iconMap[PLATFORM_INFO[selectedPlatform].icon] : null
  const selectedCard = platformCards.find((p) => p.id === selectedPlatform)
  const showSaveBar = publishSave === 'saving' || publishSave === 'saved' || publishSave === 'error'

  const goToStep = (num: 1 | 2 | 3) => {
    if (num === 1) {
      setStep(1)
      setSelectedPlatform(null)
    } else if (num === 2 && currentArticle) {
      setStep(2)
      setSelectedPlatform(null)
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Broadcast"
        title="Broadcast & Distribute"
        subtitle="Select your article, choose a platform, and launch"
      />

      {/* Compact stepper */}
      <nav aria-label="Broadcast steps" className="mb-5 flex flex-wrap items-center gap-2">
        {STEPS.map((s, i) => {
          const isActive = step === s.num
          const isDone = step > s.num
          const canClick = s.num === 1 || (s.num === 2 && !!currentArticle)
          return (
            <div key={s.num} className="flex items-center gap-2">
              <button
                type="button"
                disabled={!canClick && !isActive}
                onClick={() => goToStep(s.num)}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-brass-100 text-brass-700 border border-[var(--mcv-line-brass)]'
                    : isDone
                      ? 'bg-brand-tint text-brass-700 border border-transparent'
                      : 'bg-field text-text-muted border border-border-dim'
                } ${canClick && !isActive ? 'cursor-pointer hover:border-[var(--mcv-line-brass)]' : ''}`}
                aria-current={isActive ? 'step' : undefined}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    isDone
                      ? 'bg-brass-700 text-text-on-accent'
                      : isActive
                        ? 'bg-brass-700/20 text-brass-700'
                        : 'bg-raised text-text-muted'
                  }`}
                >
                  {isDone ? <Check size={10} /> : s.num}
                </span>
                {s.label}
              </button>
              {i < STEPS.length - 1 && (
                <ChevronRight size={14} className="text-text-muted/40" aria-hidden />
              )}
            </div>
          )
        })}
      </nav>

      {/* One-line manual posting note */}
      <p className="mb-6 flex items-start gap-2 text-xs leading-relaxed text-text-muted">
        <AlertTriangle size={14} className="mt-0.5 shrink-0 text-warning" aria-hidden />
        <span>
          Manual posting required — copy your article and paste it on the platform. We do not auto-post.
        </span>
      </p>

      {showSaveBar && (
        <SaveStatusBar
          status={
            publishSave === 'saving'
              ? 'saving'
              : publishSave === 'saved'
                ? 'saved'
                : publishSave === 'error'
                  ? 'error'
                  : 'idle'
          }
          savedAt={publishSaveAt}
          errorMessage={publishSaveErr}
          onRetry={() => void handleMarkPublished()}
          className="mb-6"
        />
      )}

      {/* Shared selected-article bar (steps 2–3) */}
      {step > 1 && currentArticle && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-border-dim bg-brand-tint/40 px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brass-100 text-brass-700">
            <Check size={16} aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{currentArticle.title}</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-text-muted">
              <Badge
                variant={currentArticle.status === 'published' ? 'success' : 'purple'}
                className="text-[10px]"
              >
                {currentArticle.status}
              </Badge>
              {currentArticle.images && currentArticle.images.length > 0 && (
                <span className="inline-flex items-center gap-1 text-success">
                  <ImageIcon size={11} aria-hidden />
                  {currentArticle.images.length} image{currentArticle.images.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setStep(1)
              setSelectedPlatform(null)
            }}
            className="shrink-0 text-xs font-medium text-brass-700 underline-offset-2 hover:underline"
          >
            Change
          </button>
        </div>
      )}

      {/* ─── Step 1: Select Article ─── */}
      {step === 1 && (
        <div className="space-y-5 animate-fade-in">
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              aria-hidden
            />
            <input
              type="search"
              placeholder="Search articles…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search articles"
              className="input-base w-full rounded-xl py-3 pl-10 pr-4 text-sm"
            />
          </div>

          {isLoadingArticles ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" aria-busy="true" aria-label="Loading articles">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-28 animate-pulse rounded-3xl border border-border-dim bg-field"
                />
              ))}
            </div>
          ) : filteredArticles.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {filteredArticles.map((article) => {
                const isSelected = currentArticle?.id === article.id
                const preview = article.images?.[0]
                return (
                  <button
                    key={article.id}
                    type="button"
                    onClick={() => handleSelectArticle(article)}
                    className={`card group flex w-full items-start gap-3 rounded-3xl p-4 text-left transition-all ${
                      isSelected
                        ? 'border-[var(--mcv-line-brass)] ring-2 ring-brass-700/20'
                        : 'hover:border-[var(--mcv-line-brass)]'
                    }`}
                  >
                    {preview ? (
                      <img
                        src={preview.url}
                        alt=""
                        loading="lazy"
                        className="h-14 w-14 shrink-0 rounded-xl border border-border-dim object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-field text-text-muted">
                        <FileText size={20} aria-hidden />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="mb-1 line-clamp-1 text-sm font-semibold text-ink group-hover:text-brass-700">
                        {article.title}
                      </h3>
                      <p className="mb-2 line-clamp-2 text-xs text-text-muted">
                        {article.content.substring(0, 120)}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-text-muted">
                        <span className="inline-flex items-center gap-1">
                          <Clock size={11} aria-hidden />
                          {formatDate(article.created_at)}
                        </span>
                        <Badge
                          variant={article.status === 'published' ? 'success' : 'purple'}
                          className="text-[10px]"
                        >
                          {article.status}
                        </Badge>
                        {article.images && article.images.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-success">
                            <ImageIcon size={11} aria-hidden />
                            {article.images.length}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight
                      size={16}
                      className="mt-1 shrink-0 text-text-muted group-hover:text-brass-700"
                      aria-hidden
                    />
                  </button>
                )
              })}
            </div>
          ) : searchQuery ? (
            <EmptyState
              icon={Search}
              title="No articles match your search"
              description="Try a different search term"
            />
          ) : (
            <EmptyState
              icon={FileText}
              title="No articles yet"
              description="Create an article first, then come back to publish"
              action={{ label: 'Create article', href: '/write' }}
            />
          )}
        </div>
      )}

      {/* ─── Step 2: Choose Platform ─── */}
      {step === 2 && (
        <div className="space-y-5 animate-fade-in">
          <h2 className="text-lg font-semibold text-ink" style={{ fontFamily: 'var(--font-display)' }}>
            Choose your platform
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {platformCards.map((platform) => {
              const Icon = iconMap[PLATFORM_INFO[platform.id].icon]
              const [borderClass, chipBg] = platform.accent.split(' ')
              return (
                <button
                  key={platform.id}
                  type="button"
                  onClick={() => handleSelectPlatform(platform.id)}
                  className={`card group flex w-full items-start gap-4 rounded-3xl border-l-4 p-5 text-left transition-all hover:border-[var(--mcv-line-brass)] ${borderClass}`}
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white transition-transform group-hover:scale-105 ${chipBg}`}
                  >
                    {Icon && <Icon size={20} aria-hidden />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="mb-1 font-semibold text-ink">{platform.name}</h3>
                    <p className="text-sm text-text-muted">{platform.tagline}</p>
                  </div>
                  <ChevronRight
                    size={16}
                    className="mt-1 shrink-0 text-text-muted group-hover:text-brass-700"
                    aria-hidden
                  />
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ─── Step 3: Launch desk ─── */}
      {step === 3 && selectedPlatform && platformInfo && (
        <div className="space-y-6 animate-fade-in">
          {/* Platform pills + open link */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Switch platform">
              {platformCards.map((p) => {
                const PIcon = iconMap[PLATFORM_INFO[p.id].icon]
                const active = selectedPlatform === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPlatform(p.id)}
                    aria-pressed={active}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-brass-100 text-brass-700 border border-[var(--mcv-line-brass)]'
                        : 'border border-border-dim bg-field text-text-muted hover:text-ink'
                    }`}
                  >
                    {PIcon && <PIcon size={12} aria-hidden />}
                    {p.name}
                  </button>
                )
              })}
            </div>
            <a
              href={platformInfo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brass-700 hover:underline"
            >
              Open {platformInfo.name}
              <ExternalLink size={14} aria-hidden />
            </a>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Action rail — first on mobile, sticky sidebar on lg */}
            <aside className="order-1 space-y-4 lg:order-2 lg:sticky lg:top-8 lg:self-start">
              <Card hover={false}>
                <div className="mb-3 flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white ${selectedCard?.accent.split(' ')[1] ?? 'bg-brass-700'}`}
                  >
                    {PlatformIcon && <PlatformIcon size={20} aria-hidden />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wider text-brass-700">
                      Launch on
                    </p>
                    <h3 className="truncate text-sm font-semibold text-ink">{platformInfo.name}</h3>
                  </div>
                </div>

                {currentArticle?.images && currentArticle.images.length > 0 && (
                  <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
                    {currentArticle.images.map((img, i) => (
                      <img
                        key={i}
                        src={img.url}
                        alt={img.alt || 'Article image'}
                        loading="lazy"
                        className="h-12 w-12 shrink-0 rounded-lg border border-border-dim object-cover"
                      />
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <Button onClick={() => void handleCopyArticle()} className="w-full">
                    {copiedKey === 'article' ? <Check size={16} /> : <Copy size={16} />}
                    <span>{copiedKey === 'article' ? 'Copied!' : 'Copy article'}</span>
                  </Button>

                  {currentArticle?.images && currentArticle.images.length > 0 && (
                    <Button
                      variant="secondary"
                      onClick={() => void handleDownloadImages()}
                      loading={downloadingImages}
                      className="w-full"
                    >
                      <Download size={16} />
                      <span>Download images</span>
                    </Button>
                  )}

                  {currentArticle && currentArticle.status !== 'published' && (
                    <Button
                      variant="secondary"
                      onClick={() => void handleMarkPublished()}
                      loading={publishSave === 'saving'}
                      className="w-full"
                    >
                      <Check size={16} />
                      <span>Mark as published</span>
                    </Button>
                  )}
                </div>

                {showStackNudge && (
                  <p className="mt-3 text-xs leading-relaxed text-brass-700">
                    Stack another asset when you are ready—consistency compounds reach for your links.
                  </p>
                )}
              </Card>

              {/* Snippet library */}
              <Card hover={false} className="border border-border-dim">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <ClipboardList size={16} className="shrink-0 text-brass-700" aria-hidden />
                    <h3 className="truncate text-sm font-semibold text-ink">Snippet library</h3>
                  </div>
                  <Link
                    href="/links"
                    className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-brass-700 hover:underline"
                  >
                    Manage
                  </Link>
                </div>
                <p className="mb-3 text-xs leading-relaxed text-text-muted">
                  Copy saved bios and CTAs while you post. Paste into the editor, caption, or first comment.
                </p>
                {snippetsLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 size={22} className="animate-spin text-brass-700" aria-hidden />
                  </div>
                ) : snippets.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border-dim bg-field px-3 py-4 text-center text-xs text-text-muted">
                    No snippets yet.{' '}
                    <Link href="/links" className="text-brass-700 underline-offset-2 hover:underline">
                      Add some in the library
                    </Link>
                    .
                  </p>
                ) : (
                  <ul className="max-h-56 space-y-2 overflow-y-auto pr-1 scrollbar-custom">
                    {snippets.map((s) => (
                      <li key={s.id} className="rounded-lg border border-border-dim bg-field p-2.5">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className="truncate text-xs font-semibold text-ink">{s.title}</span>
                          <Badge
                            variant={s.kind === 'cta' ? 'success' : 'purple'}
                            className="shrink-0 text-[9px] uppercase"
                          >
                            {s.kind}
                          </Badge>
                        </div>
                        <p className="mb-2 line-clamp-2 text-[11px] leading-snug text-ink-4">{s.body}</p>
                        <button
                          type="button"
                          aria-label={`Copy snippet ${s.title}`}
                          onClick={() =>
                            void copy(s.body, `snippet:${s.id}`, 'Copied — paste into your post or bio')
                          }
                          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border-dim bg-surface py-1.5 text-[11px] font-semibold text-brass-700 transition-colors hover:bg-brass-100"
                        >
                          {copiedKey === `snippet:${s.id}` ? <Check size={12} /> : <Copy size={12} />}
                          {copiedKey === `snippet:${s.id}` ? 'Copied' : 'Copy text'}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </aside>

            {/* Main column — tabs */}
            <div className="order-2 space-y-4 lg:order-1 lg:col-span-2">
              <div
                role="tablist"
                aria-label="Publish guides"
                className="flex gap-1 rounded-xl border border-border-dim bg-field p-1"
              >
                {(
                  [
                    { id: 'instructions' as const, label: 'How to post', icon: BookOpen },
                    { id: 'seo' as const, label: 'Ranking tips', icon: TrendingUp },
                    {
                      id: 'tags' as const,
                      label: `AI ${platformInfo.tagLabel}`,
                      icon: Sparkles,
                    },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    id={`publish-tab-${tab.id}`}
                    aria-selected={activeTab === tab.id}
                    aria-controls={`publish-panel-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-brass-100 text-brass-700'
                        : 'text-text-muted hover:text-ink'
                    }`}
                  >
                    <tab.icon size={16} aria-hidden />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              {activeTab === 'instructions' && (
                <Card
                  hover={false}
                  role="tabpanel"
                  id="publish-panel-instructions"
                  aria-labelledby="publish-tab-instructions"
                  className="animate-fade-in"
                >
                  <div className="mb-5 flex items-center gap-2">
                    <BookOpen size={18} className="text-brass-700" aria-hidden />
                    <h3 className="font-semibold text-ink">Post on {platformInfo.name}</h3>
                  </div>
                  <ol className="relative space-y-0 border-l border-border-dim pl-6">
                    {platformInfo.instructions.map((s, index) => (
                      <li key={index} className="relative pb-5 last:pb-0">
                        <span className="absolute -left-[1.875rem] flex h-6 w-6 items-center justify-center rounded-full bg-brass-100 text-[11px] font-bold text-brass-700">
                          {index + 1}
                        </span>
                        <p className="pt-0.5 text-sm leading-relaxed text-bp-text">{s}</p>
                      </li>
                    ))}
                  </ol>
                  <div className="mt-5 border-t border-border-dim pt-5">
                    <a
                      href={platformInfo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm"
                    >
                      Open {platformInfo.name}
                      <ExternalLink size={14} aria-hidden />
                    </a>
                  </div>
                </Card>
              )}

              {activeTab === 'seo' && (
                <Card
                  hover={false}
                  role="tabpanel"
                  id="publish-panel-seo"
                  aria-labelledby="publish-tab-seo"
                  className="animate-fade-in"
                >
                  <div className="mb-5 flex items-center gap-2">
                    <TrendingUp size={18} className="text-brass-700" aria-hidden />
                    <h3 className="font-semibold text-ink">Rank higher on {platformInfo.name}</h3>
                  </div>
                  <ul className="space-y-3">
                    {platformInfo.seoTips.map((tip, index) => (
                      <li key={index} className="flex gap-3">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brass-700" aria-hidden />
                        <p className="text-sm leading-relaxed text-bp-text">{tip}</p>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {activeTab === 'tags' && (
                <Card
                  hover={false}
                  role="tabpanel"
                  id="publish-panel-tags"
                  aria-labelledby="publish-tab-tags"
                  className="animate-fade-in"
                >
                  {isLoadingTags ? (
                    <GenerationProgress label={`Generating ${platformInfo.tagLabel.toLowerCase()}…`} />
                  ) : showOfferBanner && suggestedTags.length > 0 ? (
                    <div className="mb-5">
                      <EarningsBanner />
                    </div>
                  ) : null}

                  <div className="mb-5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles size={18} className="text-brass-700" aria-hidden />
                      <h3 className="font-semibold text-ink">AI-suggested {platformInfo.tagLabel}</h3>
                    </div>
                    {suggestedTags.length > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          void copy(suggestedTags.map((t) => t.tag).join(' '), 'tags:all')
                        }
                        className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-brass-700"
                      >
                        {copiedKey === 'tags:all' ? <Check size={12} /> : <Copy size={12} />}
                        {copiedKey === 'tags:all' ? 'Copied!' : 'Copy all'}
                      </button>
                    )}
                  </div>

                  {!currentArticle ? (
                    <p className="py-8 text-center text-sm text-text-muted">
                      Select an article first to generate tags
                    </p>
                  ) : suggestedTags.length === 0 && !isLoadingTags ? (
                    <div className="py-8 text-center">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brass-100 text-brass-700">
                        <Wand2 size={24} aria-hidden />
                      </div>
                      <p className="mb-2 font-medium text-ink">
                        Generate {platformInfo.tagLabel} for your article
                      </p>
                      <p className="mx-auto mb-6 max-w-md text-sm text-text-muted">
                        AI will analyze &ldquo;
                        {currentArticle.title.substring(0, 60)}
                        {currentArticle.title.length > 60 ? '…' : ''}&rdquo; and suggest the best{' '}
                        {platformInfo.tagLabel.toLowerCase()} for {platformInfo.name}.
                      </p>
                      <Button onClick={() => void handleSuggestTags()}>
                        <Sparkles size={18} />
                        <span>Generate {platformInfo.tagLabel}</span>
                      </Button>
                    </div>
                  ) : suggestedTags.length > 0 ? (
                    <div id="suggested-tags-result" className="scroll-mt-28 space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {suggestedTags.map((item) => (
                          <button
                            key={item.tag}
                            type="button"
                            aria-label={`Copy tag ${item.tag}`}
                            title={item.reason}
                            onClick={() => void copy(item.tag, `tag:${item.tag}`)}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                              copiedKey === `tag:${item.tag}`
                                ? 'border-[var(--mcv-line-brass)] bg-brass-100 text-brass-700'
                                : 'border-border-dim bg-field text-ink hover:border-[var(--mcv-line-brass)] hover:bg-brass-100/50'
                            }`}
                          >
                            {copiedKey === `tag:${item.tag}` ? (
                              <Check size={12} className="text-brass-700" />
                            ) : (
                              <Copy size={12} className="text-text-muted" />
                            )}
                            {item.tag}
                          </button>
                        ))}
                      </div>
                      <ul className="space-y-1.5 border-t border-border-dim pt-3">
                        {suggestedTags.map((item) => (
                          <li key={`reason-${item.tag}`} className="text-xs text-text-muted">
                            <span className="font-medium text-ink">{item.tag}</span>
                            {' — '}
                            {item.reason}
                          </li>
                        ))}
                      </ul>
                      <div className="flex gap-3 pt-2">
                        <Button
                          onClick={() => void handleSuggestTags()}
                          variant="secondary"
                          className="flex-1"
                        >
                          <Wand2 size={16} />
                          <span>Regenerate</span>
                        </Button>
                        <Button
                          onClick={() =>
                            void copy(suggestedTags.map((t) => t.tag).join(' '), 'tags:all')
                          }
                          className="flex-1"
                        >
                          {copiedKey === 'tags:all' ? <Check size={16} /> : <Copy size={16} />}
                          <span>
                            {copiedKey === 'tags:all'
                              ? 'Copied!'
                              : `Copy all ${platformInfo.tagLabel}`}
                          </span>
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </Card>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PublishPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-center py-32 text-text-muted">
          <Loader2 className="mb-3 h-10 w-10 animate-spin text-brass-700" />
          Loading…
        </div>
      }
    >
      <PublishPageContent />
    </Suspense>
  )
}
