import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET — Fetch all articles for the logged-in user
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: articles, error } = await supabase
      .from('articles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch articles error:', error)
      return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 })
    }

    return NextResponse.json({ articles: articles || [] })
  } catch (error) {
    console.error('Articles GET error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST — Save a new article
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id: clientId, title, content, affiliate_link, niche, platform, tone, length, hook, cta, images } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    const insertData: Record<string, unknown> = {
      user_id: user.id,
      title,
      content,
      affiliate_link: affiliate_link || null,
      niche: niche || null,
      platform: platform || [],
      tone: tone || 'authoritative',
      length: length || 'medium',
      status: 'draft',
      hook: hook || null,
      cta: cta || null,
    }
    if (clientId) insertData.id = clientId
    if (images !== undefined) insertData.images = images

    const { data: article, error } = await supabase
      .from('articles')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Save article error details:', error)
      return NextResponse.json({ error: 'Failed to save article' }, { status: 500 })
    }

    return NextResponse.json({ article })
  } catch (error) {
    console.error('Articles POST error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE — Delete an article
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Article ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Delete article error:', error)
      return NextResponse.json({ error: 'Failed to delete article' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Article deleted' })
  } catch (error) {
    console.error('Articles DELETE error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PATCH — Update an existing article
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Article ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const { title, content, affiliate_link, niche, platform, tone, length, status, hook, cta, images } = body

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    if (title !== undefined) updateData.title = title
    if (content !== undefined) updateData.content = content
    if (affiliate_link !== undefined) updateData.affiliate_link = affiliate_link
    if (niche !== undefined) updateData.niche = niche
    if (platform !== undefined) updateData.platform = platform
    if (tone !== undefined) updateData.tone = tone
    if (length !== undefined) updateData.length = length
    if (status !== undefined) updateData.status = status
    if (hook !== undefined) updateData.hook = hook
    if (cta !== undefined) updateData.cta = cta
    if (images !== undefined) updateData.images = images

    const { data: article, error } = await supabase
      .from('articles')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Update article error:', error)
      return NextResponse.json({ error: 'Failed to update article' }, { status: 500 })
    }

    return NextResponse.json({ article })
  } catch (error) {
    console.error('Articles PATCH error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

