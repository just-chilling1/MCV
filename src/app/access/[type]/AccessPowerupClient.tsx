"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Mail, Sparkles } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import PageHeader from "@/components/ui/page-header";
import { useAppStore } from "@/store";
import { UPSELL_CONFIGS, type UpsellType } from "@/types";

const unlockButtonLabel: Record<UpsellType, string> = {
  "10x": "Unlock Social Payouts",
  infinite: "Unlock Unlimited",
  automation: "Unlock Automated Profits",
  protector: "Unlock Vault Protector",
};

const afterUnlockHref: Record<UpsellType, string> = {
  "10x": "/social-payouts",
  infinite: "/infinite",
  automation: "/autopilot",
  protector: "/protector",
};

interface Props {
  powerup: UpsellType;
  token: string;
  initialEmail: string;
  alreadyGranted: boolean;
}

export default function AccessPowerupClient({ powerup, token, initialEmail, alreadyGranted }: Props) {
  const router = useRouter();
  const setUnlockedUpsells = useAppStore((s) => s.setUnlockedUpsells);
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const config = UPSELL_CONFIGS[powerup];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!token) {
      setError("This page needs the access token from your invite link (?t=…).");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/powerups/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, powerup, email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Registration failed");
        setLoading(false);
        return;
      }
      if (Array.isArray(data.powerups)) {
        setUnlockedUpsells(data.powerups);
      }
      setDone(true);
      setTimeout(() => router.push(afterUnlockHref[powerup]), 1600);
    } catch {
      setError("Something went wrong. Try again.");
    }
    setLoading(false);
  };

  if (!token) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <h1 className="ds-h2 mb-3">Invalid access link</h1>
        <p className="text-sm leading-relaxed text-text-muted">
          Open the full link from your upgrade email. It should look like{" "}
          <code className="text-brass-700">/access/{powerup}?t=…</code>.
        </p>
      </div>
    );
  }

  if (alreadyGranted && !done) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="mb-4 font-medium text-text-heading">You already have this power-up.</p>
        <Button type="button" onClick={() => router.push(afterUnlockHref[powerup])}>
          Go to {config.name}
        </Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-center">
        <div>
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-[var(--mcv-line-brass)] bg-brass-100">
            <Check size={40} className="text-brass-700" />
          </div>
          <h1 className="ds-h2 mb-2">{config.name} unlocked</h1>
          <p className="text-text-muted">Taking you there now.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow="Power-up access" title={config.headline} subtitle={config.description} />

      <Card hover={false} className="mb-8">
        <h2 className="ds-h3 mb-6">What you get</h2>
        <div className="space-y-4">
          {config.features.map((feature) => (
            <div key={feature} className="flex items-center gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brass-100 text-brass-700">
                <Check size={14} />
              </div>
              <span className="text-text-heading">{feature}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card hover={false} className="border border-[var(--mcv-line-brass)]">
        <div className="mb-6 flex items-center gap-2">
          <Sparkles size={20} className="text-brass-700" />
          <h2 className="ds-h3">Unlock {config.name}</h2>
        </div>

        {error ? (
          <p className="mb-4 rounded-xl border border-[var(--mcv-danger)]/30 bg-[var(--mcv-danger)]/10 p-3 text-sm text-[var(--mcv-danger)]" role="alert">
            {error}
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Confirm your email to unlock"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail size={18} />}
            required
          />

          <Button type="submit" loading={loading} className="w-full" size="lg">
            {unlockButtonLabel[powerup]}
            <ArrowRight size={18} />
          </Button>

          <p className="text-center text-xs text-text-muted">
            By unlocking, you agree to receive updates about this feature.
          </p>
        </form>
      </Card>
    </div>
  );
}
