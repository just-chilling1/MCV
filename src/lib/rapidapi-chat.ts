import OpenAI from 'openai'
import { articleFromOutline, structureArticleHtml } from '@/lib/structure-article-html'

const RAPIDAPI_URL = 'https://chatgpt-42.p.rapidapi.com/gpt4'
const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504])
const DEFAULT_MAX_RETRIES = 5
const DEFAULT_TIMEOUT_MS = 120_000
const INITIAL_BACKOFF_MS = 2_000
const MAX_BACKOFF_MS = 15_000

export type ChatMessage = { role: string; content: string }

export type CallRapidChatOptions = {
  maxRetries?: number
  timeoutMs?: number
  label?: string
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function backoffMs(attempt: number) {
  return Math.min(INITIAL_BACKOFF_MS * 2 ** (attempt - 1), MAX_BACKOFF_MS)
}

/** User-facing message for a failed RapidAPI response. */
export function rapidApiErrorMessage(status: number): string {
  switch (status) {
    case 401:
    case 403:
      return 'AI service authentication failed. This is a server configuration issue — please contact support if it continues.'
    case 429:
      return 'The AI service is busy right now. Please wait a moment and try again.'
    case 502:
    case 503:
    case 504:
      return 'The AI service timed out after several automatic retries. Please try again in a minute — nothing is wrong with your account.'
    default:
      if (status >= 500) {
        return 'The AI service is temporarily unavailable. Please try again shortly.'
      }
      return `The AI service returned an unexpected error (${status}). Please try again or contact support if this continues.`
  }
}

/** Coerce RapidAPI / OpenAI-shaped payloads to plain text. */
export function modelContentToString(result: unknown): string {
  if (typeof result === 'string') return result
  if (result && typeof result === 'object') {
    const r = result as Record<string, unknown>
    for (const key of ['content', 'message', 'result', 'text'] as const) {
      const v = r[key]
      if (typeof v === 'string') return v
    }
    const msg = r.message
    if (msg && typeof msg === 'object') {
      const c = (msg as { content?: unknown }).content
      if (typeof c === 'string') return c
    }
  }
  if (result == null) return ''
  try {
    return JSON.stringify(result)
  } catch {
    return String(result)
  }
}

function rapidApiHost() {
  return process.env.RAPIDAPI_HOST || 'chatgpt-42.p.rapidapi.com'
}

async function fetchRapidChatGPT(
  messages: ChatMessage[],
  apiKey: string,
  timeoutMs: number,
): Promise<{ ok: true; text: string } | { ok: false; status: number; errorText: string }> {
  const response = await fetch(RAPIDAPI_URL, {
    method: 'POST',
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': rapidApiHost(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      web_access: false,
    }),
    signal: AbortSignal.timeout(timeoutMs),
  })

  if (!response.ok) {
    const errorText = await response.text()
    return { ok: false, status: response.status, errorText }
  }

  const data = await response.json()
  const text = modelContentToString(
    data.result ?? data.message ?? data.choices?.[0]?.message?.content ?? data,
  )

  if (!text.trim()) {
    return { ok: false, status: 502, errorText: 'empty response body' }
  }

  return { ok: true, text }
}

export async function callRapidChatGPT(
  messages: ChatMessage[],
  options: CallRapidChatOptions = {},
): Promise<string> {
  const apiKey = process.env.RAPIDAPI_KEY
  if (!apiKey) {
    throw new Error('RAPIDAPI_KEY is not configured')
  }

  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const label = options.label ?? 'chat'
  let lastStatus = 504

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await fetchRapidChatGPT(messages, apiKey, timeoutMs)

      if (result.ok) {
        if (attempt > 1) {
          console.info(`RapidAPI ${label} succeeded on attempt ${attempt}/${maxRetries}`)
        }
        return result.text
      }

      lastStatus = result.status
      console.error(
        `RapidAPI ${label} error (attempt ${attempt}/${maxRetries}):`,
        result.status,
        result.errorText,
      )

      const shouldRetry = RETRYABLE_STATUSES.has(result.status) && attempt < maxRetries
      if (shouldRetry) {
        const wait = backoffMs(attempt)
        console.warn(`RapidAPI ${label} ${result.status}, retrying in ${wait}ms...`)
        await sleep(wait)
        continue
      }

      throw new Error(rapidApiErrorMessage(result.status))
    } catch (err) {
      const isTimeout =
        err instanceof Error &&
        (err.name === 'TimeoutError' || err.name === 'AbortError' || /timed out/i.test(err.message))

      if (isTimeout) {
        lastStatus = 504
        console.error(`RapidAPI ${label} timed out (attempt ${attempt}/${maxRetries})`)
        if (attempt < maxRetries) {
          const wait = backoffMs(attempt)
          console.warn(`RapidAPI ${label} timeout, retrying in ${wait}ms...`)
          await sleep(wait)
          continue
        }
        throw new Error(rapidApiErrorMessage(504))
      }

      if (err instanceof Error && err.message.startsWith('The AI service')) {
        throw err
      }

      console.error(`RapidAPI ${label} network error (attempt ${attempt}/${maxRetries}):`, err)
      if (attempt < maxRetries) {
        const wait = backoffMs(attempt)
        await sleep(wait)
        continue
      }

      throw new Error(
        'Could not reach the AI service after several attempts. Please check your connection and try again.',
      )
    }
  }

  throw new Error(rapidApiErrorMessage(lastStatus))
}

export async function callOpenAIChatGPT(messages: ChatMessage[]): Promise<string> {
  const openaiKey = process.env.OPENAI_API_KEY
  if (!openaiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }

  const openai = new OpenAI({ apiKey: openaiKey })
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: messages.map((m) => ({
      role: m.role as 'system' | 'user' | 'assistant',
      content: m.content,
    })),
  })

  const text = completion.choices[0]?.message?.content
  if (!text?.trim()) {
    throw new Error('The backup AI service returned an empty response. Please try again.')
  }

  return text
}

/** RapidAPI with automatic retries, then OpenAI when configured. */
export async function callChatWithFallback(
  messages: ChatMessage[],
  options: CallRapidChatOptions = {},
): Promise<string> {
  const hasRapid = !!process.env.RAPIDAPI_KEY
  const hasOpenAI = !!process.env.OPENAI_API_KEY

  if (!hasRapid && !hasOpenAI) {
    throw new Error('AI generation is not configured on the server. Please contact support.')
  }

  if (hasRapid) {
    try {
      return await callRapidChatGPT(messages, options)
    } catch (rapidErr) {
      if (!hasOpenAI) throw rapidErr
      console.error('RapidAPI failed after retries, using OpenAI fallback:', rapidErr)
    }
  }

  return callOpenAIChatGPT(messages)
}

export type ArticleSections = { hook: string; body: string; cta: string }

function stripCodeFences(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}

function looksLikeArticleJson(raw: string): boolean {
  return /[{,]?\s*["']hook["']\s*:/.test(raw) || /^\s*\{\s*["']hook["']/.test(raw)
}

/** Pull a JSON string value for `key`, supporting double- or single-quoted literals. */
function extractQuotedField(src: string, key: string): string | null {
  const keyRe = new RegExp(`["']${key}["']\\s*:\\s*`, 'i')
  const m = keyRe.exec(src)
  if (!m) return null

  let i = m.index + m[0].length
  while (i < src.length && /\s/.test(src[i]!)) i++

  const quote = src[i]
  if (quote !== '"' && quote !== "'") return null
  i++

  let out = ''
  while (i < src.length) {
    const c = src[i]!
    if (c === '\\' && i + 1 < src.length) {
      const next = src[i + 1]!
      if (next === 'n') out += '\n'
      else if (next === 'r') out += '\r'
      else if (next === 't') out += '\t'
      else out += next
      i += 2
      continue
    }
    if (c === quote) break
    out += c
    i++
  }
  return out
}

/** CJK / kana / hangul — RapidAPI models often prepend these into English articles. */
const CJK_CHAR = /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff\uac00-\ud7af]/
const CJK_RUN = /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff\uac00-\ud7af]+/g

function plainTextLetterCount(html: string): number {
  return (html.replace(/<[^>]+>/g, '').match(/[A-Za-z]/g) ?? []).length
}

/**
 * Strip CJK bleed from mostly-English article HTML.
 * Keeps content alone when there is little Latin text (possible intentional non-English article).
 */
export function stripCjkBleed(html: string): string {
  if (!html || !CJK_CHAR.test(html)) return html
  if (plainTextLetterCount(html) < 40) return html

  return html
    .replace(CJK_RUN, '')
    // "中文 - English" / "中文：English" → leftover separator at start of a block
    .replace(/(^|>)\s*[-–—:：]\s+(?=[A-Za-z<])/gm, '$1')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/ ([\n.,;!?])/g, '$1')
}

function normalizeSections(parsed: {
  hook?: unknown
  body?: unknown
  cta?: unknown
}): ArticleSections {
  return {
    hook: typeof parsed.hook === 'string' ? stripCjkBleed(parsed.hook) : '',
    body: typeof parsed.body === 'string' ? stripCjkBleed(parsed.body) : '',
    cta: typeof parsed.cta === 'string' ? stripCjkBleed(parsed.cta) : '',
  }
}

/** Convert common single-quoted JSON value literals into valid JSON strings. */
function coerceSingleQuotedJson(src: string): string {
  return src.replace(/:\s*'((?:\\'|[^'])*)'/g, (_full, inner: string) => {
    const unescaped = inner.replace(/\\'/g, "'")
    return `: ${JSON.stringify(unescaped)}`
  })
}

function asPlainList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => (typeof item === 'string' ? stripCjkBleed(item).trim() : ''))
    .filter(Boolean)
}

function outlineToArticle(parsed: {
  hook?: unknown
  cta?: unknown
  sections?: unknown
}): ArticleSections | null {
  if (!Array.isArray(parsed.sections)) return null
  const sections = parsed.sections.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const row = item as { heading?: unknown; paragraphs?: unknown; body?: unknown; points?: unknown; bullets?: unknown }
    const heading = typeof row.heading === 'string' ? stripCjkBleed(row.heading).trim() : ''
    if (!heading) return []
    return [
      {
        heading,
        paragraphs: asPlainList(row.paragraphs ?? row.body),
        points: asPlainList(row.points ?? row.bullets),
      },
    ]
  })
  if (sections.length < 2) return null
  const hook = typeof parsed.hook === 'string' ? stripCjkBleed(parsed.hook) : ''
  const cta = typeof parsed.cta === 'string' ? stripCjkBleed(parsed.cta) : ''
  return {
    hook: '',
    body: articleFromOutline({ hook, sections, cta }),
    cta: '',
  }
}

export function joinArticleSections(sections: ArticleSections): string {
  const joined = [sections.hook, sections.body, sections.cta].filter(Boolean).join('\n\n')
  return structureArticleHtml(joined)
}

/**
 * Parse model output shaped as { hook, body, cta }.
 * Handles valid JSON, single-quoted pseudo-JSON (common when HTML is inside),
 * and embedded objects wrapped in prose / code fences.
 */
export function parseArticleJson(raw: string): ArticleSections {
  const trimmed = stripCodeFences(raw.trim())
  if (!trimmed) return { hook: '', body: '', cta: '' }

  const tryParse = (text: string): ArticleSections | null => {
    try {
      const parsed = JSON.parse(text) as {
        hook?: unknown
        body?: unknown
        cta?: unknown
        sections?: unknown
      }
      if (!parsed || typeof parsed !== 'object') return null
      const fromOutline = outlineToArticle(parsed)
      if (fromOutline) return fromOutline
      if ('hook' in parsed || 'body' in parsed || 'cta' in parsed) {
        return normalizeSections(parsed)
      }
    } catch {
      // continue
    }
    return null
  }

  const direct = tryParse(trimmed)
  if (direct && (direct.hook || direct.body || direct.cta)) return direct

  const objectMatch = trimmed.match(/\{[\s\S]*\}/)
  if (objectMatch) {
    const blob = objectMatch[0]
    const fromBlob = tryParse(blob)
    if (fromBlob && (fromBlob.hook || fromBlob.body || fromBlob.cta)) return fromBlob

    const coerced = tryParse(coerceSingleQuotedJson(blob))
    if (coerced && (coerced.hook || coerced.body || coerced.cta)) return coerced

    const hook = extractQuotedField(blob, 'hook')
    const body = extractQuotedField(blob, 'body')
    const cta = extractQuotedField(blob, 'cta')
    if (hook || body || cta) {
      return normalizeSections({ hook, body, cta })
    }
  }

  // Last resort: if keys are visible in the text, strip the JSON scaffolding
  if (looksLikeArticleJson(trimmed)) {
    const hook = extractQuotedField(trimmed, 'hook')
    const body = extractQuotedField(trimmed, 'body')
    const cta = extractQuotedField(trimmed, 'cta')
    if (hook || body || cta) {
      return normalizeSections({ hook, body, cta })
    }
  }

  return { hook: '', body: stripCjkBleed(trimmed), cta: '' }
}

/**
 * Clean article HTML for display/editing. If stored content is raw {hook,body,cta}
 * JSON (or a failed parse dump), unwrap it so users never see the keys.
 */
export function sanitizeArticleContent(content: string): string {
  if (!content?.trim()) return content ?? ''
  if (!looksLikeArticleJson(content)) return structureArticleHtml(stripCjkBleed(content))
  const sections = parseArticleJson(content)
  const joined = joinArticleSections(sections)
  // Avoid looping if parse still returns the same raw blob
  if (joined && joined !== content && !looksLikeArticleJson(joined)) {
    return structureArticleHtml(stripCjkBleed(joined))
  }
  if (sections.body && !looksLikeArticleJson(sections.body)) {
    return structureArticleHtml(stripCjkBleed(joinArticleSections(sections)))
  }
  return structureArticleHtml(
    stripCjkBleed(
      content
        .replace(/^\s*\{\s*["']hook["']\s*:\s*["']?/i, '')
        .replace(/["']\s*,\s*["']body["']\s*:\s*["']?/i, '\n\n')
        .replace(/["']\s*,\s*["']cta["']\s*:\s*["']?/i, '\n\n')
        .replace(/["']\s*\}\s*$/i, '')
        .trim(),
    ),
  )
}
