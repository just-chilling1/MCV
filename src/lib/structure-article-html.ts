/**
 * Light Battery-Profits-style cleanup: promote flat lines into h2 / p / ul.
 * No section cards, TOC, or layout wrappers — plain HTML only.
 */

import { sanitizePostHtml } from "@/features/blog-builder/lib/sanitize-html";

function decodeBasicEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
}

function stripTags(html: string): string {
  return decodeBasicEntities(html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

type Block =
  | { kind: 'h2' | 'h3' | 'p' | 'lead' | 'hr' | 'aside' | 'raw'; text: string }
  | { kind: 'ul' | 'ol'; items: string[] }

function looksLikeHeading(text: string): boolean {
  const t = text.trim()
  if (t.length < 10 || t.length > 90) return false
  if (/[.!?;:]$/.test(t)) return false
  if (/^(use it|and |but |so |or )/i.test(t)) return false
  const words = t.split(/\s+/).filter(Boolean)
  return words.length >= 3 && words.length <= 12
}

function looksLikeListItem(text: string): boolean {
  const t = text.trim()
  if (!t || t.length > 180) return false
  if (/^([-*•–—]|\d+[.)])\s+\S/.test(t)) return true
  if (/^use it (to|in|for|when|as)\b/i.test(t)) return true
  if (/^(start with|avoid|never|always|choose|pick|check|keep|make sure|do not|don't)\b/i.test(t)) {
    return !/[.!?].+[.!?]/.test(t)
  }
  return false
}

function stripBulletPrefix(text: string): string {
  return text.replace(/^([-*•–—]|\d+[.)])\s+/, '').trim()
}

function explodeParagraph(text: string): string[] {
  const clean = text.trim()
  if (clean.length < 320) return clean ? [clean] : []
  const sentences =
    clean.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g)?.map((s) => s.trim()).filter(Boolean) ?? [clean]
  if (sentences.length < 3) return [clean]
  const chunks: string[] = []
  let buf = ''
  for (const sentence of sentences) {
    const next = buf ? `${buf} ${sentence}` : sentence
    if (buf && next.length > 280) {
      chunks.push(buf)
      buf = sentence
    } else {
      buf = next
    }
  }
  if (buf) chunks.push(buf)
  return chunks
}

function markdownishToBlocks(raw: string): string[] {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|blockquote|aside|section)>/gi, '\n')
    .replace(/<(p|div|h[1-6]|li|blockquote|aside|section)(\s[^>]*)?>/gi, '\n')
    .replace(/<\/?(ul|ol|nav|span)(\s[^>]*)?>/gi, '\n')
    .split(/\n+/)
    .map((line) => stripTags(line))
    .map((line) => line.replace(/^#+\s+/, '').trim())
    .filter(Boolean)
}

function extractExistingBlocks(html: string): Block[] | null {
  if (!/<(p|h[1-6]|ul|ol|aside|hr)\b/i.test(html)) return null

  const blocks: Block[] = []
  const re =
    /<(h[1-6]|p|aside|hr|ul|ol)(\s[^>]*)?>([\s\S]*?)<\/\1>|<(hr)\s*\/?>/gi
  let match: RegExpExecArray | null
  let found = false

  while ((match = re.exec(html))) {
    found = true
    const tag = (match[1] || match[4] || '').toLowerCase()
    const inner = match[3] ?? ''

    if (tag === 'hr') {
      blocks.push({ kind: 'hr', text: '' })
      continue
    }
    if (tag === 'ul' || tag === 'ol') {
      const items = [...inner.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((m) =>
        stripTags(m[1] ?? ''),
      )
      if (items.length) blocks.push({ kind: tag, items })
      continue
    }
    if (tag === 'aside') {
      blocks.push({ kind: 'aside', text: stripTags(inner) })
      continue
    }
    if (tag === 'h1' || tag === 'h2') {
      blocks.push({ kind: 'h2', text: stripTags(inner) })
      continue
    }
    if (tag === 'h3' || tag === 'h4') {
      blocks.push({ kind: 'h3', text: stripTags(inner) })
      continue
    }
    const parts = inner
      .split(/<br\s*\/?>/i)
      .flatMap((part) => explodeParagraph(stripTags(part)))
    for (const text of parts) blocks.push({ kind: 'p', text })
  }

  return found && blocks.length ? blocks : null
}

function linesToBlocks(lines: string[]): Block[] {
  const out: Block[] = []
  let i = 0
  let firstPara = true

  while (i < lines.length) {
    const line = lines[i]!

    if (/^---+$/.test(line)) {
      out.push({ kind: 'hr', text: '' })
      i += 1
      continue
    }

    if (looksLikeHeading(line)) {
      out.push({ kind: 'h2', text: line })
      firstPara = false
      i += 1
      continue
    }

    if (looksLikeListItem(line)) {
      const items: string[] = []
      while (i < lines.length && looksLikeListItem(lines[i]!)) {
        items.push(stripBulletPrefix(lines[i]!))
        i += 1
      }
      out.push({ kind: 'ul', items })
      firstPara = false
      continue
    }

    if (
      i + 1 < lines.length &&
      line.length < 140 &&
      lines[i + 1]!.length < 140 &&
      /^(use |keep |make |choose |avoid )/i.test(line) &&
      /^(use |keep |make |choose |avoid )/i.test(lines[i + 1]!)
    ) {
      const items: string[] = []
      while (
        i < lines.length &&
        lines[i]!.length < 140 &&
        /^(use |keep |make |choose |avoid )/i.test(lines[i]!)
      ) {
        items.push(stripBulletPrefix(lines[i]!))
        i += 1
      }
      out.push({ kind: 'ul', items })
      firstPara = false
      continue
    }

    out.push({ kind: firstPara ? 'lead' : 'p', text: line })
    firstPara = false
    i += 1
  }

  return out
}

function promoteFlatParagraphs(blocks: Block[]): Block[] {
  const onlyFlat = blocks.every((b) => b.kind === 'p' || b.kind === 'lead' || b.kind === 'raw')
  if (onlyFlat) {
    return linesToBlocks(
      blocks.flatMap((b) =>
        b.kind === 'p' || b.kind === 'lead' || b.kind === 'raw' ? [b.text] : [],
      ),
    )
  }

  const out: Block[] = []
  let i = 0
  let sawLead = false
  while (i < blocks.length) {
    const b = blocks[i]!
    if (b.kind === 'p' || b.kind === 'lead' || b.kind === 'raw') {
      if (looksLikeHeading(b.text)) {
        out.push({ kind: 'h2', text: b.text })
        i += 1
        continue
      }
      if (looksLikeListItem(b.text)) {
        const items: string[] = []
        while (i < blocks.length) {
          const cur = blocks[i]!
          if (
            (cur.kind === 'p' || cur.kind === 'lead' || cur.kind === 'raw') &&
            looksLikeListItem(cur.text)
          ) {
            items.push(stripBulletPrefix(cur.text))
            i += 1
            continue
          }
          break
        }
        out.push({ kind: 'ul', items })
        continue
      }
      if (!sawLead) {
        out.push({ kind: 'lead', text: b.text })
        sawLead = true
        i += 1
        continue
      }
      out.push({ kind: 'p', text: b.text })
      i += 1
      continue
    }
    out.push(b)
    i += 1
  }
  return out
}

function wrapClosingCta(blocks: Block[]): Block[] {
  if (blocks.some((b) => b.kind === 'aside')) return blocks
  if (blocks.length < 3) return blocks

  const last = blocks[blocks.length - 1]
  if (!last || (last.kind !== 'p' && last.kind !== 'lead')) return blocks

  const text = last.text
  const ctaLike =
    /\b(click|get started|try|learn more|read more|sign up|join|start today|next step|call to action)\b/i.test(
      text,
    ) || /<a\s/i.test(text)

  if (!ctaLike) return blocks

  const copy = blocks.slice(0, -1)
  if (copy.length && copy[copy.length - 1]?.kind !== 'hr') {
    copy.push({ kind: 'hr', text: '' })
  }
  copy.push({ kind: 'aside', text })
  return copy
}

function renderBlocks(blocks: Block[]): string {
  return blocks
    .map((b) => {
      switch (b.kind) {
        case 'lead':
          return `<p>${escapeHtml(b.text)}</p>`
        case 'p':
          return `<p>${escapeHtml(b.text)}</p>`
        case 'h2':
          return `<h2>${escapeHtml(b.text)}</h2>`
        case 'h3':
          return `<h3>${escapeHtml(b.text)}</h3>`
        case 'hr':
          return '<hr>'
        case 'aside':
          return `<p><strong>${escapeHtml(b.text)}</strong></p>`
        case 'ul':
          return `<ul>${b.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
        case 'ol':
          return `<ol>${b.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ol>`
        case 'raw':
          return b.text
        default:
          return ''
      }
    })
    .filter(Boolean)
    .join('\n')
}

function preserveInlineLinks(original: string, structured: string): string {
  if (/<a\s/i.test(structured)) return structured
  const links = [...original.matchAll(/<a\s+[^>]*href=(['"])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi)]
  if (links.length !== 1) return structured
  const href = links[0]![2]
  const label = stripTags(links[0]![3] ?? 'Learn more')
  if (!href) return structured

  const anchor = `<a href='${href.replace(/'/g, '&#39;')}' target='_blank' rel='noopener noreferrer'>${escapeHtml(label)}</a>`
  return `${structured}\n<p>${anchor}</p>`
}

function alreadyHasRealStructure(html: string): boolean {
  const h2 = (html.match(/<h2\b/gi) || []).length
  const li = (html.match(/<li\b/gi) || []).length
  return h2 >= 2 && li >= 2 && !/article-layout|article-section|article-toc/.test(html)
}

/** Strip our older card wrappers back to plain tags. */
export function unwrapLegacyLayout(html: string): string {
  return html
    .replace(/<nav\b[^>]*article-toc[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<p\b[^>]*article-toc-label[^>]*>[\s\S]*?<\/p>/gi, '')
    .replace(/<span\b[^>]*article-kicker[^>]*>[\s\S]*?<\/span>/gi, '')
    .replace(/<\/?(?:div|section)\b[^>]*article-(?:layout|section)[^>]*>/gi, '')
    .replace(/<\/?aside\b[^>]*>/gi, '')
    .replace(/\sclass=(['"])lead\1/gi, '')
    .replace(/\sclass=(['"])[^'"]*article-[^'"]*\1/gi, '')
}

export type ArticleOutlineSection = {
  heading: string
  paragraphs: string[]
  points: string[]
}

/** Plain BP-style HTML from a section outline. */
export function articleFromOutline(input: {
  hook: string
  sections: ArticleOutlineSection[]
  cta: string
}): string {
  const parts: string[] = []
  const hook = stripTags(input.hook)
  if (hook) parts.push(`<p>${escapeHtml(hook)}</p>`)
  for (const section of input.sections) {
    const heading = stripTags(section.heading)
    if (!heading) continue
    parts.push(`<h2>${escapeHtml(heading)}</h2>`)
    for (const paragraph of section.paragraphs.flatMap((p) => explodeParagraph(stripTags(p)))) {
      parts.push(`<p>${escapeHtml(paragraph)}</p>`)
    }
    const points = section.points.map((p) => stripTags(p)).filter(Boolean)
    if (points.length) {
      parts.push(`<ul>${points.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`)
    }
  }
  const cta = stripTags(input.cta)
  if (cta) parts.push(`<p><strong>${escapeHtml(cta)}</strong></p>`)
  return parts.join('\n')
}

/** Battery-Profits-style article HTML from flat or semi-structured model output. */
export function structureArticleHtml(input: string): string {
  const raw = unwrapLegacyLayout(input?.trim() ?? '')
  if (!raw) return raw

  if (alreadyHasRealStructure(raw)) return sanitizePostHtml(raw)

  const existing = extractExistingBlocks(raw)
  let blocks: Block[]

  if (existing && existing.length >= 2) {
    blocks = promoteFlatParagraphs(existing)
  } else {
    blocks = linesToBlocks(markdownishToBlocks(raw))
  }

  blocks = wrapClosingCta(blocks)

  if (!blocks.some((b) => b.kind === 'h2' || b.kind === 'h3')) {
    const firstBody = blocks.findIndex((b) => b.kind === 'p')
    if (firstBody >= 0) {
      blocks.splice(firstBody, 0, { kind: 'h2', text: 'Key Points' })
    }
  }

  return sanitizePostHtml(preserveInlineLinks(raw, renderBlocks(blocks)))
}
