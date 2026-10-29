"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { dashboardContent } from "@/config/dashboard.config";
import { getCachedClientUser } from "@/lib/auth-client-cache";
import { getDashboardSubtitle } from "@/lib/dashboard-content";
import { DashboardTipsWidget } from "@/components/dashboard/DashboardTipsWidget";
import { RouteLoading } from "@/components/ui/route-loading";

const DashboardVideoTrack = dynamic(
  () =>
    import("@/components/dashboard/DashboardVideoTrack").then((m) => ({
      default: m.DashboardVideoTrack,
    })),
  { loading: () => <RouteLoading /> }
);

const ContactSupportWidget = dynamic(
  () =>
    import("@/components/dashboard/ContactSupportWidget").then((m) => ({
      default: m.ContactSupportWidget,
    })),
  { loading: () => <div className="dashboard-container min-h-[12rem] animate-pulse" aria-hidden /> }
);

const PremiumUpgradesWidget = dynamic(
  () =>
    import("@/components/dashboard/PremiumUpgradesWidget").then((m) => ({
      default: m.PremiumUpgradesWidget,
    })),
  { loading: () => <div className="premium-upgrades-panel min-h-[10rem] animate-pulse" aria-hidden /> }
);

export default function DashboardPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");

  useEffect(() => {
    const hash = window.location.hash;
    if (
      hash &&
      hash.includes("error=") &&
      (hash.includes("otp_expired") || hash.includes("access_denied") || hash.includes("recovery"))
    ) {
      const hashParams = new URLSearchParams(hash.substring(1));
      const errorDesc =
        hashParams.get("error_description") || "This password reset link has expired or is invalid.";
      router.replace(`/reset-password?error=${encodeURIComponent(errorDesc.replace(/\+/g, " "))}`);
    }
  }, [router]);

  useEffect(() => {
    void getCachedClientUser().then((user) => {
      if (!user) return;
      const metaName = user.user_metadata?.full_name as string | undefined;
      if (metaName) {
        setFirstName(metaName.split(" ")[0] ?? "");
        return;
      }
      const emailPrefix = user.email?.split("@")[0];
      if (emailPrefix) setFirstName(emailPrefix);
    });
  }, []);

  const welcomeTitle = firstName
    ? `${dashboardContent.title}, ${firstName}`
    : dashboardContent.title;
  const welcomeSubtitle = getDashboardSubtitle();

  return (
    <div className="page-container mx-auto w-full max-w-7xl">
      <header className="flex min-w-0 flex-col gap-2 pt-1">
        {dashboardContent.eyebrow ? <span className="page-eyebrow">{dashboardContent.eyebrow}</span> : null}
        <h1 className="ds-h1">{welcomeTitle}</h1>
        <p className="ds-subtitle max-w-3xl" suppressHydrationWarning>
          {welcomeSubtitle}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:gap-10 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 flex flex-col gap-8 lg:gap-10">
          <DashboardVideoTrack />
        </div>

        <aside className="flex min-w-0 flex-col gap-8 xl:sticky xl:top-8 xl:self-start">
          <ContactSupportWidget />
          <DashboardTipsWidget />
          <PremiumUpgradesWidget variant="sidebar" />
        </aside>
      </div>
    </div>
  );
}
