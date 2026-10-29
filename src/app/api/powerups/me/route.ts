import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { UpsellType } from '@/types'
import { ALL_POWERUPS } from '@/types'

export const dynamic = 'force-dynamic'

/** All premium features are included for every account by default. */
const ALL_POWERUPS_LIST: UpsellType[] = ALL_POWERUPS

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ powerups: [] satisfies UpsellType[] }, { status: 401 })
    }

    return NextResponse.json({ powerups: ALL_POWERUPS_LIST })
  } catch (e) {
    console.error('powerups/me', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
