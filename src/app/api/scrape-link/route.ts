import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { assertPublicHttpsUrlResolved } from '@/lib/safe-url'

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

    let safeUrl: URL
    try {
      safeUrl = await assertPublicHttpsUrlResolved(url)
    } catch {
      return NextResponse.json({ error: 'Only public https URLs are allowed' }, { status: 400 })
    }

    const scraperApiKey = process.env.SCRAPER_API_KEY
    if (!scraperApiKey) {
      return NextResponse.json({ error: 'ScraperAPI key not configured' }, { status: 500 })
    }

    // Use ScraperAPI to fetch the page content
    const scraperUrl = `https://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(safeUrl.toString())}&render=true`
    
    const response = await fetch(scraperUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(30000), // 30 second timeout
    })

    if (!response.ok) {
      console.error('ScraperAPI error:', response.status, await response.text())
      return NextResponse.json({ error: 'Failed to scrape the URL' }, { status: 500 })
    }

    const html = await response.text()

    // Extract useful info from the HTML
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is)
    const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : ''

    // Extract meta description
    const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/is)
    const metaDescription = metaDescMatch ? metaDescMatch[1].replace(/\s+/g, ' ').trim() : ''

    // Extract OG title and description
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["'](.*?)["']/is)
    const ogTitle = ogTitleMatch ? ogTitleMatch[1].replace(/\s+/g, ' ').trim() : ''

    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["'](.*?)["']/is)
    const ogDesc = ogDescMatch ? ogDescMatch[1].replace(/\s+/g, ' ').trim() : ''

    // Extract price if available
    const priceMatch = html.match(/(?:price|سعر)[^<]*?(\d+[\.,]?\d*)/is)
    const price = priceMatch ? priceMatch[1] : ''

    // Extract product name from h1
    const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/is)
    const h1Text = h1Match ? h1Match[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() : ''

    // Extract any visible text that might contain product info (first 2000 chars of body text)
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/is)
    let bodyText = ''
    if (bodyMatch) {
      bodyText = bodyMatch[1]
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 2000)
    }

    const productInfo = {
      title: ogTitle || title || h1Text || '',
      description: ogDesc || metaDescription || '',
      h1: h1Text,
      price,
      bodySnippet: bodyText.substring(0, 500),
    }

    return NextResponse.json({ productInfo })
  } catch (error) {
    console.error('Scrape error:', error)
    return NextResponse.json({ error: 'Failed to scrape the URL' }, { status: 500 })
  }
}
