"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { CheckCircle2, Headphones, Loader2, Mail, Send, Sparkles } from "lucide-react";
import { getCachedClientUser } from "@/lib/auth-client-cache";
import { APP_SUPPORT_NAME, FREE_TRAINING_URL, SUPPORT_EMAIL } from "@/lib/support";
import { copyToClipboard } from "@/lib/clipboard";
import { trainingContent } from "@/config/training.config";
import { support } from "@/config/support.config";
import { supabase } from "@/lib/supabase";
import { DashboardSection } from "./DashboardSection";

type FormState = "idle" | "submitting" | "success" | "error";

const fieldClass =
  "w-full min-w-0 rounded-lg border border-[color-mix(in_srgb,var(--mcv-ink)_18%,transparent)] bg-[var(--mcv-surface-sub)] px-3.5 py-3 text-sm leading-normal text-[var(--mcv-ink-strong)] placeholder:text-[color-mix(in_srgb,var(--mcv-ink-strong)_58%,transparent)] focus:border-brass-700 focus:outline-none focus:ring-2 focus:ring-brass-700/35 transition-all";

const embeddedLabelClass =
  "mb-2 block text-[13px] font-medium uppercase tracking-wide text-[var(--mcv-ink-strong)]";

const labelClass = embeddedLabelClass;

const insetClass =
  "rounded-lg border border-[color-mix(in_srgb,var(--mcv-ink)_18%,transparent)] bg-[var(--mcv-surface-sub)]";

function trainingUpsellUrl(): string | null {
  const external = trainingContent.externalTrainingUrl?.trim();
  if (external) return external;
  const free = FREE_TRAINING_URL?.trim();
  if (free) return free;
  return null;
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

function openSupportMailto(email: string, message: string) {
  const subject = `${APP_SUPPORT_NAME} — Support Request`;
  const body = `Please reply to: ${email}\n\n${message}`;
  window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function finishWithMailto(
  email: string,
  message: string,
  setSubmittedEmail: (value: string) => void,
  setSentViaMailto: (value: boolean) => void,
  setFormState: (value: FormState) => void
) {
  openSupportMailto(email, message);
  setSubmittedEmail(email);
  setSentViaMailto(true);
  setFormState("success");
}

function SupportSuccessPanel({
  embedded,
  submittedEmail,
  sentViaMailto,
  onReset,
}: {
  embedded: boolean;
  submittedEmail: string;
  sentViaMailto: boolean;
  onReset: () => void;
}) {
  const upsellUrl = trainingUpsellUrl();

  return (
    <div className={`support-success-panel space-y-5 ${embedded ? "p-4" : "p-6"}`}>
      <div className="flex flex-col items-center space-y-4 text-center">
        <div className="support-success-icon">
          <CheckCircle2 className="h-6 w-6" aria-hidden />
        </div>
        <h3 className="support-success-title">
          {sentViaMailto ? "Check your email app" : "Message sent"}
        </h3>
        <p className="support-success-body">
          {sentViaMailto ? (
            <>
              Your email app should open with your message ready to send. Tap{" "}
              <span className="font-medium text-text-heading">Send</span> to deliver it — then
              we&apos;ll reply to <span className="support-success-email">{submittedEmail}</span>.
            </>
          ) : (
            <>
              We&apos;ll reply to <span className="support-success-email">{submittedEmail}</span>.
            </>
          )}{" "}
          We usually respond within about 2 hours — during busy periods, please allow 24–48 hours.
        </p>
        <p className="support-success-body">
          Remember: our reply will go to{" "}
          <span className="support-success-email">{submittedEmail}</span> only — not another inbox
          you may use elsewhere. If you don&apos;t see it within 48 hours, check that inbox&apos;s
          spam or junk folder.
        </p>
      </div>

      {upsellUrl ? (
        <div className="support-success-upsell">
          <p className="support-success-upsell-text">
            While you wait, start with our{" "}
            <span className="support-success-upsell-highlight">free training</span> — discover how to
            wake up with an extra{" "}
            <span className="support-success-upsell-highlight">$1,000–$5,000</span> in your account
            and scale to $1k–$5k per day without extra grind.
          </p>
          <p className="support-success-warning">Warning: This may be taken down soon</p>
          <a
            href={upsellUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="support-success-cta"
          >
            Watch The Free Training &gt;&gt;
          </a>
        </div>
      ) : null}

      <button type="button" onClick={onReset} className="support-success-secondary-btn">
        Send another message
      </button>
    </div>
  );
}

export function ContactSupportWidget({
  embedded = false,
  featured = false,
}: {
  embedded?: boolean;
  /** Support page hero treatment — larger, brass-framed contact form. */
  featured?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [sentViaMailto, setSentViaMailto] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const emailFieldId = embedded
    ? "support-email"
    : featured
      ? "support-page-email"
      : "dashboard-support-email";
  const messageFieldId = embedded
    ? "support-message"
    : featured
      ? "support-page-message"
      : "dashboard-support-message";

  useEffect(() => {
    void getCachedClientUser().then((user) => {
      if (user?.email) setEmail(user.email);
    });
  }, []);

  const resetForm = () => {
    setFormState("idle");
    setMessage("");
    setSentViaMailto(false);
    setErrorMessage("");
  };

  const handleSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      setErrorMessage("");

      const trimmedEmail = email.trim();
      const trimmedMessage = message.trim();

      if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        setErrorMessage("Please enter a valid email address.");
        setFormState("error");
        return;
      }

      if (trimmedMessage.length < 10) {
        setErrorMessage("Please add a bit more detail so we can help you.");
        setFormState("error");
        return;
      }

      setFormState("submitting");

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
          body: JSON.stringify({ email: trimmedEmail, message: trimmedMessage }),
        });

        const data = await parseJsonResponse(res);

        if (data === null) {
          finishWithMailto(
            trimmedEmail,
            trimmedMessage,
            setSubmittedEmail,
            setSentViaMailto,
            setFormState
          );
          return;
        }

        if (res.status === 401) {
          finishWithMailto(
            trimmedEmail,
            trimmedMessage,
            setSubmittedEmail,
            setSentViaMailto,
            setFormState
          );
          return;
        }

        if (res.ok && data.success) {
          setSubmittedEmail(trimmedEmail);
          setSentViaMailto(false);
          setFormState("success");
          return;
        }

        if (data.useMailto) {
          finishWithMailto(
            trimmedEmail,
            trimmedMessage,
            setSubmittedEmail,
            setSentViaMailto,
            setFormState
          );
          return;
        }

        throw new Error(data.error || "Something went wrong. Please try again.");
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
        setFormState("error");
      }
    },
    [email, message]
  );

  if (formState === "success") {
    if (featured) {
      return (
        <div className="support-contact-featured">
          <SupportSuccessPanel
            embedded={false}
            submittedEmail={submittedEmail}
            sentViaMailto={sentViaMailto}
            onReset={resetForm}
          />
        </div>
      );
    }
    return (
      <SupportSuccessPanel
        embedded={embedded}
        submittedEmail={submittedEmail}
        sentViaMailto={sentViaMailto}
        onReset={resetForm}
      />
    );
  }

  const formFields = (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
      <div className="min-w-0">
        <label htmlFor={emailFieldId} className={labelClass}>
          Your email
        </label>
        <input
          id={emailFieldId}
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          disabled={formState === "submitting"}
          className={fieldClass}
        />
      </div>

      <div className="min-w-0">
        <label htmlFor={messageFieldId} className={labelClass}>
          Your message
        </label>
        <textarea
          id={messageFieldId}
          name="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us what you need help with..."
          required
          disabled={formState === "submitting"}
          rows={featured ? 6 : 3}
          className={`${fieldClass} resize-y ${featured ? "min-h-[160px]" : "min-h-[96px]"}`}
        />
      </div>

      {formState === "error" && errorMessage ? (
        <p className="text-sm font-medium text-[var(--mcv-danger)]" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 pt-1">
        <p
          className={`${insetClass} px-3 py-2.5 text-xs leading-relaxed text-[var(--mcv-ink)]`}
        >
          <span className="font-medium text-[var(--mcv-ink-strong)]">Please note:</span> We reply to the email
          above. Check spam or junk if you don&apos;t hear back within 48 hours.
        </p>

        <button
          type="submit"
          disabled={formState === "submitting"}
          className={`btn-primary w-full shadow-brass ${featured ? "min-h-[52px] text-base" : embedded ? "min-h-[44px] py-2.5" : "min-h-[48px]"}`}
        >
          {formState === "submitting" ? (
            <span className="inline-flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending...
            </span>
          ) : (
            <span className="inline-flex items-center justify-center gap-2">
              <Send className="h-4 w-4 shrink-0" aria-hidden />
              {featured ? "Send message to support" : "Send message"}
            </span>
          )}
        </button>
      </div>
    </form>
  );

  const mailtoFallback = (
    <div
      className={`${insetClass} flex gap-2.5 px-3 py-2.5`}
    >
      <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[color-mix(in_srgb,var(--mcv-ink-strong)_70%,transparent)]" />
      <div className="min-w-0">
        <p className="text-xs leading-snug text-[var(--mcv-ink)]">
          Form not working? Copy our support email:
        </p>
        <button
          type="button"
          onClick={() => void copyToClipboard(SUPPORT_EMAIL)}
          className="mt-1 block break-all text-left text-sm font-medium text-[var(--mcv-ink-strong)] underline decoration-[color-mix(in_srgb,var(--mcv-ink-strong)_45%,transparent)] underline-offset-2 hover:decoration-[var(--mcv-ink-strong)]"
        >
          {SUPPORT_EMAIL}
        </button>
      </div>
    </div>
  );

  const introCopy = (
    <p className="text-sm leading-relaxed text-[var(--mcv-ink)]">
      We usually reply within about 2 hours — allow{" "}
      <span className="font-medium text-[var(--mcv-ink-strong)]">24–48 hours</span> during busy periods.
    </p>
  );

  if (embedded) {
    return (
      <div className="support-widget-card min-w-0 overflow-hidden rounded-xl p-5">
        <div className="mb-3 flex min-w-0 items-center gap-3">
          <div className="shrink-0 rounded-xl border border-[var(--mcv-line-brass)] bg-brass-100 p-2.5">
            <Headphones className="h-5 w-5 text-brass-700" />
          </div>
          <h3 className="text-sm font-medium uppercase tracking-widest text-text-heading">Contact Support</h3>
        </div>

        <div className="flex flex-col gap-4">
          {introCopy}
          {formFields}
          {mailtoFallback}
        </div>
      </div>
    );
  }

  if (featured) {
    return (
      <section className="support-contact-featured" aria-labelledby="support-contact-heading">
        <div className="support-contact-featured-header">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[var(--mcv-line-brass)] bg-brass-100">
              <Headphones className="h-6 w-6 text-brass-700" aria-hidden />
            </div>
            <div className="min-w-0">
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[var(--mcv-line-brass)] bg-brass-100 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-brass-700">
                <Sparkles className="h-3 w-3" aria-hidden />
                Recommended
              </div>
              <h2 id="support-contact-heading" className="ds-h2 text-text-heading">
                {support.formHeading}
              </h2>
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-text-secondary sm:text-base">
                {support.formSubheading}
              </p>
            </div>
          </div>
          <p className="shrink-0 rounded-lg border border-success/25 bg-success/10 px-3 py-2 text-sm font-medium text-success">
            Avg reply under 2 hours
          </p>
        </div>

        <div className="support-contact-featured-body">
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
            {introCopy}
            {formFields}
            {mailtoFallback}
          </div>
        </div>
      </section>
    );
  }

  return (
    <DashboardSection className="min-w-0">
      <div className="flex items-center gap-3 border-b border-border-dim/60 pb-4">
        <div className="dashboard-section-icon">
          <Headphones size={20} />
        </div>
        <h3 className="ds-h3 min-w-0">Contact Support</h3>
      </div>

      <div className="mt-3 flex flex-col gap-4">
        {introCopy}
        {formFields}
        <div className="border-t border-border-dim/50 pt-4">{mailtoFallback}</div>
      </div>
    </DashboardSection>
  );
}
