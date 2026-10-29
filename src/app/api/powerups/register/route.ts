import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { UpsellType } from '@/types'

export const dynamic = 'force-dynamic'

const VALID: UpsellType[] = ['10x', 'infinite', 'automation', 'protector']

function normalizePowerups(raw: { powerup: string }[]): UpsellType[] {
  return raw
    .map((r) => (r.powerup === 'dfy' ? 'protector' : r.powerup))
    .filter((p): p is UpsellType => VALID.includes(p as UpsellType))
}

function normalizePowerupInput(s: unknown): UpsellType | null {
  if (typeof s !== 'string') return null
  const normalized = s === 'dfy' ? 'protector' : s
  return VALID.includes(normalized as UpsellType) ? (normalized as UpsellType) : null
}

function isUpsellType(s: unknown): s is UpsellType {
  return normalizePowerupInput(s) !== null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const token = typeof body.token === 'string' ? body.token.trim() : ''
    const powerup = normalizePowerupInput(body.powerup)
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''

    if (!token || !powerup) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user?.email) {
      return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
    }

    if (!email || email !== user.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'Enter the same email you use to sign in to Mobile Cash Vault.' },
        { status: 400 }
      )
    }

    let admin
    try {
      admin = createAdminClient()
    } catch {
      return NextResponse.json(
        { error: 'Server is not configured for power-up registration (missing service role).' },
        { status: 503 }
      )
    }

    const { data: existing } = await admin
      .from('user_powerup_grants')
      .select('powerup')
      .eq('user_id', user.id)
      .eq('powerup', powerup)
      .maybeSingle()

    if (existing) {
      const { data: all } = await supabase
        .from('user_powerup_grants')
        .select('powerup')
        .eq('user_id', user.id)
      const powerups = normalizePowerups(all ?? [])
      return NextResponse.json({ ok: true, already: true, powerups })
    }

    const { data: tokenRow, error: tokenErr } = await admin
      .from('powerup_access_tokens')
      .select('token, powerup, expires_at, max_uses, uses_count')
      .eq('token', token)
      .maybeSingle()

    if (tokenErr || !tokenRow) {
      return NextResponse.json({ error: 'Invalid or unknown access link' }, { status: 400 })
    }

    const tokenPowerup = tokenRow.powerup === 'dfy' ? 'protector' : tokenRow.powerup
    if (tokenPowerup !== powerup) {
      return NextResponse.json({ error: 'This link does not match this power-up' }, { status: 400 })
    }

    if (tokenRow.expires_at) {
      const exp = new Date(tokenRow.expires_at).getTime()
      if (Number.isFinite(exp) && exp < Date.now()) {
        return NextResponse.json({ error: 'This access link has expired' }, { status: 400 })
      }
    }

    if (tokenRow.uses_count >= tokenRow.max_uses) {
      return NextResponse.json({ error: 'This access link has reached its limit' }, { status: 400 })
    }

    const { error: insertErr } = await admin.from('user_powerup_grants').insert({
      user_id: user.id,
      powerup: tokenPowerup,
    })

    if (insertErr) {
      console.error('powerups/register insert:', insertErr)
      return NextResponse.json({ error: 'Could not complete registration' }, { status: 500 })
    }

    const { error: bumpErr } = await admin
      .from('powerup_access_tokens')
      .update({ uses_count: tokenRow.uses_count + 1 })
      .eq('token', token)

    if (bumpErr) {
      console.error('powerups/register bump uses:', bumpErr)
    }

    const { data: all } = await supabase
      .from('user_powerup_grants')
      .select('powerup')
      .eq('user_id', user.id)

    const powerups = normalizePowerups(all ?? [])
    return NextResponse.json({ ok: true, powerups })
  } catch (e) {
    console.error('powerups/register', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
