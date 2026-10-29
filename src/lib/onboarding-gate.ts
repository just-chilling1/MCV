import type { SupabaseClient } from "@supabase/supabase-js";
import { ONBOARDING_META_KEY } from "@/config/onboarding-content";

export interface OnboardingGateResult {
    ok: true;
    isComplete: boolean;
}

const PROFILE_TABLE = "users";
const TIMESTAMP_COLUMN = "onboarding_completed_at";
const LEGACY_AGE_DAYS = 14;

export async function resolveOnboardingGate(
    supabase: SupabaseClient,
    userId: string,
    authMeta?: Record<string, unknown> | null
): Promise<OnboardingGateResult> {
    const metaFlag = authMeta?.[ONBOARDING_META_KEY];

    if (metaFlag === true) {
        return { ok: true, isComplete: true };
    }

    if (metaFlag === false) {
        return { ok: true, isComplete: false };
    }

    let timestampQueryFailed = false;

    try {
        const { data, error } = await supabase
            .from(PROFILE_TABLE)
            .select(`id, ${TIMESTAMP_COLUMN}`)
            .eq("id", userId)
            .maybeSingle();

        if (!error && data) {
            const ts = (data as Record<string, unknown>)[TIMESTAMP_COLUMN];
            if (ts !== null && ts !== undefined) {
                return { ok: true, isComplete: true };
            }
            return { ok: true, isComplete: false };
        }

        if (error) {
            timestampQueryFailed = true;
        }
    } catch {
        timestampQueryFailed = true;
    }

    if (timestampQueryFailed) {
        try {
            const { data, error } = await supabase
                .from(PROFILE_TABLE)
                .select("id, created_at")
                .eq("id", userId)
                .maybeSingle();

            if (!error && data) {
                if (metaFlag === false) {
                    return { ok: true, isComplete: false };
                }
                const createdAt = (data as Record<string, unknown>).created_at;
                if (typeof createdAt === "string") {
                    const ageDays = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
                    if (ageDays >= LEGACY_AGE_DAYS) {
                        return { ok: true, isComplete: true };
                    }
                }
                return { ok: true, isComplete: false };
            }
        } catch {
            // fall through
        }
    }

    return { ok: true, isComplete: false };
}
