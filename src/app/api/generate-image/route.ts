import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'

export const dynamic = 'force-dynamic'
/** Allow Nano Banana + polling (~20s+ generation on RapidAPI). */
export const maxDuration = 120

type ImagePayload = { kind: 'base64'; b64: string } | { kind: 'url'; url: string }

/** Walk API JSON for base64 image data or an image URL (RapidAPI wrappers vary). */
function findImagePayload(val: unknown, depth = 0): ImagePayload | null {
  if (depth > 8 || val === null || val === undefined) return null

  if (typeof val === 'string') {
    const s = val.trim()
    if (s.startsWith('data:image')) {
      const comma = s.indexOf(',')
      if (comma !== -1) return { kind: 'base64', b64: s.slice(comma + 1) }
    }
    if (/^https?:\/\//i.test(s) && s.length > 12) {
      return { kind: 'url', url: s }
    }
    const compact = s.replace(/\s/g, '')
    if (compact.length > 200 && /^[A-Za-z0-9+/]+=*$/.test(compact)) {
      return { kind: 'base64', b64: compact }
    }
    return null
  }

  if (Array.isArray(val)) {
    for (const item of val) {
      const found = findImagePayload(item, depth + 1)
      if (found) return found
    }
    return null
  }

  if (typeof val === 'object') {
    const o = val as Record<string, unknown>
    const priorityKeys = [
      'image_base64',
      'base64',
      'imageBase64',
      'b64_json',
      'image_url',
      'image',
      'url',
      'result',
      'output',
      'outputs',
      'data',
    ]
    for (const k of priorityKeys) {
      if (k in o) {
        const found = findImagePayload(o[k], depth + 1)
        if (found) return found
      }
    }
    for (const v of Object.values(o)) {
      const found = findImagePayload(v, depth + 1)
      if (found) return found
    }
  }

  return null
}

async function payloadToBuffer(payload: ImagePayload): Promise<Buffer> {
  if (payload.kind === 'base64') {
    return Buffer.from(payload.b64, 'base64')
  }
  const imgRes = await fetch(payload.url, { signal: AbortSignal.timeout(120_000) })
  if (!imgRes.ok) {
    const t = await imgRes.text().catch(() => '')
    throw new Error(`Failed to download image (${imgRes.status}): ${t.slice(0, 200)}`)
  }
  return Buffer.from(await imgRes.arrayBuffer())
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/** Flatten top-level `data` object (common RapidAPI / provider pattern). */
function flattenResponse(data: Record<string, unknown>): Record<string, unknown> {
  const out = { ...data }
  const inner = data.data
  if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
    Object.assign(out, inner as Record<string, unknown>)
  }
  return out
}

function extractAsyncJobRef(data: Record<string, unknown>): { queryKey: string; id: string } | null {
  const flat = flattenResponse(data)
  const keyOrder = ['request_id', 'task_id', 'job_id', 'prediction_id', 'rid', 'id']
  for (const k of keyOrder) {
    const v = flat[k]
    if (typeof v === 'string' && v.length > 2) return { queryKey: k, id: v }
    if (typeof v === 'number' && Number.isFinite(v)) return { queryKey: k, id: String(v) }
  }
  return null
}

function pollStatusLooksFailed(data: Record<string, unknown>): boolean {
  const flat = flattenResponse(data)
  const s = String(flat.status || flat.state || '').toLowerCase()
  return ['failed', 'error', 'cancelled', 'canceled'].includes(s)
}

/** Rate-limit / auth errors must abort immediately — retrying alternate bodies only burns quota. */
class RapidApiFatalError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

/** Poll GET /output.php?task_id=... until an image appears or timeout (Ultra Fast Nano Banana 2). */
async function pollRapidBananaOutput(
  host: string,
  apiKey: string,
  job: { queryKey: string; id: string }
): Promise<Buffer> {
  const headers: Record<string, string> = {
    'x-rapidapi-key': apiKey,
    'x-rapidapi-host': host,
  }
  const maxPolls = 55
  const intervalMs = 2000

  for (let i = 0; i < maxPolls; i++) {
    if (i > 0) await sleep(intervalMs)

    // RapidAPI playground documents the query param as task_id regardless of the key
    // name used in the Create Image response.
    const pollUrl = `https://${host}/output.php?task_id=${encodeURIComponent(job.id)}`
    const pollRes = await fetch(pollUrl, {
      method: 'GET',
      headers,
    })

    if (pollRes.status === 429) {
      const t = await pollRes.text().catch(() => '')
      throw new RapidApiFatalError(429, `output.php HTTP 429: ${t.slice(0, 200)}`)
    }

    if (!pollRes.ok) {
      const t = await pollRes.text().catch(() => '')
      if (pollRes.status === 404 && i === 0) {
        throw new Error(`output.php HTTP 404: ${t.slice(0, 200)}`)
      }
      if (i >= 3) {
        throw new Error(`output.php HTTP ${pollRes.status}: ${t.slice(0, 300)}`)
      }
      continue
    }

    const pollJson = (await pollRes.json()) as Record<string, unknown>

    if (pollStatusLooksFailed(pollJson)) {
      const flat = flattenResponse(pollJson)
      const msg =
        (typeof flat.message === 'string' && flat.message) ||
        (typeof flat.error === 'string' && flat.error) ||
        JSON.stringify(pollJson).slice(0, 400)
      throw new Error(`Image task failed: ${msg}`)
    }

    const imgPayload = findImagePayload(pollJson)
    if (imgPayload) {
      return await payloadToBuffer(imgPayload)
    }
  }

  throw new Error('Image generation timed out waiting for output.php (try again or use OPENAI_API_KEY fallback).')
}

async function callRapidBananaIndexPhp(
  prompt: string,
  host: string,
  apiKey: string
): Promise<Buffer> {
  const url = `https://${host}/index.php`
  const baseHeaders = {
    'x-rapidapi-key': apiKey,
    'x-rapidapi-host': host,
  } as const

  // Ultra Fast Nano Banana 2 (Shreematel) documents JSON: { prompt, image_urls }.
  // image_urls is for edits; try prompt-only first, then explicit empty array,
  // then a legacy form-urlencoded body for older hosts.
  const attempts: Array<{ contentType: string; body: string }> = [
    { contentType: 'application/json', body: JSON.stringify({ prompt }) },
    { contentType: 'application/json', body: JSON.stringify({ prompt, image_urls: [] }) },
    {
      contentType: 'application/x-www-form-urlencoded',
      body: new URLSearchParams({ prompt }).toString(),
    },
  ]

  let lastHttp: string | null = null
  let lastBody: string | null = null

  for (const attempt of attempts) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { ...baseHeaders, 'Content-Type': attempt.contentType },
      body: attempt.body,
    })

    if (response.status === 429 || response.status === 401 || response.status === 403) {
      const errorText = await response.text().catch(() => '')
      throw new RapidApiFatalError(
        response.status,
        `index.php HTTP ${response.status}: ${errorText.slice(0, 300)}`
      )
    }

    if (!response.ok) {
      const errorText = await response.text()
      lastHttp = `index.php HTTP ${response.status}: ${errorText.slice(0, 300)}`
      console.error('RapidAPI index.php error:', errorText)
      continue
    }

    let data: Record<string, unknown>
    try {
      data = (await response.json()) as Record<string, unknown>
    } catch {
      lastBody = 'index.php returned non-JSON (check RAPIDAPI_IMAGE_HOST)'
      continue
    }

    const legacyOk =
      data.status === 'success' &&
      typeof data.image_base64 === 'string' &&
      data.image_base64.length > 0

    if (legacyOk) {
      return Buffer.from(data.image_base64 as string, 'base64')
    }

    const payload = findImagePayload(data)
    if (payload) {
      return await payloadToBuffer(payload)
    }

    // Create Image usually returns a task_id; the image arrives via GET /output.php.
    const job = extractAsyncJobRef(data)
    if (job) {
      return await pollRapidBananaOutput(host, apiKey, job)
    }

    const flatErr = flattenResponse(data)
    lastBody =
      (typeof flatErr.message === 'string' && flatErr.message) ||
      (typeof flatErr.error === 'string' && flatErr.error) ||
      `index.php returned no usable image: ${JSON.stringify(data).slice(0, 400)}`
    console.error('Invalid response from index.php:', data)
  }

  throw new Error(lastHttp || lastBody || 'index.php failed after alternate request bodies')
}

async function callRapidBananaImage(prompt: string): Promise<Buffer> {
  const host =
    process.env.RAPIDAPI_IMAGE_HOST || 'ultra-fast-nano-banana-22.p.rapidapi.com'
  const apiKey = process.env.RAPIDAPI_KEY!

  return await callRapidBananaIndexPhp(prompt, host, apiKey)
}

/**
 * ChatGPT-42 on RapidAPI (rphrp1985) — same subscription used for article generation.
 * POST /texttoimage returns { generated_image: url } (DALLE-based model).
 */
async function callChatGpt42Image(prompt: string): Promise<Buffer> {
  const host = process.env.RAPIDAPI_HOST || 'chatgpt-42.p.rapidapi.com'
  const apiKey = process.env.RAPIDAPI_KEY!
  const headers = {
    'x-rapidapi-key': apiKey,
    'x-rapidapi-host': host,
    'Content-Type': 'application/json',
  } as const

  const endpoints = ['/texttoimage', '/texttoimage3']
  let lastErr: string | null = null

  for (const path of endpoints) {
    const res = await fetch(`https://${host}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ text: prompt, width: 1024, height: 1024 }),
      signal: AbortSignal.timeout(110_000),
    })

    if (res.status === 429 || res.status === 401 || res.status === 403) {
      const t = await res.text().catch(() => '')
      throw new RapidApiFatalError(res.status, `${path} HTTP ${res.status}: ${t.slice(0, 300)}`)
    }

    if (!res.ok) {
      const t = await res.text().catch(() => '')
      lastErr = `${path} HTTP ${res.status}: ${t.slice(0, 300)}`
      console.error('ChatGPT-42 image error:', lastErr)
      continue
    }

    const json = (await res.json()) as Record<string, unknown>
    const payload = findImagePayload(json)
    if (payload) {
      return await payloadToBuffer(payload)
    }

    lastErr = `${path} returned no image: ${JSON.stringify(json).slice(0, 300)}`
    console.error('ChatGPT-42 image error:', lastErr)
  }

  throw new Error(lastErr || 'ChatGPT-42 image generation failed')
}

/**
 * Google Gemini image generation (the official "Nano Banana" model), free tier available.
 * Key from https://aistudio.google.com/apikey — set GEMINI_API_KEY.
 */
async function callGeminiImage(prompt: string): Promise<Buffer> {
  const key = process.env.GEMINI_API_KEY
  if (!key) {
    throw new Error('GEMINI_API_KEY is not configured')
  }

  const model = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image'
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: {
        'x-goog-api-key': key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
      signal: AbortSignal.timeout(110_000),
    }
  )

  if (!res.ok) {
    const t = await res.text().catch(() => '')
    if (res.status === 429) {
      throw new RapidApiFatalError(429, `Gemini rate limit: ${t.slice(0, 300)}`)
    }
    throw new Error(`Gemini HTTP ${res.status}: ${t.slice(0, 300)}`)
  }

  const json = (await res.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ inlineData?: { data?: string } }> }
    }>
  }

  for (const part of json.candidates?.[0]?.content?.parts ?? []) {
    const b64 = part.inlineData?.data
    if (b64 && b64.length > 100) {
      return Buffer.from(b64, 'base64')
    }
  }

  throw new Error(
    `Gemini returned no image data: ${JSON.stringify(json).slice(0, 300)}`
  )
}

async function callOpenAIImage(prompt: string): Promise<Buffer> {
  const key = process.env.OPENAI_API_KEY
  if (!key) {
    throw new Error('OPENAI_API_KEY is not configured')
  }

  const openai = new OpenAI({ apiKey: key })
  const result = await openai.images.generate({
    model: 'dall-e-3',
    prompt: prompt.slice(0, 4000),
    n: 1,
    size: '1024x1024',
    quality: 'standard',
    response_format: 'b64_json',
  })

  const b64 = result.data?.[0]?.b64_json
  if (!b64) {
    throw new Error('OpenAI image generation returned no image data')
  }
  return Buffer.from(b64, 'base64')
}

/** Provider order: ChatGPT-42 (existing paid RapidAPI sub) → Gemini → custom RapidAPI host → OpenAI. */
async function generateImageBuffer(prompt: string): Promise<Buffer> {
  const providers: Array<{ enabled: boolean; run: () => Promise<Buffer> }> = [
    { enabled: !!process.env.RAPIDAPI_KEY, run: () => callChatGpt42Image(prompt) },
    { enabled: !!process.env.GEMINI_API_KEY, run: () => callGeminiImage(prompt) },
    {
      enabled: !!process.env.RAPIDAPI_KEY && !!process.env.RAPIDAPI_IMAGE_HOST,
      run: () => callRapidBananaImage(prompt),
    },
    { enabled: !!process.env.OPENAI_API_KEY, run: () => callOpenAIImage(prompt) },
  ]

  const active = providers.filter((p) => p.enabled)
  if (active.length === 0) {
    throw new Error(
      'No image provider configured. Set GEMINI_API_KEY (free at aistudio.google.com/apikey), or RAPIDAPI_KEY + RAPIDAPI_IMAGE_HOST, or OPENAI_API_KEY.'
    )
  }

  let lastErr: unknown = null
  for (const provider of active) {
    try {
      return await provider.run()
    } catch (err) {
      console.error('Image provider failed, trying next if available:', err)
      lastErr = err
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr))
}

type ArticleImageStorage = {
  storage: {
    from: (bucket: string) => {
      upload: (
        path: string,
        body: Buffer,
        options?: { contentType?: string; upsert?: boolean }
      ) => Promise<{ error: { message?: string } | null }>
      getPublicUrl: (path: string) => { data: { publicUrl: string } }
    }
  }
}

/** Generate one image and store it in the article-images bucket. Shared by Visual Lab and DFY Profit. */
export async function generateStoredArticleImage(
  supabase: ArticleImageStorage,
  userId: string,
  prompt: string
): Promise<string> {
  const trimmed = prompt.trim().slice(0, 2800)
  if (!trimmed) throw new Error('Missing required field: prompt')

  if (
    !process.env.GEMINI_API_KEY &&
    !process.env.RAPIDAPI_KEY &&
    !process.env.OPENAI_API_KEY
  ) {
    throw new Error(
      'Image generation is not configured. Set GEMINI_API_KEY (free at aistudio.google.com/apikey), or RAPIDAPI_KEY + RAPIDAPI_IMAGE_HOST, or OPENAI_API_KEY.'
    )
  }

  const buffer = await generateImageBuffer(trimmed)
  const fileName = `${userId}/${uuidv4()}.png`

  const { error: uploadError } = await supabase.storage
    .from('article-images')
    .upload(fileName, buffer, {
      contentType: 'image/png',
      upsert: false,
    })

  if (uploadError) {
    console.error('Supabase Storage Error: Failed to save image:', uploadError)
    throw new Error(
      'Failed to save generated image to storage. Make sure the "article-images" bucket exists and RLS policies allow inserts.'
    )
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('article-images').getPublicUrl(fileName)

  return publicUrl
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to generate images.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const raw = typeof body.prompt === 'string' ? body.prompt : ''

    const url = await generateStoredArticleImage(supabase, user.id, raw)
    return NextResponse.json({ url })
  } catch (error: unknown) {
    console.error('Image generation error:', error)
    if (error instanceof RapidApiFatalError && error.status === 429) {
      return NextResponse.json(
        {
          error:
            'Image provider rate limit reached (RapidAPI quota exhausted). Wait a minute and retry, or upgrade the plan on RapidAPI.',
        },
        { status: 429 }
      )
    }
    const detail = error instanceof Error ? error.message : String(error)
    if (detail === 'Missing required field: prompt') {
      return NextResponse.json({ error: detail }, { status: 400 })
    }
    if (detail.includes('Image generation is not configured')) {
      return NextResponse.json({ error: detail }, { status: 500 })
    }
    if (detail.includes('Failed to save generated image to storage')) {
      return NextResponse.json({ error: detail }, { status: 500 })
    }
    return NextResponse.json({ error: `Backend Error: ${detail}` }, { status: 500 })
  }
}
