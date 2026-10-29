import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: snippets, error } = await supabase
      .from('snippets')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('snippets GET:', error)
      return NextResponse.json({ error: 'Failed to load snippets' }, { status: 500 })
    }

    return NextResponse.json({ snippets: snippets || [] })
  } catch (e) {
    console.error('snippets GET:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, body: snippetBody, kind = 'snippet' } = body

    if (!title || !snippetBody) {
      return NextResponse.json({ error: 'Title and body are required' }, { status: 400 })
    }

    const k = kind === 'cta' ? 'cta' : 'snippet'

    const { data: row, error } = await supabase
      .from('snippets')
      .insert({
        user_id: user.id,
        title: String(title).trim(),
        body: String(snippetBody).trim(),
        kind: k,
      })
      .select()
      .single()

    if (error) {
      console.error('snippets POST:', error)
      return NextResponse.json({ error: 'Failed to save snippet' }, { status: 500 })
    }

    return NextResponse.json({ snippet: row })
  } catch (e) {
    console.error('snippets POST:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = new URL(request.url).searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const body = await request.json()
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.title !== undefined) update.title = String(body.title).trim()
    if (body.body !== undefined) update.body = String(body.body).trim()
    if (body.kind !== undefined) update.kind = body.kind === 'cta' ? 'cta' : 'snippet'

    const { data: row, error } = await supabase
      .from('snippets')
      .update(update)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('snippets PATCH:', error)
      return NextResponse.json({ error: 'Failed to update snippet' }, { status: 500 })
    }

    return NextResponse.json({ snippet: row })
  } catch (e) {
    console.error('snippets PATCH:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = new URL(request.url).searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('snippets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('snippets DELETE:', error)
      return NextResponse.json({ error: 'Failed to delete snippet' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('snippets DELETE:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
