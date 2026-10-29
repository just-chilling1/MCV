"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Loader2, Save } from "lucide-react";
import { ContentReservePicker } from "@/features/blog-builder/components/ContentReservePicker";
import type { ArmedLink } from "@/features/blog-builder/types";
import {
  detectLinkNetwork,
  isValidAffiliateUrl,
  normalizeAffiliateUrl,
} from "@/features/blog-builder/lib/affiliate-url";
import { invalidateClientFetchCache } from "@/lib/client-fetch-cache";

interface AffiliateLinkFieldProps {
  value: string;
  onChange: (url: string) => void;
  inputId?: string;
  placeholder?: string;
}

function validVaultLinks(links: ArmedLink[]): ArmedLink[] {
  return links.filter((link) => isValidAffiliateUrl(link.url));
}

export function AffiliateLinkField({
  value,
  onChange,
  inputId = "affiliate-link",
  placeholder = "https://...",
}: AffiliateLinkFieldProps) {
  const [vaultLinks, setVaultLinks] = useState<ArmedLink[]>([]);
  const [loadingVault, setLoadingVault] = useState(true);
  const [selectedVaultUrl, setSelectedVaultUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  const loadVault = useCallback(async () => {
    setLoadingVault(true);
    try {
      const res = await fetch("/api/blog/link-vault", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { links?: ArmedLink[] };
      setVaultLinks(validVaultLinks(data.links ?? []));
    } catch {
      /* ignore */
    } finally {
      setLoadingVault(false);
    }
  }, []);

  useEffect(() => {
    void loadVault();
  }, [loadVault]);

  useEffect(() => {
    if (vaultLinks.length === 0) {
      setSelectedVaultUrl(null);
      return;
    }

    const normalizedValue = normalizeAffiliateUrl(value);
    if (!normalizedValue) {
      setSelectedVaultUrl(null);
      return;
    }

    const match = vaultLinks.find(
      (link) => normalizeAffiliateUrl(link.url) === normalizedValue
    );
    setSelectedVaultUrl(match?.url ?? null);
  }, [value, vaultLinks]);

  const handleSelectFromVault = (link: ArmedLink | null) => {
    if (!link) {
      setSelectedVaultUrl(null);
      onChange("");
      setSaved(false);
      setSaveError("");
      return;
    }

    setSelectedVaultUrl(link.url);
    onChange(link.url);
    setSaved(true);
    setSaveError("");
  };

  const handleInputChange = (nextUrl: string) => {
    onChange(nextUrl);
    setSaved(false);
    setSaveError("");

    if (!selectedVaultUrl) return;
    const vaultLink = vaultLinks.find((link) => link.url === selectedVaultUrl);
    if (
      vaultLink &&
      normalizeAffiliateUrl(nextUrl) !== normalizeAffiliateUrl(vaultLink.url)
    ) {
      setSelectedVaultUrl(null);
    }
  };

  const handleSaveToVault = async () => {
    const url = normalizeAffiliateUrl(value);
    if (!isValidAffiliateUrl(url)) {
      setSaveError("Enter a valid URL starting with https://");
      return;
    }

    setSaving(true);
    setSaveError("");

    const newLink: ArmedLink = {
      label: "Promotional Offer",
      url,
      network: detectLinkNetwork(url),
    };
    const nextLinks = [
      newLink,
      ...vaultLinks.filter(
        (link) => normalizeAffiliateUrl(link.url) !== url
      ),
    ];

    try {
      const res = await fetch("/api/blog/link-vault", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ links: nextLinks }),
      });
      if (!res.ok) throw new Error("Save failed");

      setVaultLinks(nextLinks);
      setSelectedVaultUrl(url);
      setSaved(true);
      invalidateClientFetchCache("/api/blog/link-vault");
    } catch {
      setSaveError("Could not save to Links Library. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const normalizedValue = normalizeAffiliateUrl(value);
  const isInVault = vaultLinks.some(
    (link) => normalizeAffiliateUrl(link.url) === normalizedValue
  );
  const canSave = isValidAffiliateUrl(value) && !isInVault && !saving;

  return (
    <div className="space-y-3">
      {loadingVault ? (
        <p className="flex items-center gap-2 text-xs text-text-muted">
          <Loader2 size={12} className="animate-spin" />
          Loading saved links…
        </p>
      ) : vaultLinks.length > 0 ? (
        <ContentReservePicker
          links={vaultLinks}
          selectedUrl={selectedVaultUrl}
          onSelect={handleSelectFromVault}
          roundedClassName="!rounded-3xl"
        />
      ) : (
        <p className="text-xs text-text-muted">
          No saved links yet. Paste a link below or{" "}
          <Link href="/link-vault" className="auth-link">
            open Links Library
          </Link>
          .
        </p>
      )}

      <label className="block" htmlFor={inputId}>
        <span className="sr-only">Affiliate link URL</span>
        <input
          id={inputId}
          type="url"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={placeholder}
          className="input-base w-full !rounded-3xl"
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void handleSaveToVault()}
          disabled={!canSave}
          className="btn-secondary inline-flex items-center gap-2 border-[var(--mcv-line-brass)] bg-brass-100 text-sm font-medium text-success shadow-sm hover:bg-brass-200 disabled:opacity-40"
        >
          {saving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : saved && isInVault ? (
            <Check size={14} />
          ) : (
            <Save size={14} />
          )}
          {saved && isInVault ? "Saved to Links Library" : "Save to Links Library"}
        </button>
        {vaultLinks.length > 0 && (
          <Link
            href="/link-vault"
            className="btn-secondary inline-flex items-center gap-2 border-[var(--mcv-line-brass)] text-sm font-medium text-text-primary shadow-sm hover:bg-field"
          >
            Manage saved links
          </Link>
        )}
      </div>

      {saveError && <p className="text-xs text-error">{saveError}</p>}
    </div>
  );
}
