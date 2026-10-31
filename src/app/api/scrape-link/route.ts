import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { scrapePage } from '@/features/blog-builder/lib/scrape'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Direct fetch first (no JS render) — enough for title/meta/og used by Craft.
    const scraped = await scrapePage(url, { skipImageFallback: true })
    if (!scraped) {
      return NextResponse.json({ error: 'Failed to scrape the URL' }, { status: 500 })
    }

    const productInfo = {
      title: scraped.title || '',
      description: scraped.description || '',
      h1: scraped.h1 || '',
      price: scraped.price || '',
      bodySnippet: (scraped.bodySnippet || '').substring(0, 500),
    }

    return NextResponse.json({ productInfo })
  } catch (error) {
    console.error('Scrape error:', error)
    return NextResponse.json({ error: 'Failed to scrape the URL' }, { status: 500 })
  }
}
