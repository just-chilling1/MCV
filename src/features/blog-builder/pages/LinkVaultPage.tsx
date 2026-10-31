"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ExternalLink,
  Globe,
  Link2,
  Pencil,
  Plus,
  Tag,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { PageLoading } from "@/components/ui/page-loading";
import { ErrorBanner } from "@/components/ui/error-banner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LinkEditorOverlay } from "../components/LinkEditorOverlay";
import { useBlogBuilder } from "../context/BlogBuilderContext";
import type { ArmedLink, BlogSite } from "../types";
import type { SiteVaultSummary } from "@/app/api/blog/site/route";
import { normalizeAffiliateUrl } from "../lib/affiliate-url";
import { cachedClientFetch } from "@/lib/client-fetch-cache";

const NETWORK_LABELS: Record<ArmedLink["network"], string | null> = {
  digistore: "Digistore24",
  amazon: "Amazon",
  other: null,
};

interface LinkedOffer {
  id: string;
  title: string;
  status: BlogSite["status"];
}

export default function LinkVaultPage() {
  const { sessionLoaded, armedLinks, saveLinksToVault } = useBlogBuilder();
  const [sites, setSites] = useState<BlogSite[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<ArmedLink | null>(null);
  const [deletingLink, setDeletingLink] = useState<ArmedLink | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void cachedClientFetch<{ summaries?: SiteVaultSummary[] }>("/api/blog/site?lite=1")
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data.summaries) ? data.summaries : [];
        setSites(list.map((s) => s.site));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  /** Map of normalized link URL -> offers whose sales page uses that link. */
  const linkedOffersByUrl = useMemo(() => {
    const map = new Map<string, LinkedOffer[]>();
    for (const site of sites) {
      for (const armed of site.armed_links ?? []) {
        const key = normalizeAffiliateUrl(armed.url);
        if (!key) continue;
        const existing = map.get(key) ?? [];
        if (!existing.some((o) => o.id === site.id)) {
          existing.push({ id: site.id, title: site.title, status: site.status });
        }
        map.set(key, existing);
      }
    }
    return map;
  }, [sites]);

  const openCreate = () => {
    setEditingLink(null);
    setEditorOpen(true);
    setError(null);
  };

  const openEdit = (link: ArmedLink) => {
    setEditingLink(link);
    setEditorOpen(true);
    setError(null);
  };

  const handleSave = async (link: ArmedLink) => {
    if (!editingLink) {
      // New links go on top; drop any existing entry with the same URL.
      const rest = armedLinks.filter((l) => normalizeAffiliateUrl(l.url) !== link.url);
      await saveLinksToVault([link, ...rest]);
      return;
    }

    // Replace the edited entry in place; drop duplicates of the new URL.
    const editedUrl = normalizeAffiliateUrl(editingLink.url);
    let replaced = false;
    const next: ArmedLink[] = [];
    for (const l of armedLinks) {
      const url = normalizeAffiliateUrl(l.url);
      if (url === editedUrl) {
        if (!replaced) {
          next.push(link);
          replaced = true;
        }
      } else if (url !== link.url) {
        next.push(l);
      }
    }
    if (!replaced) next.unshift(link);
    await saveLinksToVault(next);
  };

  const handleDelete = async () => {
    if (!deletingLink) return;
    const target = normalizeAffiliateUrl(deletingLink.url);
    setDeleteLoading(true);
    setError(null);
    try {
      await saveLinksToVault(armedLinks.filter((l) => normalizeAffiliateUrl(l.url) !== target));
      setDeletingLink(null);
    } catch {
      setError("Could not delete the link. Try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!sessionLoaded) {
    return <PageLoading message="Loading Links Library..." />;
  }

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Links library"
        title="Saved promotion links"
        subtitle="Your affiliate and promo links in one place. Create, edit, and see which offers use each link."
        actions={
          <button type="button" onClick={openCreate} className="btn-primary text-sm">
            <Plus size={16} />
            Create New Link
          </button>
        }
      />

      {error && <ErrorBanner message={error} />}

      {armedLinks.length === 0 ? (
        <div className="empty-state-panel">
          <div className="empty-state-icon">
            <Link2 size={28} strokeWidth={1.5} aria-hidden />
          </div>
          <h2 className="ds-h4 text-text-heading">No links saved yet</h2>
          <p className="empty-state-copy">
            Save your first promotional link here — it becomes available everywhere you promote,
            including the Sales Offer Generator.
          </p>
          <button type="button" onClick={openCreate} className="btn-primary mt-2">
            <Plus size={16} />
            Create Your First Link
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {armedLinks.map((link, index) => {
            const networkLabel = NETWORK_LABELS[link.network];
            const linkedOffers = linkedOffersByUrl.get(normalizeAffiliateUrl(link.url)) ?? [];
            return (
              <div key={`${link.url}-${index}`} className="card-base space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--mcv-line-brass)] bg-brass-100 text-brass-700">
                      <Link2 size={16} />
                    </div>
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <p className="truncate font-medium text-text-primary">
                        {link.label || "Untitled Link"}
                      </p>
                      {networkLabel && (
                        <span className="shrink-0 rounded-full border border-[var(--mcv-line-brass)] bg-brass-100 px-2 py-0.5 text-[11px] font-medium text-brass-700">
                          {networkLabel}
                        </span>
                      )}
                      {link.tag && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border-dim bg-field px-2 py-0.5 text-[11px] font-medium text-text-secondary">
                          <Tag size={10} />
                          {link.tag}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEdit(link)}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-brass-100 hover:text-brass-700"
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingLink(link)}
                      aria-label={`Delete ${link.label || "link"}`}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-text-muted transition-colors hover:bg-[var(--mcv-danger)]/10 hover:text-[var(--mcv-danger)]"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>

                {link.description && (
                  <p className="text-sm leading-relaxed text-text-secondary">{link.description}</p>
                )}

                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-fit max-w-full items-center gap-1.5 text-xs text-text-muted transition-colors hover:text-brass-700"
                >
                  <span className="truncate">{link.url}</span>
                  <ExternalLink size={12} className="shrink-0" />
                </a>

                <div className="flex flex-wrap items-center gap-2 border-t border-border-dim/60 pt-3">
                  {linkedOffers.length > 0 ? (
                    <>
                      <span className="text-xs font-medium text-text-secondary">Used in:</span>
                      {linkedOffers.map((offer) => (
                        <span
                          key={offer.id}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border-dim bg-field px-2.5 py-1 text-xs text-text-primary"
                        >
                          <Globe size={11} className="text-brass-700" />
                          {offer.title}
                          {offer.status === "live" && (
                            <span className="h-1.5 w-1.5 rounded-full bg-success" aria-label="Live" />
                          )}
                        </span>
                      ))}
                    </>
                  ) : (
                    <span className="text-xs text-text-muted">
                      Not used in any offer yet — pick it in the Sales Offer Generator.
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <LinkEditorOverlay
        open={editorOpen}
        initial={editingLink}
        onSave={handleSave}
        onClose={() => setEditorOpen(false)}
      />

      <ConfirmDialog
        open={deletingLink !== null}
        title="Delete this link?"
        description={`"${deletingLink?.label || "This link"}" will be removed from your Links Library. Offers already using it keep working.`}
        confirmLabel="Delete Link"
        destructive
        loading={deleteLoading}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeletingLink(null)}
      />
    </div>
  );
}
