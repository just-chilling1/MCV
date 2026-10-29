import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { resolveOnboardingGate } from '@/lib/onboarding-gate'
import { isDevAuthBypassActive } from '@/lib/dev-bypass'

/** Public route prefixes that bypass auth (extend per product — e.g. hosted sites, sales pages). */
const PUBLIC_ROUTE_PREFIXES = [
  '/sites/',
  '/s/',
  '/article/',
  '/review/',
]

const ONBOARDING_COMPLETE_COOKIE = "mcv_onboarding_complete";
const ONBOARDING_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export async function proxy(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    response.headers.set('X-Robots-Tag', 'noindex, nofollow')

    const { pathname } = request.nextUrl

    if (
      process.env.NODE_ENV !== "development" &&
      (pathname === "/dev" || pathname.startsWith("/dev/"))
    ) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/forgot-password') || pathname.startsWith('/reset-password') || pathname.startsWith('/auth/callback')
    const isStaticAsset = /\.(?:png|jpe?g|gif|svg|webp|ico|woff2?|ttf|otf|mp4|txt|xml)$/i.test(pathname)
    const isPublicHostedRoute = PUBLIC_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix))
    const isPublicEmbedRoute = pathname === '/embed' || pathname.startsWith('/embed/')
    const isPublicRoute =
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname === '/favicon.ico' ||
        pathname === '/robots.txt' ||
        pathname === '/sitemap.xml' ||
        pathname === '/manifest.webmanifest' ||
        pathname === '/free-training-popup.html' ||
        isPublicEmbedRoute ||
        isStaticAsset ||
        isPublicHostedRoute
    const isOnboardingRoute = pathname === '/onboarding' || pathname.startsWith('/onboarding/')

    if (isDevAuthBypassActive(request.nextUrl.hostname)) {
        if (isAuthRoute && !pathname.startsWith('/auth/callback')) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
        return response
    }

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({ name, value, ...options })
                    response = NextResponse.next({ request: { headers: request.headers } })
                    response.cookies.set({ name, value, ...options })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({ name, value: '', ...options })
                    response = NextResponse.next({ request: { headers: request.headers } })
                    response.cookies.set({ name, value: '', ...options })
                },
            },
        }
    )

    const { data: claimsData } = await supabase.auth.getClaims()
    const claims = (claimsData?.claims ?? null) as Record<string, unknown> | null
    const userId = typeof claims?.sub === 'string' ? claims.sub : null
    const userMeta = (claims?.user_metadata ?? null) as Record<string, unknown> | null

    if (pathname.startsWith('/api')) {
        return response
    }

    if (!userId && !isAuthRoute && !isPublicRoute) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    if (userId && isAuthRoute) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    if (userId && !isPublicRoute) {
        if (
            !isOnboardingRoute &&
            request.cookies.get(ONBOARDING_COMPLETE_COOKIE)?.value === "1"
        ) {
            return response;
        }

        const gate = await resolveOnboardingGate(supabase, userId, userMeta)

        if (gate.isComplete && isOnboardingRoute) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }

        if (!gate.isComplete && !isOnboardingRoute) {
            response.cookies.delete(ONBOARDING_COMPLETE_COOKIE)
            return NextResponse.redirect(new URL('/onboarding', request.url))
        }

        if (gate.isComplete) {
            response.cookies.set(ONBOARDING_COMPLETE_COOKIE, '1', {
                maxAge: ONBOARDING_COOKIE_MAX_AGE,
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
            })
        }
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}
