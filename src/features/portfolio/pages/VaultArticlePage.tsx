'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Clock,
  Copy,
  Check,
  Download,
  Edit3,
  Image as ImageIcon,
  LayoutGrid,
  Loader2,
  Send,
  Sparkles,
  Trash2,
  Hash,
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { useAppStore } from '@/store'
import type { Article, ArticleImage, Platform, Snippet } from '@/types'
import { fetchJson } from '@/lib/api-client'
import { copyToClipboard } from '@/lib/clipboard'
import { useToast } from '@/contexts/ToastContext'
import PublishKitDrawer from '@/components/publish/PublishKitDrawer'
import { sanitizeArticleContent } from '@/lib/rapidapi-chat'
import { sanitizePostHtml } from '@/features/blog-builder/lib/sanitize-html'

const PLATFORMS: Platform[] = ['linkedin', 'medium', 'quora', 'reddit', 'twitter', 'facebook']

function primaryPlatform(p: Article['platform']): Platform {
  const raw = Array.isArray(p) ? p[0] : p
  return PLATFORMS.includes(raw as Platform) ? (raw as Platform) : 'linkedin'
}

interface SeoPayload {
  metaTitle: string
  metaDescription: string
  keywords: string[]
}

interface SuggestedTag {
  tag: string
  reason: string
}

function enrichArticle(article: Article): Article {
  const imageMap = useAppStore.getState().articleImages || {}
  const saved = imageMap[article.id]
  if (saved && saved.length > 0) return { ...article, images: saved }
  return article
}

/** Hook/CTA are often stored as HTML — render when tags present, else plain text. */
function looksLikeHtml(s: string) {
  return /<[a-z][\s\S]*>/i.test(s.trim())
}

function escapeHtmlPlain(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function richSnippetHtml(raw: string) {
  const t = raw.trim()
  if (!t) return ''
  if (looksLikeHtml(t)) return sanitizePostHtml(t)
  return `<p>${escapeHtmlPlain(t).replace(/\n/g, '<br />')}</p>`
}

export default function ArticleViewPage() {
  const params = useParams()
  const articleId = typeof params.articleId === 'string' ? params.articleId : ''
  const router = useRouter()
  const { toast } = useToast()
  const [article, setArticle] = useState<Article | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [publishKitOpen, setPublishKitOpen] = useState(false)

  const [seo, setSeo] = useState<SeoPayload | null>(null)
  const [seoLoading, setSeoLoading] = useState(false)
  const [seoErr, setSeoErr] = useState<string | null>(null)

  const [tagPlatform, setTagPlatform] = useState<Platform>('linkedin')
  const [tags, setTags] = useState<SuggestedTag[]>([])
  const [tagsLoading, setTagsLoading] = useState(false)
  const [tagsErr, setTagsErr] = useState<string | null>(null)

  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [snippetsLoading, setSnippetsLoading] = useState(false)

  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const pendingDeletesRef = useRef<Map<string, number>>(new Map())

  const copyText = async (key: string, text: string) => {
    try {
      await copyToClipboard(text)
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 1500)
    } catch {
      toast('Could not copy', { variant: 'error' })
    }
  }

  useEffect(() => {
    if (!articleId) return
    let cancelled = false
    setLoadError(false)
    setArticle(null)

    const resolve = async () => {
      let found = useAppStore.getState().articles.find((a) => a.id === articleId)
      if (!found) {
        const res = await fetchJson<{ articles?: Article[] }>('/api/articles')
        if (cancelled) return
        if (!res.ok) {
          setLoadError(true)
          return
        }
        const list = res.data.articles || []
        useAppStore.getState().setArticles(list)
        found = list.find((a) => a.id === articleId)
      }
      if (cancelled) return
      if (!found) {
        setLoadError(true)
        return
      }
      setLoadError(false)
      setArticle(enrichArticle(found))
      setTagPlatform(primaryPlatform(found.platform))
    }

    void resolve()
    return () => {
      cancelled = true
    }
  }, [articleId])

  const runSeo = useCallback(async (a: Article) => {
    setSeoLoading(true)
    setSeoErr(null)
    const platform = primaryPlatform(a.platform)
    const res = await fetchJson<SeoPayload>('/api/seo-meta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: a.title,
        content: a.content,
        platform,
      }),
    })
    setSeoLoading(false)
    if (!res.ok) {
      setSeoErr(res.error || 'SEO meta failed')
      return
    }
    setSeo(res.data)
  }, [])

  const runTags = useCallback(async (a: Article, platform: Platform) => {
    setTagsLoading(true)
    setTagsErr(null)
    setTags([])
    const res = await fetchJson<{ tags: SuggestedTag[] }>('/api/suggest-tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform,
        articleTitle: a.title,
        articleContent: a.content,
        niche: a.niche || '',
      }),
    })
    setTagsLoading(false)
    if (!res.ok) {
      setTagsErr(res.error || 'Tag suggestions failed')
      return
    }
    if (res.data.tags?.length) setTags(res.data.tags)
  }, [])

  useEffect(() => {
    if (!article) return
    void runSeo(article)
  }, [article, runSeo])

  useEffect(() => {
    if (!article) return
    void runTags(article, tagPlatform)
  }, [article, tagPlatform, runTags])

  useEffect(() => {
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
  }, [])

  const images = useMemo((): ArticleImage[] => {
    if (!article) return []
    const imageMap = useAppStore.getState().articleImages || {}
    const fromMap = imageMap[article.id]
    if (fromMap && fromMap.length > 0) return fromMap
    return article.images || []
  }, [article])

  const handleDownloadImages = async () => {
    if (!article || images.length === 0) return
    for (const img of images) {
      try {
        const resp = await fetch(img.url)
        const blob = await resp.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${article.title.replace(/[^a-z0-9]/gi, '_').substring(0, 40)}_${img.position || img.section}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } catch {
        /* ignore */
      }
    }
  }

  const handleDelete = () => {
    if (!article) return
    const id = article.id
    const snapshot = { ...article }
    useAppStore.getState().deleteArticle(id)
    const existing = pendingDeletesRef.current.get(id)
    if (existing) clearTimeout(existing)
    const timer = window.setTimeout(async () => {
      pendingDeletesRef.current.delete(id)
      const res = await fetchJson(`/api/articles?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        useAppStore.getState().deleteArticleImages(id)
        router.replace('/vault')
        return
      }
      useAppStore.getState().addArticle(snapshot)
      toast(res.error || 'Could not delete article', { variant: 'error' })
    }, 10000)
    pendingDeletesRef.current.set(id, timer)
    toast('Article removed — undo within 10s', {
      durationMs: 10000,
      variant: 'default',
      action: {
        label: 'Undo',
        onClick: () => {
          const t = pendingDeletesRef.current.get(id)
          if (t) clearTimeout(t)
          pendingDeletesRef.current.delete(id)
          useAppStore.getState().addArticle(snapshot)
          router.replace(`/vault/${id}`)
        },
      },
    })
    router.replace('/vault')
  }

  const goEdit = () => {
    if (!article) return
    useAppStore.getState().setCurrentArticle(enrichArticle(article))
    router.push('/write')
  }

  const goPublish = () => {
    if (!article) return
    useAppStore.getState().setCurrentArticle(enrichArticle(article))
    router.push(`/publish?articleId=${article.id}`)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    })
  }

  if (!articleId) {
    router.replace('/vault')
    return null
  }

  if (!article && !loadError) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center py-24 text-bp-muted">
        <Loader2 className="mb-3 h-10 w-10 animate-spin text-bp-blue" />
        Loading article…
      </div>
    )
  }

  if (loadError || !article) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="mb-4 text-ink">Article not found.</p>
        <Link href="/vault" className="text-brass-700 hover:underline">
          Back to Content Reserve
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/vault"
          className="inline-flex items-center gap-2 text-sm text-bp-muted transition-colors hover:text-ink"
        >
          <ArrowLeft size={16} />
          Content Reserve
        </Link>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={goEdit} className="gap-1.5">
            <Edit3 size={16} />
            Edit
          </Button>
          <Button
            size="sm"
            className="gap-1.5 border border-info bg-brass-100 text-info hover:bg-brass-200"
            onClick={() => setPublishKitOpen(true)}
          >
            <LayoutGrid size={16} />
            Publish kit
          </Button>
          <Button size="sm" onClick={goPublish} className="gap-1.5">
            <Send size={16} />
            Publish
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDelete} className="gap-1.5 text-bp-error hover:bg-brass-100">
            <Trash2 size={16} />
            Delete
          </Button>
        </div>
      </div>

      <div className="mb-8">
        <h1 className="mb-3 text-2xl font-bold text-ink sm:text-3xl" style={{ fontFamily: 'var(--font-display)' }}>
          {article.title}
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-xs text-bp-muted">
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {formatDate(article.created_at)}
          </span>
          <Badge variant={article.status === 'published' ? 'success' : 'purple'} className="text-[10px]">
            {article.status}
          </Badge>
          <Badge variant="magenta" className="text-[10px]">
            {Array.isArray(article.platform) ? article.platform.join(', ') : article.platform}
          </Badge>
        </div>
      </div>

      <Card className="mb-8 border border-border-dim p-6 sm:p-8">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-bp-muted">Article</h2>
        <div
          className="prose-bp max-h-[min(70vh,720px)] overflow-y-auto pr-1 text-[15px] leading-relaxed scrollbar-custom"
          dangerouslySetInnerHTML={{ __html: sanitizeArticleContent(article.content) }}
        />
      </Card>

      {(article.hook || article.cta || article.affiliate_link) && (
        <Card className="mb-8 space-y-6 border border-border-dim p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-bp-muted">Hook & call to action</h2>
          {article.hook && (
            <div>
              <p className="mb-2 text-xs font-medium text-brass-700/90">Hook</p>
              <div
                className="prose-bp max-w-none text-[15px] leading-relaxed [&_a]:text-bp-teal [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: richSnippetHtml(article.hook) }}
              />
            </div>
          )}
          {article.cta && (
            <div>
              <p className="mb-2 text-xs font-medium text-brass-700/90">Call to action</p>
              <div
                className="prose-bp max-w-none text-[15px] leading-relaxed [&_a]:text-bp-teal [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: richSnippetHtml(article.cta) }}
              />
            </div>
          )}
          {article.affiliate_link && (
            <div>
              <p className="mb-2 text-xs font-medium text-brass-700/90">Affiliate link</p>
              <a
                href={article.affiliate_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-border-dim bg-surface px-3 py-2 text-sm text-info break-all hover:border-info hover:bg-brass-100"
              >
                {article.affiliate_link}
              </a>
            </div>
          )}
        </Card>
      )}

      {images.length > 0 && (
        <Card className="mb-8 border border-border-dim p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-bp-muted">Images</h2>
            <Button variant="ghost" size="sm" onClick={() => void handleDownloadImages()} className="gap-1.5">
              <Download size={14} />
              Download all
            </Button>
          </div>
          <div className="flex flex-wrap gap-3">
            {images.map((img) => (
              <a
                key={img.id}
                href={img.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block h-28 w-28 overflow-hidden rounded-xl border border-border-dim bg-black/40"
              >
                <img src={img.url} alt={img.alt || img.section} className="h-full w-full object-cover" />
              </a>
            ))}
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-success/90">
            <ImageIcon size={13} />
            {images.length} image{images.length !== 1 ? 's' : ''} generated for this article
          </p>
        </Card>
      )}

      <Card className="mb-8 border border-border-dim p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Sparkles size={16} className="text-brass-700" />
            SEO meta
          </h2>
          <Button size="sm" variant="secondary" onClick={() => void runSeo(article)} loading={seoLoading}>
            Regenerate
          </Button>
        </div>
        {seoErr && <p className="mb-2 text-sm text-bp-error">{seoErr}</p>}
        {seoLoading && !seo && <p className="text-sm text-bp-muted">Generating SEO meta…</p>}
        {seo && (
          <div className="space-y-3 rounded-xl border border-border-dim bg-field p-4 text-sm">
            <div>
              <p className="mb-1 text-xs text-bp-muted">Meta title</p>
              <p className="text-ink">{seo.metaTitle}</p>
              <Button size="sm" variant="ghost" className="mt-2" onClick={() => void copyText('mt', seo.metaTitle)}>
                {copiedKey === 'mt' ? <Check size={14} /> : <Copy size={14} />}
                <span className="ml-1">Copy</span>
              </Button>
            </div>
            <div>
              <p className="mb-1 text-xs text-bp-muted">Meta description</p>
              <p className="leading-relaxed text-ink-2">{seo.metaDescription}</p>
              <Button size="sm" variant="ghost" className="mt-2" onClick={() => void copyText('md', seo.metaDescription)}>
                {copiedKey === 'md' ? <Check size={14} /> : <Copy size={14} />}
                <span className="ml-1">Copy</span>
              </Button>
            </div>
            {seo.keywords && seo.keywords.length > 0 && (
              <div>
                <p className="mb-1 text-xs text-bp-muted">Keywords</p>
                <p className="text-xs text-ink-2">{seo.keywords.join(', ')}</p>
                <Button size="sm" variant="ghost" className="mt-2" onClick={() => void copyText('kw', seo.keywords.join(', '))}>
                  {copiedKey === 'kw' ? <Check size={14} /> : <Copy size={14} />}
                  <span className="ml-1">Copy</span>
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      <Card className="mb-8 border border-border-dim p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Hash size={16} className="text-violet-400" />
            Tags & hashtags
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={tagPlatform}
              onChange={(e) => setTagPlatform(e.target.value as Platform)}
              className="rounded-lg border border-white/[0.12] bg-[rgb(10,14,22)] px-2 py-1.5 text-xs text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400/60"
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <Button size="sm" variant="secondary" onClick={() => void runTags(article, tagPlatform)} loading={tagsLoading}>
              Suggest
            </Button>
          </div>
        </div>
        {tagsErr && <p className="mb-2 text-sm text-bp-error">{tagsErr}</p>}
        {tagsLoading && tags.length === 0 && <p className="text-sm text-bp-muted">Loading tag ideas…</p>}
        {tags.length > 0 && (
          <ul className="space-y-2">
            {tags.map((t) => (
              <li
                key={t.tag}
                className="flex items-start justify-between gap-2 rounded-lg border border-border-dim bg-field px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-info">{t.tag}</p>
                  <p className="text-xs text-bp-muted">{t.reason}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void copyText(`tag-${t.tag}`, t.tag)}
                  className="shrink-0 rounded-md p-1.5 text-ink-4 hover:bg-raised hover:text-ink"
                  aria-label={`Copy ${t.tag}`}
                >
                  {copiedKey === `tag-${t.tag}` ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </li>
            ))}
            <Button size="sm" variant="ghost" onClick={() => void copyText('alltags', tags.map((x) => x.tag).join(' '))}>
              {copiedKey === 'alltags' ? <Check size={14} /> : <Copy size={14} />}
              <span className="ml-1">Copy all tags</span>
            </Button>
          </ul>
        )}
      </Card>

      <Card className="mb-10 border border-border-dim p-6">
        <h2 className="mb-1 text-sm font-semibold text-ink">Snippet library</h2>
        <p className="mb-4 text-xs text-bp-muted">Account-wide saved CTAs and bios — copy while you publish.</p>
        {snippetsLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-bp-blue" />
          </div>
        ) : snippets.length === 0 ? (
          <p className="text-sm text-bp-muted">
            No snippets yet.{' '}
            <Link href="/links" className="text-brass-700 hover:underline">
              Add some in the library
            </Link>
          </p>
        ) : (
          <ul className="space-y-3">
            {snippets.map((s) => (
              <li key={s.id} className="rounded-lg border border-border-dim bg-field p-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-semibold text-ink">{s.title}</span>
                  <Badge variant={s.kind === 'cta' ? 'success' : 'purple'} className="shrink-0 text-[9px] uppercase">
                    {s.kind}
                  </Badge>
                </div>
                <p className="mb-2 line-clamp-3 text-[11px] leading-snug text-ink-4">{s.body}</p>
                <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => void copyText(`sn-${s.id}`, s.body)}>
                  {copiedKey === `sn-${s.id}` ? <Check size={14} /> : <Copy size={14} />}
                  <span className="ml-1">Copy text</span>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <PublishKitDrawer article={article} open={publishKitOpen} onClose={() => setPublishKitOpen(false)} />
    </div>
  )
}
