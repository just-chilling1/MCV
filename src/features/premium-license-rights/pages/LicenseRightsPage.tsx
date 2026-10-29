"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  FileText,
  LayoutTemplate,
  Loader2,
  Lock,
  Mail,
  Palette,
  Scale,
  Send,
  Sparkles,
  Tag,
} from "lucide-react";
import { PremiumPageLayout } from "@/components/premium/PremiumPageLayout";
import { PremiumControlCard } from "@/components/premium/PremiumControlCard";
import { PremiumFooter } from "@/components/premium/PremiumFooter";
import { PremiumErrorAlert } from "@/components/premium/PremiumErrorAlert";
import { PremiumVideoTutorial } from "@/components/premium/PremiumVideoTutorial";
import { getFeatureThumbnail } from "@/lib/video-thumbnails";
import { GlassPanel } from "@/components/ui/glass-panel";
import { getCachedClientUser } from "@/lib/auth-client-cache";
import { SUPPORT_EMAIL } from "@/lib/support";
import { copyToClipboard } from "@/lib/clipboard";
import { cn } from "@/lib/utils";
import { brand } from "@/config/brand.config";
import {
  EDITION_CONTENTS,
  type EditionContent,
  type EditionIconId,
} from "@/features/premium-license-rights/lib/edition-contents";
import {
  DEFAULT_REQUEST_MESSAGE,
  REQUEST_SUBJECT,
  clearPendingRequest,
  readPendingRequest,
  savePendingRequest,
  submitLicenseRightsRequest,
  type PendingLicenseRightsRequest,
} from "@/features/premium-license-rights/lib/license-rights-request";

type FormState = "idle" | "submitting" | "error";

const fieldClass =
  "w-full min-w-0 rounded-xl border border-border-dim/70 bg-page/80 px-3.5 py-3 text-sm leading-normal text-text-primary placeholder:text-text-muted focus:border-brass-700 focus:outline-none focus:ring-2 focus:ring-brass-100 transition-all";

const labelClass = "mb-2 block text-[13px] font-medium uppercase tracking-wide text-text-muted";

const EDITION_ICONS: Record<EditionIconId, typeof Scale> = {
  scale: Scale,
  palette: Palette,
  layout: LayoutTemplate,
  book: BookOpen,
};

function EditionContentCard({ item, index }: { item: EditionContent; index: number }) {
  const Icon = EDITION_ICONS[item.icon];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 * index, duration: 0.35 }}
    >
      <GlassPanel
        intensity="low"
        className="group h-full border-[var(--mcv-line-brass)]/60 transition-all duration-300 hover:border-brass-700/40"
        contentClassName="p-4 sm:p-5"
      >
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--mcv-line-brass)] bg-brass-100 text-brass-700 transition-colors group-hover:bg-brass-700 group-hover:text-white">
              <Icon size={20} aria-hidden />
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-[var(--mcv-line-brass)] bg-page text-brass-700">
              <Lock size={10} aria-hidden />
            </div>
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-medium text-text-primary">{item.title}</h3>
              <span className="rounded-full border border-[var(--mcv-line-brass)] bg-page/80 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-brass-700">
                Locked
              </span>
            </div>
            <p className="text-xs leading-relaxed text-text-secondary">{item.description}</p>
          </div>
        </div>
      </GlassPanel>
    </motion.div>
  );
}

function PendingActivationPanel({
  email,
  viaMailto,
  onReset,
}: {
  email: string;
  viaMailto: boolean;
  onReset: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="support-success-panel space-y-6 p-6 sm:p-8"
    >
      <div className="flex flex-col items-center space-y-4 text-center">
        <div className="support-success-icon">
          <CheckCircle2 className="h-6 w-6" aria-hidden />
        </div>
        <div className="space-y-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--mcv-warning)]/25 bg-[var(--mcv-warning)]/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-[var(--mcv-warning)]">
            <Clock size={12} aria-hidden />
            Awaiting team activation
          </span>
          <h3 className="support-success-title">Request received</h3>
        </div>
        <p className="support-success-body">
          {viaMailto ? (
            <>
              Your email app should open with subject{" "}
              <span className="font-medium text-text-heading">{REQUEST_SUBJECT}</span>. Tap{" "}
              <span className="font-medium text-text-heading">Send</span> to deliver it — then
              we&apos;ll reply to <span className="support-success-email">{email}</span>.
            </>
          ) : (
            <>
              We&apos;ll reply to <span className="support-success-email">{email}</span> when
              your reseller license is activated.
            </>
          )}{" "}
          We usually respond within about 2 hours — during busy periods, please allow 24–48 hours.
        </p>
        <p className="support-success-body">
          This edition stays locked until the team activates it. Our reply will go to{" "}
          <span className="support-success-email">{email}</span> only — check that inbox&apos;s
          spam or junk folder if you don&apos;t see it within 48 hours.
        </p>
      </div>

      <button type="button" onClick={onReset} className="support-success-secondary-btn">
        Send another request
      </button>
    </motion.div>
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="h-12 animate-pulse rounded-xl bg-page/60" />
      <div className="h-36 animate-pulse rounded-xl bg-page/60" />
      <div className="h-11 animate-pulse rounded-xl bg-page/60" />
    </div>
  );
}

export default function LicenseRightsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(DEFAULT_REQUEST_MESSAGE);
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [pending, setPending] = useState<PendingLicenseRightsRequest | null>(null);
  const [viaMailto, setViaMailto] = useState(false);
  const [ready, setReady] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  useEffect(() => {
    void getCachedClientUser().then((user) => {
      if (user?.email) setEmail(user.email);
      if (user?.id) {
        setUserId(user.id);
        setPending(readPendingRequest(user.id));
      }
      setReady(true);
    });
  }, []);

  const handleReset = () => {
    if (userId) clearPendingRequest(userId);
    setPending(null);
    setViaMailto(false);
    setFormState("idle");
    setErrorMessage("");
  };

  const handleCopyEmail = async () => {
    try {
      await copyToClipboard(SUPPORT_EMAIL);
      setCopiedEmail(true);
      window.setTimeout(() => setCopiedEmail(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
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

      const result = await submitLicenseRightsRequest({
        email: trimmedEmail,
        message: trimmedMessage,
      });

      if (!result.ok) {
        setErrorMessage(result.error);
        setFormState("error");
        return;
      }

      if (userId) savePendingRequest(userId, trimmedEmail);
      setPending({ email: trimmedEmail, submittedAt: new Date().toISOString() });
      setViaMailto(result.viaMailto);
      setFormState("idle");
    },
    [email, message, userId]
  );

  const statusBadge = pending ? (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--mcv-warning)]/25 bg-[var(--mcv-warning)]/10 px-4 py-3">
      <Clock size={16} className="text-[var(--mcv-warning)]" aria-hidden />
      <span className="text-sm font-medium uppercase tracking-wider text-[var(--mcv-warning)]">
        Pending review
      </span>
    </div>
  ) : (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--mcv-line-brass)] bg-brass-100 px-4 py-3">
      <Lock size={16} className="text-brass-700" aria-hidden />
      <span className="text-sm font-medium uppercase tracking-wider text-brass-700">
        Activation required
      </span>
    </div>
  );

  const overviewStats = [
    {
      label: "Edition status",
      value: pending ? "Pending review" : "Not activated",
      icon: pending ? Clock : Lock,
      tone: pending ? "text-[var(--mcv-warning)]" : "text-brass-700",
    },
    {
      label: "Ticket subject",
      value: REQUEST_SUBJECT,
      icon: Tag,
      tone: "text-brass-700",
    },
    {
      label: "Typical reply",
      value: "2–48 hours",
      icon: Clock,
      tone: "text-text-secondary",
    },
  ];

  return (
    <PremiumPageLayout
      title="Full Turnkey Reseller & License Rights Edition"
      subtitle={`Request activation from our support desk. Your ticket is filed as "${REQUEST_SUBJECT}" and the team unlocks this edition on your account.`}
      footer={<PremiumFooter />}
    >
      <PremiumVideoTutorial
        title="How to Use Reseller & License Rights"
        description="Send one License Rights request, wait for team activation, and unlock the turnkey reseller edition on your account."
        iframeTitle="Reseller & License Rights Tutorial"
        thumbnailSrc={getFeatureThumbnail("reseller-license")}
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-[var(--mcv-line-brass)] bg-linear-to-br from-brass-100 via-brass-100/80 to-page p-5 sm:p-6"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-grad-brass text-black shadow-sm">
              <Award size={22} aria-hidden />
            </div>
            <div className="space-y-1">
              <p className="flex items-center gap-2 text-sm font-medium text-text-primary">
                <Sparkles size={15} className="text-brass-700" aria-hidden />
                Premium reseller edition
              </p>
              <p className="max-w-2xl text-sm leading-relaxed text-text-secondary">
                Sell {brand.productName} under your own brand with turnkey assets. Submit one
                request below — our team handles activation manually.
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-[var(--mcv-line-brass)] bg-page/80 px-3 py-1.5 text-xs font-medium text-brass-700 sm:self-center">
            <Tag size={13} aria-hidden />
            Subject: {REQUEST_SUBJECT}
          </div>
        </div>
      </motion.div>

      <div className="stat-grid md:grid-cols-3">
        {overviewStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * index }}
          >
            <GlassPanel intensity="low" className="h-full" contentClassName="p-4 sm:p-5">
              <div className="mb-2 flex items-center gap-2">
                <stat.icon className={cn("h-4 w-4", stat.tone)} aria-hidden />
                <span className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
                  {stat.label}
                </span>
              </div>
              <p className="text-lg font-medium text-text-heading">{stat.value}</p>
            </GlassPanel>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <PremiumControlCard
            icon={FileText}
            title="Request activation"
            description={`We send your message to support with the title "${REQUEST_SUBJECT}".`}
            badge={ready ? statusBadge : undefined}
          >
            {!ready ? (
              <FormSkeleton />
            ) : pending ? (
              <PendingActivationPanel
                email={pending.email}
                viaMailto={viaMailto}
                onReset={handleReset}
              />
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="min-w-0">
                  <label htmlFor="license-rights-email" className={labelClass}>
                    Your email
                  </label>
                  <input
                    id="license-rights-email"
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
                  <label htmlFor="license-rights-message" className={labelClass}>
                    Your message
                  </label>
                  <textarea
                    id="license-rights-message"
                    name="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    disabled={formState === "submitting"}
                    rows={6}
                    className={`${fieldClass} min-h-[148px] resize-y`}
                  />
                </div>

                {formState === "error" && errorMessage ? (
                  <PremiumErrorAlert message={errorMessage} />
                ) : null}

                <div className="rounded-xl border border-[var(--mcv-line-brass)] bg-brass-100/70 px-4 py-3">
                  <p className="text-xs leading-relaxed text-text-secondary">
                    <span className="font-medium text-text-primary">What happens next:</span> Support
                    receives your ticket, verifies your purchase, and replies when the reseller
                    license is ready. Check spam if you don&apos;t hear back within 48 hours.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={formState === "submitting"}
                  className="btn-primary min-h-[46px] w-full"
                >
                  {formState === "submitting" ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center gap-2">
                      <Send className="h-4 w-4" />
                      Send License Rights request
                    </span>
                  )}
                </button>

                <div className="dashboard-nested-card flex gap-3 px-3 py-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-text-secondary" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs leading-snug text-text-secondary">
                      Form not working? Copy our support email:
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void handleCopyEmail()}
                        className="break-all text-left text-sm font-medium text-brass-700 hover:underline"
                      >
                        {SUPPORT_EMAIL}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleCopyEmail()}
                        className="inline-flex items-center gap-1 rounded-md border border-border-dim bg-page px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-text-secondary transition-colors hover:border-brass-700 hover:text-brass-700"
                      >
                        {copiedEmail ? (
                          <>
                            <Check size={12} aria-hidden />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy size={12} aria-hidden />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </PremiumControlCard>
        </div>

        <div className="xl:col-span-5">
          <section className="glass-card h-full p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--mcv-line-brass)] bg-brass-100 text-brass-700">
                <Lock size={18} aria-hidden />
              </div>
              <div>
                <h2 className="text-lg font-medium text-text-primary">What you unlock</h2>
                <p className="text-sm text-text-secondary">
                  {EDITION_CONTENTS.length} deliverables included after activation
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {EDITION_CONTENTS.map((item, index) => (
                <EditionContentCard key={item.id} item={item} index={index} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </PremiumPageLayout>
  );
}
