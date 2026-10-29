import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { getServerAppUrl } from "@/lib/app-url";

function safeNextPath(next: string | null): string {
    if (!next || !next.startsWith("/") || next.startsWith("//")) return "/reset-password";
    return next;
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type") as EmailOtpType | null;
    const next = safeNextPath(
        searchParams.get("next") ?? (type === "recovery" ? "/reset-password" : null),
    );

    // Resolve the public origin explicitly — request.url behind the DigitalOcean
    // proxy can point at the internal host instead of the real domain.
    const siteUrl = getServerAppUrl(request);
    const redirectTarget = new URL(next, siteUrl);

    if (code || (tokenHash && type)) {
        const response = NextResponse.redirect(redirectTarget);

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return request.cookies.get(name)?.value;
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        response.cookies.set({ name, value, ...options });
                    },
                    remove(name: string, options: CookieOptions) {
                        response.cookies.set({ name, value: "", ...options });
                    },
                },
            }
        );

        try {
            if (code) {
                const { error } = await supabase.auth.exchangeCodeForSession(code);
                if (error) {
                    console.error("Code exchange error:", error.message);
                    const errorUrl = new URL("/reset-password", siteUrl);
                    errorUrl.searchParams.set("error", error.message);
                    return NextResponse.redirect(errorUrl);
                }
                return response;
            }

            const { error } = await supabase.auth.verifyOtp({
                token_hash: tokenHash!,
                type: type!,
            });
            if (error) {
                console.error("OTP verify error:", error.message);
                const errorUrl = new URL("/reset-password", siteUrl);
                errorUrl.searchParams.set("error", error.message);
                return NextResponse.redirect(errorUrl);
            }
            return response;
        } catch (err: unknown) {
            console.error("Auth callback exception:", err);
            const errorUrl = new URL("/reset-password", siteUrl);
            errorUrl.searchParams.set("error", "Failed to verify reset link. Please try again.");
            return NextResponse.redirect(errorUrl);
        }
    }

    return NextResponse.redirect(new URL("/login", siteUrl));
}
