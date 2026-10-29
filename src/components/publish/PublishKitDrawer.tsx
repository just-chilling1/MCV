'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { X, Copy, Check, Sparkles, Hash, Image as ImageIcon, ExternalLink, Megaphone, ChevronDown } from 'lucide-react'
import { useAppStore } from '@/store'
import type { Article, Platform } from '@/types'
import { fetchJson } from '@/lib/api-client'
import { copyToClipboard } from '@/lib/clipboard'
import { useToast } from '@/contexts/ToastContext'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

interface SeoPayload {
  metaTitle: string
  metaDescription: string
  keywords: string[]
  ogTitle?: string
  ogDescription?: string
}

interface TagRow {
  tag: string
  reason: string
}

interface TenxPost {
  hook: string
  body: string
  cta: string
}

function CollapsibleResultSection({
  title,
  count,
  defaultOpen = true,
  children,
}: {
  title: string
  count?: number
  defaultOpen?: boolean
  children: ReactNode
}) {
  return (
    <details
      open={defaultOpen}
      className="group overflow-hidden rounded-xl border border-border-dim bg-field"
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 transition-colors hover:bg-brass-100 [&::-webkit-details-marker]:hidden">
        <ChevronDown
          size={16}
          className="shrink-0 text-ink-4 transition-transform group-open:rotate-180"
        />
        <span className="min-w-0 flex-1 text-sm font-medium text-ink">{title}</span>
        {count !== undefined && (
          <span className="shrink-0 rounded-full bg-field px-2 py-0.5 text-[11px] text-bp-muted">
            {count}
          </span>
        )}
      </summary>
      <div className="space-y-1.5 border-t border-border-dim p-2">{children}</div>
    </details>
  )
}

function CollapsibleResultItem({
  label,
  preview,
  children,
  defaultOpen = false,
}: {
  label: string
  preview?: string
  children: ReactNode
  defaultOpen?: boolean
}) {
  return (
    <details
      open={defaultOpen}
      className="group overflow-hidden rounded-lg border border-border-dim bg-[rgb(8,11,18)]/40"
    >
      <summary className="flex cursor-pointer list-none items-start gap-2 px-3 py-2.5 transition-colors hover:bg-brass-100 [&::-webkit-details-marker]:hidden">
        <ChevronDown
          size={14}
          className="mt-0.5 shrink-0 text-ink-4 transition-transform group-open:rotate-180"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-bp-muted">{label}</p>
          {preview && (
            <p className="mt-0.5 line-clamp-2 text-sm text-ink-2 group-open:hidden">{preview}</p>
          )}
        </div>
      </summary>
      <div className="border-t border-border-dim px-3 py-2.5">{children}</div>
    </details>
  )
}

interface ArticleKitResults {
  seo: SeoPayload | null
  tags: TagRow[]
  headlines: string[]
  tenxPosts: TenxPost[]
}

function emptyKitResults(): ArticleKitResults {
  return { seo: null, tags: [], headlines: [], tenxPosts: [] }
}

export default function PublishKitDrawer({
  article,
  open,
  onClose,
}: {
  article: Article | null
  open: boolean
  onClose: () => void
}) {
  const { toast } = useToast()
  const articleImages = useAppStore((s) => s.articleImages)

  const [kitByArticle, setKitByArticle] = useState<Record<string, ArticleKitResults>>({})
  const [seoLoading, setSeoLoading] = useState(false)
  const [tagsLoading, setTagsLoading] = useState(false)
  const [tagPlatform, setTagPlatform] = useState<Platform>('linkedin')
  const [headlinesLoading, setHeadlinesLoading] = useState(false)
  const [tenxLoading, setTenxLoading] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const kit = article ? (kitByArticle[article.id] ?? emptyKitResults()) : emptyKitResults()
  const { seo, tags, headlines, tenxPosts } = kit

  const updateKit = (articleId: string, patch: Partial<ArticleKitResults>) => {
    setKitByArticle((prev) => ({
      ...prev,
      [articleId]: { ...(prev[articleId] ?? emptyKitResults()), ...patch },
    }))
  }

  const firstPlatform = useMemo((): string => {
    if (!article) return 'linkedin'
    return Array.isArray(article.platform) ? article.platform[0] : article.platform
  }, [article])

  useEffect(() => {
    if (article && open) {
      const p = (Array.isArray(article.platform) ? article.platform[0] : article.platform) as Platform
      if (['linkedin', 'medium', 'quora', 'reddit', 'twitter', 'facebook'].includes(p)) {
        setTagPlatform(p)
      }
    }
  }, [article, open])

  const images = useMemo(() => {
    if (!article) return []
    const fromStore = articleImages[article.id]
    if (fromStore && fromStore.length > 0) return fromStore
    return article.images || []
  }, [article, articleImages])

  const copy = async (key: string, text: string) => {
    try {
      await copyToClipboard(text)
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 1500)
    } catch {
      toast('Could not copy to clipboard', { variant: 'error' })
    }
  }

  const runSeo = async () => {
    if (!article) return
    setSeoLoading(true)
    const res = await fetchJson<SeoPayload>('/api/seo-meta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: article.title,
        content: article.content,
        platform: firstPlatform,
      }),
    })
    setSeoLoading(false)
    if (!res.ok) {
      toast(res.error, { variant: 'error' })
      return
    }
    updateKit(article.id, { seo: res.data })
    toast('SEO meta generated', { variant: 'success' })
  }

  const runTags = async () => {
    if (!article) return
    setTagsLoading(true)
    const res = await fetchJson<{ tags: TagRow[] }>('/api/suggest-tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: tagPlatform,
        articleTitle: article.title,
        articleContent: article.content,
        niche: article.niche || '',
      }),
    })
    setTagsLoading(false)
    if (!res.ok) {
      toast(res.error, { variant: 'error' })
      return
    }
    updateKit(article.id, { tags: res.data.tags || [] })
  }

  const runHeadlines = async () => {
    if (!article) return
    setHeadlinesLoading(true)
    const nicheLabel = article.niche || article.title
    const res = await fetchJson<{ headlines?: string[] }>('/api/suggest-headlines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        affiliateLink: article.affiliate_link || '',
        niche: nicheLabel,
        topic: article.title,
        previousHeadlines: [],
      }),
    })
    setHeadlinesLoading(false)
    if (!res.ok) {
      toast(res.error, { variant: 'error' })
      return
    }
    const list = res.data.headlines
    updateKit(article.id, { headlines: Array.isArray(list) ? list : [] })
  }

  const runTenx = async () => {
    if (!article?.affiliate_link) {
      toast('Add an affiliate link to this article to generate 10X posts.', { variant: 'info' })
      return
    }
    setTenxLoading(true)
    const res = await fetchJson<{ posts: TenxPost[] }>('/api/generate-posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        link: article.affiliate_link,
        linkName: article.title,
      }),
    })
    setTenxLoading(false)
    if (!res.ok) {
      toast(res.error, { variant: 'error' })
      return
    }
    updateKit(article.id, { tenxPosts: res.data.posts || [] })
  }

  if (!article) return null

  return (
    <div
      className={`fixed inset-0 z-[160] flex justify-end transition-opacity duration-200 ${
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="publish-kit-title"
      aria-hidden={!open}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Close publish kit"
        onClick={onClose}
      />
      <div
        className={`relative flex h-full w-full max-w-lg flex-col border-l border-border-dim bg-[rgb(8,11,18)]/95 shadow-2xl backdrop-blur-2xl transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border-dim p-5">
          <div className="min-w-0">
            <p id="publish-kit-title" className="text-xs font-bold uppercase tracking-widest text-brass-700/80">
              Publish kit
            </p>
            <h2 className="mt-1 truncate text-lg font-semibold text-ink">{article.title}</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="purple" className="text-[10px]">
                {firstPlatform}
              </Badge>
              <Badge variant={article.status === 'published' ? 'success' : 'magenta'} className="text-[10px]">
                {article.status}
              </Badge>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-ink-4 hover:bg-raised hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400/60"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-8">
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                <Sparkles size={16} className="text-brass-700" />
                SEO meta
              </h3>
              <Button size="sm" variant="secondary" onClick={runSeo} loading={seoLoading}>
                Generate
              </Button>
            </div>
            {seo && (
              <CollapsibleResultSection
                title="Generated SEO meta"
                count={
                  2 +
                  (seo.keywords?.length ? 1 : 0) +
                  (seo.ogTitle ? 1 : 0) +
                  (seo.ogDescription ? 1 : 0)
                }
              >
                <CollapsibleResultItem label="Meta title" preview={seo.metaTitle} defaultOpen>
                  <button
                    type="button"
                    onClick={() => copy('mt', seo.metaTitle)}
                    className="flex w-full items-start gap-2 text-left text-sm text-ink-2 hover:text-info"
                  >
                    {copiedKey === 'mt' ? <Check size={14} className="mt-0.5 shrink-0" /> : <Copy size={14} className="mt-0.5 shrink-0 opacity-60" />}
                    <span>{seo.metaTitle}</span>
                  </button>
                </CollapsibleResultItem>
                <CollapsibleResultItem label="Meta description" preview={seo.metaDescription}>
                  <p className="text-sm leading-relaxed text-ink-2">{seo.metaDescription}</p>
                  <Button size="sm" variant="ghost" className="mt-2" onClick={() => copy('md', seo.metaDescription)}>
                    {copiedKey === 'md' ? <Check size={14} /> : <Copy size={14} />}
                    <span>Copy description</span>
                  </Button>
                </CollapsibleResultItem>
                {seo.keywords?.length > 0 && (
                  <CollapsibleResultItem label="Keywords" preview={seo.keywords.join(', ')}>
                    <p className="text-sm text-ink-2">{seo.keywords.join(', ')}</p>
                    <Button size="sm" variant="ghost" className="mt-2" onClick={() => copy('kw', seo.keywords.join(', '))}>
                      {copiedKey === 'kw' ? <Check size={14} /> : <Copy size={14} />}
                      <span>Copy keywords</span>
                    </Button>
                  </CollapsibleResultItem>
                )}
                {seo.ogTitle && (
                  <CollapsibleResultItem label="Open Graph title" preview={seo.ogTitle}>
                    <p className="text-sm text-ink-2">{seo.ogTitle}</p>
                    <Button size="sm" variant="ghost" className="mt-2" onClick={() => copy('ogt', seo.ogTitle!)}>
                      {copiedKey === 'ogt' ? <Check size={14} /> : <Copy size={14} />}
                      <span>Copy OG title</span>
                    </Button>
                  </CollapsibleResultItem>
                )}
                {seo.ogDescription && (
                  <CollapsibleResultItem label="Open Graph description" preview={seo.ogDescription}>
                    <p className="text-sm text-ink-2">{seo.ogDescription}</p>
                    <Button size="sm" variant="ghost" className="mt-2" onClick={() => copy('ogd', seo.ogDescription!)}>
                      {copiedKey === 'ogd' ? <Check size={14} /> : <Copy size={14} />}
                      <span>Copy OG description</span>
                    </Button>
                  </CollapsibleResultItem>
                )}
              </CollapsibleResultSection>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                <Hash size={16} className="text-violet-400" />
                Tags / hashtags
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={tagPlatform}
                  onChange={(e) => setTagPlatform(e.target.value as Platform)}
                  className="rounded-lg border border-white/[0.12] bg-[rgb(10,14,22)] px-2 py-1.5 text-xs text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400/60"
                >
                  {(['linkedin', 'medium', 'quora', 'reddit', 'twitter', 'facebook'] as const).map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <Button size="sm" variant="secondary" onClick={runTags} loading={tagsLoading}>
                  Suggest
                </Button>
              </div>
            </div>
            {tags.length > 0 && (
              <CollapsibleResultSection title="Suggested tags" count={tags.length}>
                {tags.map((t) => (
                  <CollapsibleResultItem key={t.tag} label={t.tag} preview={t.reason}>
                    <p className="text-sm leading-relaxed text-ink-2">{t.reason}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button size="sm" variant="ghost" onClick={() => copy(`tag-${t.tag}`, t.tag)}>
                        {copiedKey === `tag-${t.tag}` ? <Check size={14} /> : <Copy size={14} />}
                        <span>Copy tag</span>
                      </Button>
                    </div>
                  </CollapsibleResultItem>
                ))}
                <Button size="sm" variant="ghost" className="mt-1 w-full" onClick={() => copy('alltags', tags.map((x) => x.tag).join(' '))}>
                  {copiedKey === 'alltags' ? <Check size={14} /> : <Copy size={14} />}
                  <span>Copy all tags</span>
                </Button>
              </CollapsibleResultSection>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-ink">Headline options</h3>
              <Button size="sm" variant="secondary" onClick={runHeadlines} loading={headlinesLoading}>
                Suggest 5
              </Button>
            </div>
            {headlines.length > 0 && (
              <CollapsibleResultSection title="Headline options" count={headlines.length}>
                {headlines.map((h, i) => (
                  <CollapsibleResultItem key={i} label={`Option ${i + 1}`} preview={h}>
                    <p className="text-sm leading-snug text-ink-2">{h}</p>
                    <Button size="sm" variant="ghost" className="mt-2" onClick={() => copy(`h-${i}`, h)}>
                      {copiedKey === `h-${i}` ? <Check size={14} /> : <Copy size={14} />}
                      <span>Copy headline</span>
                    </Button>
                  </CollapsibleResultItem>
                ))}
              </CollapsibleResultSection>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
              <Megaphone size={16} className="text-warning" />
              10X posts
            </h3>
            <>
                <Button size="sm" variant="secondary" onClick={runTenx} loading={tenxLoading}>
                  Generate 10 posts
                </Button>
                {tenxPosts.length > 0 && (
                  <CollapsibleResultSection title="Generated posts" count={tenxPosts.length}>
                    {tenxPosts.map((p, i) => (
                      <CollapsibleResultItem key={i} label={`Post ${i + 1}`} preview={p.hook}>
                        <div className="space-y-2 text-sm text-ink-2">
                          <p className="font-medium text-ink">{p.hook}</p>
                          <p>{p.body}</p>
                          <p className="text-info">{p.cta}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="mt-2"
                          onClick={() => copy(`10x-${i}`, `${p.hook}\n\n${p.body}\n\n${p.cta}`)}
                        >
                          {copiedKey === `10x-${i}` ? <Check size={14} /> : <Copy size={14} />}
                          <span>Copy post</span>
                        </Button>
                      </CollapsibleResultItem>
                    ))}
                  </CollapsibleResultSection>
                )}
            </>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
              <ImageIcon size={16} className="text-success" />
              Image slots
            </h3>
            {images.length === 0 ? (
              <p className="text-sm text-bp-muted">No images yet — open Images to add visuals.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {images.map((img) => (
                  <a
                    key={img.id}
                    href={img.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative aspect-square overflow-hidden rounded-lg border border-border-dim"
                  >
                    <img src={img.url} alt={img.alt} className="h-full w-full object-cover" />
                    <ExternalLink
                      size={14}
                      className="absolute right-1 top-1 text-ink opacity-0 drop-shadow group-hover:opacity-100"
                    />
                  </a>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-2 border-t border-border-dim pt-6">
            <Button className="w-full" onClick={() => copy('body', article.content.replace(/<[^>]+>/g, ' '))}>
              {copiedKey === 'body' ? <Check size={16} /> : <Copy size={16} />}
              <span>Copy plain article text</span>
            </Button>
            <Button variant="secondary" className="w-full" onClick={() => copy('html', article.content)}>
              {copiedKey === 'html' ? <Check size={16} /> : <Copy size={16} />}
              <span>Copy HTML</span>
            </Button>
            <Link href="/publish" onClick={onClose} className="block">
              <Button variant="ghost" className="w-full">
                Open Broadcast wizard
              </Button>
            </Link>
          </section>
        </div>
      </div>
    </div>
  )
}
