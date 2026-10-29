import { NextResponse } from "next/server";
import { getApiUserFromRequest } from "@/lib/api-auth";
import { APP_SUPPORT_NAME, RESEND_SENDER_EMAIL, SUPPORT_EMAIL } from "@/lib/support";

const FRESHDESK_DOMAIN = process.env.FRESHDESK_DOMAIN || "neoaifreshdesk";

export const runtime = "nodejs";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
}

/** Single-line, bounded subject for email/ticket headers. */
function sanitizeSubject(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.replace(/[\r\n]+/g, " ").trim().slice(0, 80);
}

function ticketBody(email: string, message: string, userId: string, requestType: string) {
  const requestTypeText = requestType ? `Request type: ${requestType}\n` : "";
  const requestTypeHtml = requestType
    ? `<br><strong>Request type:</strong> ${escapeHtml(requestType)}`
    : "";

  return {
    text: `Customer email: ${email}\nSoftware: ${APP_SUPPORT_NAME}\n${requestTypeText}\nCustomer inquiry is:\n${message}\n\n---\nUser ID: ${userId}`,
    html: `<p><strong>Customer email:</strong> ${escapeHtml(email)}<br><strong>Software:</strong> ${APP_SUPPORT_NAME}${requestTypeHtml}</p><p><strong>Customer inquiry is:</strong></p><p>${escapeHtml(message)}</p><p><em>User ID: ${userId}</em></p>`,
  };
}

async function sendViaResend(
  email: string,
  message: string,
  userId: string,
  requestType: string
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const from =
    process.env.RESEND_FROM_EMAIL || `${APP_SUPPORT_NAME} <${RESEND_SENDER_EMAIL}>`;
  const { text, html } = ticketBody(email, message, userId, requestType);
  const subject = requestType
    ? `${APP_SUPPORT_NAME} — ${requestType} from ${email}`
    : `${APP_SUPPORT_NAME} support request from ${email}`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [SUPPORT_EMAIL],
      reply_to: email,
      subject,
      text,
      html,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("[mobile-cash-vault] Resend error:", res.status, detail);
    return false;
  }

  return true;
}

async function sendViaFreshdesk(
  email: string,
  message: string,
  userId: string,
  requestType: string
): Promise<boolean> {
  const apiKey = process.env.FRESHDESK_API_KEY;
  if (!apiKey) return false;

  const { html } = ticketBody(email, message, userId, requestType);
  const subject = requestType
    ? `${APP_SUPPORT_NAME} — ${requestType} from ${email}`
    : `${APP_SUPPORT_NAME} support request from ${email}`;
  const auth = Buffer.from(`${apiKey}:X`).toString("base64");

  const res = await fetch(`https://${FRESHDESK_DOMAIN}.freshdesk.com/api/v2/tickets`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
    body: JSON.stringify({
      email,
      subject,
      description: html,
      priority: 2,
      status: 2,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("[mobile-cash-vault] Freshdesk error:", res.status, detail);
    return false;
  }

  return true;
}

// ponytail: per-instance IP cap only (one Node process). Upgrade to Redis/Upstash when abuse spans instances.
const SUPPORT_WINDOW_MS = 60_000;
const SUPPORT_MAX_PER_WINDOW = 5;
const supportHits = new Map<string, { count: number; resetAt: number }>();

function allowSupportRequest(ip: string): boolean {
  const now = Date.now();
  const entry = supportHits.get(ip);
  if (!entry || entry.resetAt <= now) {
    supportHits.set(ip, { count: 1, resetAt: now + SUPPORT_WINDOW_MS });
    return true;
  }
  if (entry.count >= SUPPORT_MAX_PER_WINDOW) return false;
  entry.count += 1;
  return true;
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function POST(request: Request) {
  try {
    if (!allowSupportRequest(clientIp(request))) {
      return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
    }

    const { user } = await getApiUserFromRequest(request);

    // Visitors on login / signup / password pages can contact support without a session.
    const userId = user?.id ?? "not signed in (auth pages)";

    const body = await request.json();
    const bodyEmail = typeof body.email === "string" ? body.email.trim() : "";
    const email = (user?.email?.trim() || bodyEmail);
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const subject = sanitizeSubject(body.subject);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
    }

    if (message.length < 10) {
      return NextResponse.json({ error: "Message is too short" }, { status: 400 });
    }

    const sent =
      (await sendViaFreshdesk(email, message, userId, subject)) ||
      (await sendViaResend(email, message, userId, subject));

    if (!sent) {
      return NextResponse.json(
        {
          error: "Could not send automatically — opening your email app instead.",
          useMailto: true,
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[mobile-cash-vault] Support error:", error);
    return NextResponse.json(
      {
        error: "Could not send automatically — opening your email app instead.",
        useMailto: true,
      },
      { status: 500 }
    );
  }
}
