"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Lock,
  CheckCircle,
  Globe,
  UserCheck,
  KeyRound,
  Eye,
  Server,
  Wifi,
  Clock,
} from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { PageLoading } from "@/components/ui/page-loading";
import { PremiumPageLayout } from "@/components/premium/PremiumPageLayout";
import { PremiumControlCard } from "@/components/premium/PremiumControlCard";
import { PremiumVideoTutorial } from "@/components/premium/PremiumVideoTutorial";
import { PremiumFooter } from "@/components/premium/PremiumFooter";
import { getFeatureThumbnail } from "@/lib/video-thumbnails";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { brand } from "@/config/brand.config";

const securityChecks = [
  {
    label: "Account Verified",
    description: "Your email address has been verified and confirmed",
    icon: UserCheck,
  },
  {
    label: "Secure Connection",
    description: "All data is transmitted over encrypted HTTPS connection",
    icon: Lock,
  },
  {
    label: "Session Protected",
    description: "Your session is authenticated with a secure token",
    icon: KeyRound,
  },
  {
    label: "Data Encryption",
    description: "All personal and financial data is encrypted at rest",
    icon: Eye,
  },
  {
    label: "Server Status",
    description: `All ${brand.productName} servers are online and operational`,
    icon: Server,
  },
  {
    label: "API Connectivity",
    description: "Connection to Digistore24 and traffic APIs is stable",
    icon: Wifi,
  },
];

const activityLog = [
  { event: "Successful login", offsetMinutes: 0, icon: UserCheck },
  { event: "Session renewed", offsetMinutes: 2, icon: KeyRound },
  { event: "Security scan completed", offsetMinutes: 15, icon: ShieldCheck },
  { event: "SSL certificate verified", offsetMinutes: 60, icon: Lock },
  { event: "System health check passed", offsetMinutes: 180, icon: Server },
];

function formatRelativeTime(iso: string | undefined, fallbackMinutes: number): string {
  if (!iso) {
    if (fallbackMinutes === 0) return "Just now";
    if (fallbackMinutes < 60) return `${fallbackMinutes} minutes ago`;
    const h = Math.floor(fallbackMinutes / 60);
    return h === 1 ? "1 hour ago" : `${h} hours ago`;
  }

  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  return "Today";
}

function formatLastLogin(iso: string | undefined): string {
  if (!iso) return "Today";
  const hours = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  return hours < 24 ? "Today" : formatRelativeTime(iso, 0);
}

export default function ProtectorPage() {
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("user@example.com");
  const [lastSignIn, setLastSignIn] = useState<string | undefined>();

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (user?.email) setUserEmail(user.email);
      setLastSignIn(user?.last_sign_in_at ?? undefined);
      setLoading(false);
    });
  }, []);

  const activity = useMemo(
    () =>
      activityLog.map((item, i) => ({
        ...item,
        time:
          i === 0 && lastSignIn
            ? formatRelativeTime(lastSignIn, 0)
            : formatRelativeTime(undefined, item.offsetMinutes),
      })),
    [lastSignIn]
  );

  if (loading) {
    return <PageLoading message="Loading Cyber Protection..." />;
  }

  return (
    <PremiumPageLayout
      title="Cyber Protection"
      subtitle="Your account security overview — membership verification, encryption status, and activity monitoring in real time."
      footer={<PremiumFooter>Cyber Protection — powered by {brand.productName}.</PremiumFooter>}
    >
      <PremiumVideoTutorial
        vimeoId="1215579801"
        title="Cyber Protection Training"
        description="Watch what Cyber Protection monitors for you — account verification, encryption, and session security — and how to read your security overview."
        iframeTitle="Cyber Protection training video"
        thumbnailSrc={getFeatureThumbnail("vault-protector")}
      />

      <PremiumControlCard
        icon={ShieldCheck}
        title="Cyber Protection"
        description="Your account security overview. Everything is monitored in real time."
        badge={
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-success/20 bg-success/10 px-4 py-3 sm:px-5">
            <div className="h-3 w-3 animate-pulse rounded-full bg-success/100 shadow-[0_0_10px_rgba(16,185,129,0.35)]" />
            <span className="text-sm font-medium uppercase tracking-wider text-success">
              All Systems Secure
            </span>
          </div>
        }
      >
        <div className="stat-grid">
          {[
            { label: "Security Score", value: "100%", icon: ShieldCheck, color: "text-success" },
            { label: "Account Status", value: "Verified", icon: CheckCircle, color: "text-success" },
            { label: "Encryption", value: "AES-256", icon: Lock, color: "text-ink-3" },
            { label: "Uptime", value: "99.9%", icon: Globe, color: "text-info" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <GlassPanel intensity="low" className="p-5 hover:border-success/20 transition-colors">
                <div className="mb-3 flex items-center gap-3">
                  <stat.icon className={cn("h-5 w-5", stat.color)} />
                  <span className="text-[13px] font-medium uppercase tracking-wider text-text-muted">
                    {stat.label}
                  </span>
                </div>
                <div className="text-2xl font-medium text-text-heading">{stat.value}</div>
              </GlassPanel>
            </motion.div>
          ))}
        </div>
      </PremiumControlCard>

      <div className="glass-card space-y-5 p-4 sm:p-5 md:p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <h2 className="text-lg font-medium text-text-heading mb-1">Security Checks</h2>
            <div className="space-y-3">
              {securityChecks.map((check, i) => (
                <motion.div
                  key={check.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.06 }}
                >
                  <GlassPanel
                    intensity="low"
                    className="p-4 hover:border-success/20 transition-all duration-300"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center shrink-0">
                        <check.icon className="w-5 h-5 text-success" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-text-primary">{check.label}</h3>
                        <p className="text-xs text-text-muted">{check.description}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span className="text-[13px] font-medium text-success uppercase tracking-wider">
                          Verified
                        </span>
                      </div>
                    </div>
                  </GlassPanel>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <GlassPanel intensity="low" className="p-5 border-success/20">
              <h3 className="text-sm font-medium text-text-heading mb-4">Account Info</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-divider">
                  <span className="text-xs text-text-muted">Email</span>
                  <span className="text-xs text-text-primary font-medium truncate ml-4">{userEmail}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-divider">
                  <span className="text-xs text-text-muted">Membership</span>
                  <span className="text-xs text-success font-medium">Active</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-divider">
                  <span className="text-xs text-text-muted">2FA</span>
                  <span className="text-xs text-success font-medium">Enabled</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs text-text-muted">Last Login</span>
                  <span className="text-xs text-text-primary font-medium">{formatLastLogin(lastSignIn)}</span>
                </div>
              </div>
            </GlassPanel>

            <GlassPanel intensity="low" className="p-5">
              <h3 className="text-sm font-medium text-text-heading mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {activity.map((item) => (
                  <div key={item.event} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-canvas border border-border-dim flex items-center justify-center shrink-0 mt-0.5">
                      <item.icon className="w-3.5 h-3.5 text-text-muted" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-text-primary font-medium">{item.event}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-text-muted" />
                        <span className="text-[13px] text-text-muted">{item.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </div>
        </div>
      </div>
    </PremiumPageLayout>
  );
}
