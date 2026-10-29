'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  FileText,
  Search,
  Copy,
  Trash2,
  MoreVertical,
  Clock,
  Check,
  Linkedin,
  MessageSquare,
  Hash,
  Twitter,
  LayoutGrid,
  Download,
  Image as ImageIcon,
  Plus,
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { PageContainer } from '@/components/ui/page-container'
import PageHeader from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { useAppStore } from '@/store'
import { Article, Platform } from '@/types'
import { fetchJson } from '@/lib/api-client'
import { copyToClipboard } from '@/lib/clipboard'
import { useToast } from '@/contexts/ToastContext'
import PublishKitDrawer from '@/components/publish/PublishKitDrawer'
import { markPublishCopyDone } from '@/lib/onboarding'

const platformIcons: Record<string, typeof Linkedin> = {
  linkedin: Linkedin,
  quora: MessageSquare,
  medium: FileText,
  reddit: Hash,
  twitter: Twitter,
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  })
}

function platformLabel(platform: Platform | string[]) {
  if (Array.isArray(platform)) return platform.join(', ')
  return platform.charAt(0).toUpperCase() + platform.slice(1)
}

function platformIcon(platform: Platform | string[]) {
  const first = Array.isArray(platform) ? platform[0] : platform
  return platformIcons[first] || FileText
}

const chipBtn = (active: boolean) =>
  `inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium capitalize transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-500 ${
    active
      ? 'bg-brass-100 text-brass-700'
      : 'bg-field text-ink-4 hover:text-ink'
  }`

export default function MyPortfolioPage() {
  const router = useRouter()
  const { toast } = useToast()
  const articleImages = useAppStore((s) => s.articleImages)

  const [articles, setArticles] = useState<Article[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all')
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [publishKitArticle, setPublishKitArticle] = useState<Article | null>(null)
  const [publishKitOpen, setPublishKitOpen] = useState(false)
  const pendingDeletesRef = useRef<Map<string, number>>(new Map())
  const menuRef = useRef<HTMLDivElement | null>(null)

  const enrichWithImages = (list: Article[]): Article[] => {
    const imageMap = useAppStore.getState().articleImages || {}
    return list.map((a) => {
      if (a.images?.length) return a
      const saved = imageMap[a.id]
      return saved?.length ? { ...a, images: saved } : a
    })
  }

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setIsLoading(true)
      const res = await fetchJson<{ articles?: Article[] }>('/api/articles')
      if (cancelled) return
      if (res.ok) {
        const fetchedArticles: Article[] = res.data.articles || []
        const final = enrichWithImages(fetchedArticles)
        setArticles(final)
        useAppStore.getState().setArticles(final)
      } else {
        if (res.status !== 401) {
          toast(
            res.error || "Could not load articles. Showing this browser's saved copy.",
            { variant: 'error' }
          )
        }
        setArticles(enrichWithImages(useAppStore.getState().articles))
      }
      setIsLoading(false)
    }
    void load()
    return () => {
      cancelled = true
    }
    // ponytail: load once on mount; toast identity stable enough for vault hydrate
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!openMenu) return
    const onPointer = (e: PointerEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return
      setOpenMenu(null)
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [openMenu])

  const counts = useMemo(() => {
    let draft = 0
    let published = 0
    for (const a of articles) {
      if (a.status === 'draft') draft += 1
      else if (a.status === 'published') published += 1
    }
    return { total: articles.length, draft, published }
  }, [articles])

  const q = searchQuery.trim().toLowerCase()

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      const matchesSearch =
        !q ||
        article.title.toLowerCase().includes(q) ||
        stripHtml(article.content).toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'all' || article.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [articles, q, statusFilter])

  const imagesFor = useCallback(
    (article: Article) => {
      const fromMap = articleImages[article.id]
      if (fromMap?.length) return fromMap
      if (article.images?.length) return article.images
      return []
    },
    [articleImages]
  )

  const handleCopy = async (article: Article) => {
    await copyToClipboard(article.content)
    markPublishCopyDone()
    setCopiedId(article.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleDelete = (id: string) => {
    const article = articles.find((a) => a.id === id)
    if (!article) return
    setOpenMenu(null)

    const snapshot = { ...article }
    setArticles((prev) => prev.filter((a) => a.id !== id))
    useAppStore.getState().deleteArticle(id)

    const existing = pendingDeletesRef.current.get(id)
    if (existing) clearTimeout(existing)

    const timer = window.setTimeout(async () => {
      pendingDeletesRef.current.delete(id)
      const res = await fetchJson(`/api/articles?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        useAppStore.getState().deleteArticleImages(id)
        return
      }
      useAppStore.getState().addArticle(snapshot)
      setArticles((prev) => (prev.some((a) => a.id === id) ? prev : [snapshot, ...prev]))
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
          setArticles((prev) => (prev.some((a) => a.id === id) ? prev : [snapshot, ...prev]))
        },
      },
    })
  }

  const handleDownloadImages = async (e: React.MouseEvent, article: Article) => {
    e.stopPropagation()
    const imgs = imagesFor(article)
    if (imgs.length === 0) return
    for (const img of imgs) {
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
        /* skip bad image */
      }
    }
  }

  return (
    <PageContainer>
      <PageHeader
        eyebrow="My Vault"
        title="Content Reserve"
        subtitle="Your saved articles, ready to publish"
        actions={
          <Button
            size="sm"
            className="!h-9 md:!h-9 gap-1.5 px-3 text-sm"
            onClick={() => router.push('/write')}
          >
            <Plus size={14} />
            <span>Craft</span>
          </Button>
        }
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <Input
            placeholder="Search articles…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search size={18} />}
            aria-label="Search articles"
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Status filter">
          {(['all', 'draft', 'published'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={chipBtn(statusFilter === status)}
            >
              <span>{status}</span>
              {status !== 'all' && (
                <span className="tabular-nums opacity-70">
                  {status === 'draft' ? counts.draft : counts.published}
                </span>
              )}
              {status === 'all' && (
                <span className="tabular-nums opacity-70">{counts.total}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3" aria-busy="true" aria-live="polite">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-2xl bg-brass-100/70"
              aria-hidden
            />
          ))}
        </div>
      ) : filteredArticles.length > 0 ? (
        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {filteredArticles.map((article, index) => {
              const PlatformIcon = platformIcon(article.platform)
              const imgs = imagesFor(article)
              const preview = stripHtml(article.content).slice(0, 160)

              return (
                <motion.li
                  key={article.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.16, delay: Math.min(index * 0.02, 0.2) }}
                >
                  <Card
                    className="group cursor-pointer transition-colors hover:border-brass-300/60 hover:bg-raised/40"
                    onClick={() => router.push(`/vault/${article.id}`)}
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brass-100 text-brass-700">
                        <PlatformIcon size={18} aria-hidden />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-1.5 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="brand-font text-lg leading-snug text-ink line-clamp-1">
                              {article.title}
                            </h3>
                            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-ink-4">
                              <span className="inline-flex items-center gap-1">
                                <Clock size={12} aria-hidden />
                                {formatDate(article.created_at)}
                              </span>
                              <Badge
                                variant={article.status === 'published' ? 'success' : 'default'}
                                className="text-[11px] capitalize"
                              >
                                {article.status}
                              </Badge>
                              <Badge variant="magenta" className="text-[11px]">
                                {platformLabel(article.platform)}
                              </Badge>
                            </div>
                          </div>

                          <div
                            className="flex shrink-0 flex-wrap items-center justify-end gap-1"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => void handleCopy(article)}
                              title="Copy article"
                              aria-label="Copy article"
                            >
                              {copiedId === article.id ? <Check size={16} /> : <Copy size={16} />}
                            </Button>
                            <Button
                              size="sm"
                              className="gap-1.5 border border-border-dim bg-brass-100 text-brass-700 hover:bg-brass-200"
                              onClick={() => {
                                setPublishKitArticle(article)
                                setPublishKitOpen(true)
                              }}
                            >
                              <LayoutGrid size={15} aria-hidden />
                              <span className="hidden sm:inline">Publish kit</span>
                            </Button>

                            <div
                              className="relative"
                              ref={openMenu === article.id ? menuRef : undefined}
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setOpenMenu(openMenu === article.id ? null : article.id)
                                }
                                title="More"
                                aria-expanded={openMenu === article.id}
                                aria-haspopup="menu"
                              >
                                <MoreVertical size={16} />
                              </Button>

                              {openMenu === article.id && (
                                <div
                                  role="menu"
                                  className="absolute right-0 top-full z-10 mt-1 w-40 rounded-xl border border-border-dim bg-raised py-1 shadow-xl"
                                >
                                  <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => handleDelete(article.id)}
                                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-error hover:bg-error/10"
                                  >
                                    <Trash2 size={14} aria-hidden />
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {preview && (
                          <p className="text-sm text-ink-4 line-clamp-2">{preview}</p>
                        )}

                        {imgs.length > 0 && (
                          <div
                            className="mt-3 flex items-center gap-3 border-t border-border-dim pt-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center gap-1.5">
                              {imgs.slice(0, 4).map((img, i) => (
                                <div
                                  key={img.url + i}
                                  className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-border-dim bg-canvas"
                                >
                                  <img
                                    src={img.url}
                                    alt={img.alt || img.section}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                  />
                                </div>
                              ))}
                            </div>
                            <span className="inline-flex items-center gap-1 text-xs text-success">
                              <ImageIcon size={12} aria-hidden />
                              {imgs.length}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => void handleDownloadImages(e, article)}
                              className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-border-dim px-3 py-1.5 text-xs text-brass-700 transition-colors hover:border-brass-300 hover:text-ink"
                            >
                              <Download size={13} aria-hidden />
                              Download
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ul>
      ) : searchQuery || statusFilter !== 'all' ? (
        <EmptyState
          icon={Search}
          title="No match"
          description="Try a different search or status filter."
        />
      ) : (
        <EmptyState
          icon={FileText}
          title="No articles yet"
          description="Write once — it lands here ready to publish."
          action={{ label: 'Create article', href: '/write' }}
        />
      )}

      <PublishKitDrawer
        article={publishKitArticle}
        open={publishKitOpen}
        onClose={() => setPublishKitOpen(false)}
      />
    </PageContainer>
  )
}
