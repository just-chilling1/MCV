'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Image as ImageIcon,
  Upload,
  Wand2,
  ArrowLeft,
  Check,
  Loader2,
  Eye,
  Save,
  Send,
  X,
  Maximize2,
  FileText,
  RefreshCw,
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import { PageContainer } from '@/components/ui/page-container'
import PageHeader from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { useAppStore } from '@/store'
import type { Article, ArticleImage } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { fetchJson } from '@/lib/api-client'
import { useToast } from '@/contexts/ToastContext'
import { SaveStatusBar } from '@/components/ui/SaveStatusBar'
import GenerationProgress from '@/components/ui/generation-progress'
import EarningsBanner from '@/components/ui/earnings-banner'
import { useScrollOnGenerationComplete } from '@/hooks/use-scroll-on-generation-complete'
import {
  ARTICLE_IMAGE_FRAMINGS,
  ARTICLE_IMAGE_SLOTS,
  buildArticleImagePrompt,
} from '@/features/article-images/lib/article-image-slots'

const imageSections = ARTICLE_IMAGE_SLOTS

function stripHtml(content: string) {
  if (!content) return ''
  return content
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
}

export default function ImagesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const {
    currentArticle,
    articles,
    setArticles,
    setCurrentArticle,
    updateArticle,
    saveArticleImages,
  } = useAppStore()

  const [slotUrls, setSlotUrls] = useState<Record<string, string>>({})
  const [generatingSlots, setGeneratingSlots] = useState<Record<string, boolean>>({})
  const [uploadingSlots, setUploadingSlots] = useState<Record<string, boolean>>({})
  const [selectedSlots, setSelectedSlots] = useState<Record<string, string>>({})
  const [viewMode, setViewMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveUi, setSaveUi] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [saveUiAt, setSaveUiAt] = useState<Date | null>(null)
  const [showOfferBanner, setShowOfferBanner] = useState(false)
  const [failedSlotId, setFailedSlotId] = useState<string | null>(null)
  const [fullscreenImage, setFullscreenImage] = useState<{ url: string; alt: string } | null>(null)
  const [scrollTargetSlotId, setScrollTargetSlotId] = useState<string | null>(null)
  const [loadingArticles, setLoadingArticles] = useState(articles.length === 0)

  const closeFullscreen = useCallback(() => setFullscreenImage(null), [])

  const saveStatus =
    saveUi === 'saving' || isSaving
      ? 'saving'
      : saveUi === 'saved'
        ? 'saved'
        : saveUi === 'error'
          ? 'error'
          : 'idle'

  useEffect(() => {
    if (!fullscreenImage) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeFullscreen()
    }
    window.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [fullscreenImage, closeFullscreen])

  useEffect(() => {
    if (articles.length > 0) {
      setLoadingArticles(false)
      return
    }
    let cancelled = false
    void (async () => {
      const res = await fetchJson<{ articles?: Article[] }>('/api/articles')
      if (cancelled) return
      if (!res.ok) {
        if (res.status !== 401) toast(res.error || 'Could not load articles', { variant: 'error' })
        setLoadingArticles(false)
        return
      }
      const fetched = res.data.articles ?? []
      setArticles(
        fetched.map((a) => {
          if (a.images?.length) return a
          const saved = useAppStore.getState().articleImages?.[a.id]
          return saved?.length ? { ...a, images: saved } : a
        })
      )
      setLoadingArticles(false)
    })()
    return () => {
      cancelled = true
    }
    // ponytail: hydrate articles once when store empty
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!currentArticle) {
      setSlotUrls({})
      setSelectedSlots({})
      return
    }
    const imageMap = useAppStore.getState().articleImages || {}
    const saved = imageMap[currentArticle.id]?.length
      ? imageMap[currentArticle.id]
      : currentArticle.images || []
    const urls: Record<string, string> = {}
    const selected: Record<string, string> = {}
    for (const img of saved) {
      const section = imageSections.find(
        (s) => s.position === img.position || s.section === img.section
      )
      if (!section) continue
      const slotId = `${section.id}-0`
      urls[slotId] = img.url
      selected[section.id] = slotId
    }
    setSlotUrls(urls)
    setSelectedSlots(selected)
    setFailedSlotId(null)
    // ponytail: reset slots only when the chosen article changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentArticle?.id])

  const getSelectedImages = useCallback(() => {
    return imageSections
      .map((section) => {
        const slotId = selectedSlots[section.id]
        const url = slotId ? slotUrls[slotId] : null
        if (!url) return null
        return {
          id: slotId,
          url,
          alt: section.section,
          section: section.section,
          position: section.position,
        }
      })
      .filter(Boolean)
  }, [selectedSlots, slotUrls])

  const pickedCount = imageSections.filter((s) => selectedSlots[s.id]).length
  const hasAnyImage = pickedCount > 0
  const isGeneratingAny = Object.values(generatingSlots).some(Boolean)
  const scrollTargetId =
    scrollTargetSlotId && slotUrls[scrollTargetSlotId]
      ? `image-slot-${scrollTargetSlotId}`
      : null

  useScrollOnGenerationComplete(
    isGeneratingAny,
    !!scrollTargetSlotId && !!slotUrls[scrollTargetSlotId],
    scrollTargetId
  )

  const articleOptions = useMemo(
    () => [
      { value: '', label: 'Select an article…' },
      ...articles.map((a) => ({ value: a.id, label: a.title })),
    ],
    [articles]
  )

  const articlePreview = useMemo(
    () => (currentArticle ? stripHtml(currentArticle.content).slice(0, 150) : ''),
    [currentArticle]
  )

  const toggleSlot = (sectionId: string, slotId: string) => {
    setSelectedSlots((prev) => {
      if (prev[sectionId] === slotId) {
        const next = { ...prev }
        delete next[sectionId]
        return next
      }
      return { ...prev, [sectionId]: slotId }
    })
  }

  const handleGenerateImage = async (
    sectionId: string,
    slotIndex: number,
    _suggestion: string
  ) => {
    if (!currentArticle) return
    const slotId = `${sectionId}-${slotIndex}`
    const slot = imageSections.find((s) => s.id === sectionId)
    if (!slot) return

    setScrollTargetSlotId(slotId)
    setShowOfferBanner(true)
    setGeneratingSlots((prev) => ({ ...prev, [slotId]: true }))
    setFailedSlotId(null)

    try {
      const prompt = buildArticleImagePrompt(
        currentArticle.title,
        currentArticle.content,
        slot,
        ARTICLE_IMAGE_FRAMINGS[slotIndex] || slot.framing
      )

      const res = await fetchJson<{ url?: string }>('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })

      if (!res.ok) throw new Error(res.error || 'Failed to generate image')

      const url = res.data.url
      if (url) {
        setSlotUrls((prev) => ({ ...prev, [slotId]: url }))
        setSelectedSlots((prev) => {
          if (!prev[sectionId]) return { ...prev, [sectionId]: slotId }
          return prev
        })
      } else {
        throw new Error('No image URL returned')
      }
    } catch (error: unknown) {
      console.error('Error generating image:', error)
      const msg = error instanceof Error ? error.message : 'Failed to generate image.'
      setFailedSlotId(slotId)
      toast(msg, { variant: 'error', durationMs: 8000 })
    } finally {
      setGeneratingSlots((prev) => ({ ...prev, [slotId]: false }))
    }
  }

  const handleFileUpload = async (
    sectionId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    const slotId = `${sectionId}-upload`
    setUploadingSlots((prev) => ({ ...prev, [slotId]: true }))

    try {
      const supabase = createClient()
      const fileExt = file.name.split('.').pop()
      const fileName = `${currentArticle?.id || Date.now()}/${Math.random().toString(36).substring(7)}.${fileExt}`

      const { error } = await supabase.storage.from('article-images').upload(fileName, file)
      if (error) throw error

      const {
        data: { publicUrl },
      } = supabase.storage.from('article-images').getPublicUrl(fileName)

      setSlotUrls((prev) => ({ ...prev, [slotId]: publicUrl }))
      setSelectedSlots((prev) => ({ ...prev, [sectionId]: slotId }))
    } catch (error) {
      console.error('Upload failed:', error)
      toast('Failed to upload image.', { variant: 'error' })
    } finally {
      setUploadingSlots((prev) => ({ ...prev, [slotId]: false }))
    }
  }

  const handleSaveArticle = async (navigateToPublish = false) => {
    if (!currentArticle) return
    setIsSaving(true)
    setSaveError('')
    setSaveUi('saving')

    const previousImages = currentArticle.images ?? []
    try {
      const images = getSelectedImages() as ArticleImage[]

      saveArticleImages(currentArticle.id, images)

      const updatedArticle = { ...currentArticle, images }
      updateArticle(currentArticle.id, updatedArticle)
      setCurrentArticle(updatedArticle)

      const patch = await fetchJson<{ article: Article }>(`/api/articles?id=${currentArticle.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images }),
      })

      if (!patch.ok) {
        throw new Error(patch.error || 'Could not sync images to the server')
      }

      setSaveUi('saved')
      setSaveUiAt(new Date())

      if (navigateToPublish) {
        router.push('/publish')
      } else {
        router.push('/dashboard')
      }
    } catch (err: unknown) {
      saveArticleImages(currentArticle.id, previousImages)
      updateArticle(currentArticle.id, { ...currentArticle, images: previousImages })
      setCurrentArticle({ ...currentArticle, images: previousImages })
      const msg = err instanceof Error ? err.message : 'Failed to save. Please try again.'
      setSaveError(msg)
      setSaveUi('error')
      toast(msg, { variant: 'error' })
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (viewMode) {
      setViewMode(false)
    } else {
      router.back()
    }
  }

  // ═══════════════ ARTICLE PREVIEW MODE ═══════════════
  if (viewMode && currentArticle) {
    const images = getSelectedImages()
    const headerImg = images.find((img) => img?.position === 'top')
    const midImg = images.find((img) => img?.position === 'middle')
    const conclusionImg = images.find((img) => img?.position === 'bottom')

    const contentText = stripHtml(currentArticle.content)
    const paragraphs = contentText.split(/\n\n+/).filter((p) => p.trim())
    const midPoint = Math.floor(paragraphs.length / 2)

    return (
      <PageContainer className="mx-auto max-w-4xl">
        <PageHeader
          eyebrow="Visual Lab"
          title="Article Preview"
          subtitle="Review your article with images before saving"
          actions={
            <Button
              variant="secondary"
              size="sm"
              className="!h-9 md:!h-9 gap-1.5 px-3 text-sm"
              onClick={() => setViewMode(false)}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </Button>
          }
        />

        <SaveStatusBar
          status={saveStatus}
          savedAt={saveUiAt}
          errorMessage={saveError || null}
          onRetry={() => void handleSaveArticle(false)}
          className="mb-6"
        />

        <Card className="overflow-hidden p-0">
          {headerImg && (
            <div className="relative aspect-21/9 w-full">
              <img
                src={headerImg.url}
                alt={headerImg.alt}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-surface to-transparent" />
            </div>
          )}

          <div className="prose-bp p-6 sm:p-8">
            <h1 className="brand-font mb-6 text-2xl text-ink sm:text-3xl">
              {currentArticle.title}
            </h1>

            {paragraphs.slice(0, midPoint).map((p, i) => (
              <p key={i} className="mb-4 leading-relaxed text-ink-2">
                {p}
              </p>
            ))}

            {midImg && (
              <div className="my-8 overflow-hidden rounded-xl border border-border-dim">
                <img src={midImg.url} alt={midImg.alt} className="w-full object-cover" />
              </div>
            )}

            {paragraphs.slice(midPoint).map((p, i) => (
              <p key={i + midPoint} className="mb-4 leading-relaxed text-ink-2">
                {p}
              </p>
            ))}

            {conclusionImg && (
              <div className="mt-8 overflow-hidden rounded-xl border border-border-dim">
                <img
                  src={conclusionImg.url}
                  alt={conclusionImg.alt}
                  className="w-full object-cover"
                />
              </div>
            )}
          </div>
        </Card>

        {saveError && (
          <div className="mt-4 rounded-xl border border-error/30 bg-error/10 p-3 text-sm text-error">
            {saveError}
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border-dim pt-8">
          <Button variant="ghost" onClick={handleCancel}>
            <X size={18} />
            <span>Cancel</span>
          </Button>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              className="!h-9 md:!h-9 gap-1.5 px-3 text-sm"
              onClick={() => void handleSaveArticle(false)}
              loading={isSaving}
            >
              <Save size={16} />
              <span>Save article</span>
            </Button>
            <Button
              size="sm"
              className="!h-9 md:!h-9 gap-1.5 px-3 text-sm"
              onClick={() => void handleSaveArticle(true)}
              loading={isSaving}
            >
              <Send size={16} />
              <span>Save & broadcast</span>
            </Button>
          </div>
        </div>
      </PageContainer>
    )
  }

  // ═══════════════ IMAGE SELECTION MODE ═══════════════
  return (
    <PageContainer className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Visual Lab"
        title="Visual Lab"
        subtitle="Generate or upload one image per section"
        actions={
          <Button
            variant="secondary"
            size="sm"
            className="!h-9 md:!h-9 gap-1.5 px-3 text-sm"
            onClick={() => router.back()}
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </Button>
        }
      />

      {currentArticle && (
        <SaveStatusBar
          status={saveStatus}
          savedAt={saveUiAt}
          errorMessage={saveError || null}
          onRetry={() => void handleSaveArticle(false)}
          className="mb-6"
        />
      )}

      {currentArticle ? (
        <Card className="mb-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-2">
                <Badge variant="purple" className="capitalize">
                  {Array.isArray(currentArticle.platform)
                    ? currentArticle.platform[0]
                    : currentArticle.platform}
                </Badge>
              </div>
              <h2 className="brand-font text-xl text-ink">{currentArticle.title}</h2>
              {articlePreview && (
                <p className="mt-1 line-clamp-2 text-sm text-ink-4">{articlePreview}…</p>
              )}
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="!h-9 md:!h-9 shrink-0 gap-1.5 px-3 text-sm"
              onClick={() => setCurrentArticle(null)}
            >
              <RefreshCw size={14} />
              <span>Change article</span>
            </Button>
          </div>
        </Card>
      ) : loadingArticles ? (
        <div className="mb-8 h-36 animate-pulse rounded-2xl bg-brass-100/70" aria-busy="true" />
      ) : articles.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No articles yet"
          description="Write an article first, then come back to add visuals."
          action={{ label: 'Go to Craft', href: '/write' }}
          className="mb-8"
        />
      ) : (
        <Card className="mb-8 border-dashed border-border-dim">
          <div className="mx-auto max-w-md py-4 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brass-100 text-brass-700">
              <ImageIcon size={22} aria-hidden />
            </div>
            <h2 className="mb-1 font-semibold text-ink">Pick an article</h2>
            <p className="mb-5 text-sm text-ink-4">
              Choose from your vault, then generate or upload visuals.
            </p>
            <Select
              options={articleOptions}
              onChange={(e) => {
                const article = articles.find((a) => a.id === e.target.value)
                if (article) setCurrentArticle(article)
              }}
              className="text-left"
            />
          </div>
        </Card>
      )}

      {currentArticle && (
        <>
          {isGeneratingAny ? (
            <div className="mb-8">
              <GenerationProgress label="Generating your image…" />
            </div>
          ) : showOfferBanner ? (
            <div className="mb-8">
              <EarningsBanner />
            </div>
          ) : null}

          <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
            <span className="mr-auto text-xs tabular-nums text-ink-4">
              {pickedCount} of {imageSections.length} picked
            </span>
            <Button
              variant="secondary"
              size="sm"
              className="!h-9 md:!h-9 gap-1.5 px-3 text-sm"
              onClick={() => router.push('/publish')}
            >
              Skip images
            </Button>
            <Button
              size="sm"
              className="!h-9 md:!h-9 gap-1.5 px-3 text-sm"
              onClick={() => setViewMode(true)}
              disabled={!hasAnyImage}
            >
              <Eye size={16} />
              <span>View article</span>
            </Button>
          </div>

          <div className="space-y-6">
            {imageSections.map((section) => {
              const isUploading = uploadingSlots[`${section.id}-upload`]
              const uploadUrl = slotUrls[`${section.id}-upload`]

              return (
                <Card key={section.id}>
                  <div className="mb-5">
                    <h3 className="flex items-center gap-2 font-semibold text-ink">
                      <ImageIcon size={18} className="text-brass-700" aria-hidden />
                      {section.section}
                    </h3>
                    <p className="mt-1 text-sm text-ink-4">{section.suggestion}</p>
                  </div>

                  <div className="mb-5">
                    <p className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-4">
                      AI generated — click to select
                    </p>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      {[0, 1, 2].map((slotIndex) => {
                        const slotId = `${section.id}-${slotIndex}`
                        const url = slotUrls[slotId]
                        const isSelected = selectedSlots[section.id] === slotId
                        const isGenerating = generatingSlots[slotId]

                        return (
                          <div
                            key={slotId}
                            id={`image-slot-${slotId}`}
                            className="flex scroll-mt-28 flex-col gap-2"
                          >
                            <div
                              role={url ? 'button' : undefined}
                              tabIndex={url ? 0 : undefined}
                              onClick={() => {
                                if (url) toggleSlot(section.id, slotId)
                              }}
                              onKeyDown={(e) => {
                                if (!url) return
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  toggleSlot(section.id, slotId)
                                }
                              }}
                              className={`
                                relative aspect-video w-full overflow-hidden rounded-xl border-2 transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-500
                                ${url ? 'cursor-pointer' : 'cursor-default'}
                                ${
                                  isSelected
                                    ? 'border-brass-500 ring-4 ring-brass-500/20'
                                    : 'border-border-dim hover:border-brass-300/60'
                                }
                                ${!url && !isGenerating ? 'border-dashed bg-canvas/40' : ''}
                              `}
                            >
                              {url ? (
                                <>
                                  <img
                                    src={url}
                                    alt={`Option ${slotIndex + 1}`}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                  />
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setFullscreenImage({
                                        url,
                                        alt: `${section.section} — Option ${slotIndex + 1}`,
                                      })
                                    }}
                                    className="absolute bottom-2 right-2 z-20 flex h-8 w-8 items-center justify-center rounded-lg border border-border-dim bg-black/75 text-ink shadow-lg backdrop-blur-sm transition-colors hover:bg-black/90"
                                    aria-label="View fullscreen"
                                  >
                                    <Maximize2 size={15} />
                                  </button>
                                  {isSelected && (
                                    <div className="absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-brass-500 shadow-lg">
                                      <Check size={16} className="text-white" />
                                    </div>
                                  )}
                                </>
                              ) : isGenerating ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                  <Wand2
                                    size={22}
                                    className="mb-2 animate-pulse text-brass-700"
                                  />
                                  <span className="text-[11px] text-ink-4">Generating…</span>
                                </div>
                              ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-40">
                                  <ImageIcon size={24} className="mb-2" />
                                  <span className="text-[11px]">Option {slotIndex + 1}</span>
                                </div>
                              )}
                            </div>

                            {!url && !isGenerating && (
                              <Button
                                variant="primary"
                                size="sm"
                                className="!h-9 md:!h-9 w-full text-xs"
                                disabled={!currentArticle}
                                onClick={() =>
                                  void handleGenerateImage(
                                    section.id,
                                    slotIndex,
                                    section.suggestion
                                  )
                                }
                              >
                                <Wand2 size={13} className="mr-1" /> Generate
                              </Button>
                            )}
                            {failedSlotId === slotId && !url && !isGenerating && (
                              <Button
                                variant="secondary"
                                size="sm"
                                className="w-full text-xs"
                                disabled={!currentArticle}
                                onClick={() =>
                                  void handleGenerateImage(
                                    section.id,
                                    slotIndex,
                                    section.suggestion
                                  )
                                }
                              >
                                Retry
                              </Button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="my-5 flex items-center gap-4">
                    <div className="h-px flex-1 bg-border-dim" />
                    <span className="text-xs font-medium text-ink-4">OR UPLOAD YOUR OWN</span>
                    <div className="h-px flex-1 bg-border-dim" />
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                        onChange={(e) => void handleFileUpload(section.id, e)}
                        disabled={isUploading || !currentArticle}
                      />
                      <Button variant="secondary" size="sm" className="pointer-events-none">
                        {isUploading ? (
                          <Loader2 size={14} className="mr-1 animate-spin" />
                        ) : (
                          <Upload size={14} className="mr-1" />
                        )}
                        {isUploading ? 'Uploading…' : 'Upload image'}
                      </Button>
                    </div>

                    {uploadUrl && (
                      <div className="flex items-center gap-3">
                        <img
                          src={uploadUrl}
                          alt="Uploaded"
                          className="h-10 w-16 rounded-lg border border-border-dim object-cover"
                          loading="lazy"
                        />
                        {selectedSlots[section.id] === `${section.id}-upload` ? (
                          <Badge variant="success">Selected</Badge>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedSlots((prev) => ({
                                ...prev,
                                [section.id]: `${section.id}-upload`,
                              }))
                            }
                            className="text-xs text-brass-700 hover:underline"
                          >
                            Use this image
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        </>
      )}

      {fullscreenImage && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Fullscreen image preview"
          onClick={closeFullscreen}
        >
          <button
            type="button"
            onClick={closeFullscreen}
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-raised text-ink transition-colors hover:bg-brass-100"
            aria-label="Close fullscreen"
          >
            <X size={22} />
          </button>
          <img
            src={fullscreenImage.url}
            alt={fullscreenImage.alt}
            className="max-h-full max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </PageContainer>
  )
}
