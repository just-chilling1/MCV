import { supabase } from "@/lib/supabase";
import { SUPPORT_EMAIL } from "@/lib/support";
import { storageKeys } from "@/lib/storage-keys";

export const REQUEST_SUBJECT = "License Rights";

export const DEFAULT_REQUEST_MESSAGE = `I purchased the Full Turnkey Reseller & License Rights Edition and would like the team to activate it on my account.

Please reply to this email when the license is ready.`;

export interface PendingLicenseRightsRequest {
  email: string;
  submittedAt: string;
}

export type SubmitLicenseRightsResult =
  | { ok: true; viaMailto: boolean }
  | { ok: false; error: string };

function pendingStorageKey(userId: string): string {
  return `${storageKeys.licenseRightsRequest}_${userId}`;
}

export function readPendingRequest(userId: string): PendingLicenseRightsRequest | null {
  if (typeof window === "undefined" || !userId) return null;
  try {
    const raw = window.localStorage.getItem(pendingStorageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingLicenseRightsRequest;
    if (typeof parsed?.email !== "string" || typeof parsed?.submittedAt !== "string") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function savePendingRequest(userId: string, email: string): void {
  if (typeof window === "undefined" || !userId) return;
  try {
    const payload: PendingLicenseRightsRequest = {
      email,
      submittedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(pendingStorageKey(userId), JSON.stringify(payload));
  } catch {
    /* storage may be unavailable */
  }
}

export function clearPendingRequest(userId: string): void {
  if (typeof window === "undefined" || !userId) return;
  try {
    window.localStorage.removeItem(pendingStorageKey(userId));
  } catch {
    /* storage may be unavailable */
  }
}

async function parseJsonResponse(res: Response): Promise<{
  error?: string;
  useMailto?: boolean;
  success?: boolean;
} | null> {
  const text = await res.text();
  if (!text.trim()) return {};

  try {
    return JSON.parse(text) as { error?: string; useMailto?: boolean; success?: boolean };
  } catch {
    return null;
  }
}

function openLicenseRightsMailto(email: string, message: string) {
  const body = `Please reply to: ${email}\n\n${message}`;
  window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(REQUEST_SUBJECT)}&body=${encodeURIComponent(body)}`;
}

export async function submitLicenseRightsRequest({
  email,
  message,
}: {
  email: string;
  message: string;
}): Promise<SubmitLicenseRightsResult> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }

    const res = await fetch("/api/support", {
      method: "POST",
      headers,
      credentials: "same-origin",
      body: JSON.stringify({ email, message, subject: REQUEST_SUBJECT }),
    });

    const data = await parseJsonResponse(res);

    if (data === null || res.status === 401 || data.useMailto) {
      openLicenseRightsMailto(email, message);
      return { ok: true, viaMailto: true };
    }

    if (res.ok && data.success) {
      return { ok: true, viaMailto: false };
    }

    return { ok: false, error: data.error || "Something went wrong. Please try again." };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Something went wrong.",
    };
  }
}
