'use client'

import { useEffect, useState } from 'react'
import { ClipboardList, Plus, Trash2, Pencil, Copy, Check, Loader2 } from 'lucide-react'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { fetchJson } from '@/lib/api-client'
import { copyToClipboard } from '@/lib/clipboard'
import { useToast } from '@/contexts/ToastContext'
import type { Snippet, SnippetKind } from '@/types'
import PageHeader from '@/components/ui/page-header'

export default function SnippetLibraryPage() {
  const { toast } = useToast()
  const [items, setItems] = useState<Snippet[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [kind, setKind] = useState<SnippetKind>('snippet')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const res = await fetchJson<{ snippets: Snippet[] }>('/api/snippets')
    setLoading(false)
    if (!res.ok) {
      if (res.status === 401) {
        setItems([])
        return
      }
      toast(res.error, { variant: 'error' })
      return
    }
    setItems(res.data.snippets || [])
  }

  useEffect(() => {
    load()
  }, [])

  const resetForm = () => {
    setTitle('')
    setBody('')
    setKind('snippet')
    setEditingId(null)
  }

  const handleSave = async () => {
    if (!title.trim() || !body.trim()) {
      toast('Title and body are required', { variant: 'info' })
      return
    }
    setSaving(true)
    if (editingId) {
      const res = await fetchJson<{ snippet: Snippet }>(`/api/snippets?id=${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, kind }),
      })
      setSaving(false)
      if (!res.ok) {
        toast(res.error, { variant: 'error' })
        return
      }
      setItems((prev) => prev.map((s) => (s.id === editingId ? res.data.snippet : s)))
      toast('Snippet updated', { variant: 'success' })
    } else {
      const res = await fetchJson<{ snippet: Snippet }>('/api/snippets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, kind }),
      })
      setSaving(false)
      if (!res.ok) {
        toast(res.error, { variant: 'error' })
        return
      }
      setItems((prev) => [res.data.snippet, ...prev])
      toast('Saved to library', { variant: 'success' })
    }
    resetForm()
  }

  const handleDelete = async (id: string) => {
    const res = await fetchJson(`/api/snippets?id=${id}`, { method: 'DELETE' })
    if (!res.ok) {
      toast(res.error, { variant: 'error' })
      return
    }
    setItems((prev) => prev.filter((s) => s.id !== id))
    toast('Removed', { variant: 'default' })
  }

  const startEdit = (s: Snippet) => {
    setEditingId(s.id)
    setTitle(s.title)
    setBody(s.body)
    setKind(s.kind)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const copyBody = async (s: Snippet) => {
    await copyToClipboard(s.body)
    setCopiedId(s.id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  return (
    <div className="w-full">
      <div className="sticky top-0 z-20 -mx-2 mb-8 flex items-start justify-between gap-3 rounded-xl border border-border-dim bg-[rgb(8,11,18)]/90 px-4 py-3 backdrop-blur-xl [&>div]:mb-0">
        <PageHeader
          eyebrow="Snippet library"
          title="Snippet & CTA library"
          subtitle="Reusable lines for bios, CTAs, and promos — synced to your account."
        />
        <ClipboardList className="hidden h-8 w-8 shrink-0 text-brass-700/50 sm:block" aria-hidden />
      </div>

      <Card className="mb-10 space-y-4">
        <h2 className="text-lg font-semibold text-ink">{editingId ? 'Edit entry' : 'New snippet or CTA'}</h2>
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. LinkedIn bio CTA" />
        <div>
          <label className="mb-2 block text-sm font-medium text-bp-text">Body</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            className="w-full rounded-xl border border-border-dim bg-[rgb(10,14,22)]/80 px-4 py-3 text-sm text-ink placeholder:text-ink-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400/50"
            placeholder="Paste your reusable copy…"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-bp-muted">Type</span>
          {(['snippet', 'cta'] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                kind === k ? 'bg-brass-100 text-info' : 'bg-field text-bp-muted hover:text-ink'
              }`}
            >
              {k}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleSave} loading={saving}>
            <Plus size={18} />
            <span>{editingId ? 'Update' : 'Save to library'}</span>
          </Button>
          {editingId && (
            <Button variant="ghost" type="button" onClick={resetForm}>
              Cancel edit
            </Button>
          )}
        </div>
      </Card>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-bp-muted">
          <Loader2 className="mb-3 h-8 w-8 animate-spin text-brass-700" />
          Loading library…
        </div>
      ) : items.length === 0 ? (
        <div className="relative min-h-[220px] overflow-hidden rounded-2xl border border-border-dim bg-black">
          <span className="sr-only">No saved snippets yet. Add a title and body above, then save to library.</span>
          <div className="pointer-events-none absolute -inset-[18%] bg-gradient-to-br from-cyan-900/45 via-slate-950 to-violet-950/45 blur-3xl" aria-hidden />
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_30%_25%,rgba(34,211,238,0.2),transparent_50%),radial-gradient(ellipse_65%_50%_at_75%_70%,rgba(167,139,250,0.15),transparent_48%)]"
            aria-hidden
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" aria-hidden />
          <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/[0.06]" aria-hidden />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-raised text-ink-4 ring-1 ring-brass-300 backdrop-blur-sm">
              <ClipboardList className="h-8 w-8" strokeWidth={1.25} />
            </div>
          </div>
        </div>
      ) : (
        <ul className="space-y-4">
          {items.map((s, i) => (
            <Card
              key={s.id}
              className="border border-border-dim transition-all hover:border-white/[0.12]"
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-ink">{s.title}</h3>
                    <Badge variant={s.kind === 'cta' ? 'success' : 'purple'} className="text-[10px] uppercase">
                      {s.kind}
                    </Badge>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-2">{s.body}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="sm" onClick={() => copyBody(s)}>
                    {copiedId === s.id ? <Check size={16} /> : <Copy size={16} />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => startEdit(s)}>
                    <Pencil size={16} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)}>
                    <Trash2 size={16} className="text-error" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </ul>
      )}

      <p className="mt-10 text-center text-xs text-bp-muted">
        Tip: use Copy text in{' '}
        <Link href="/publish" className="text-brass-700 hover:underline">
          Publish
        </Link>{' '}
        (step 3, right column) or paste into{' '}
        <Link href="/write" className="text-brass-700 hover:underline">
          Craft
        </Link>
        .
      </p>
    </div>
  )
}
