"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, Pencil, Save, Loader2, ImageUp, ImageOff } from "lucide-react";
import type { BlogPost } from "../types";
import { RichTextEditor } from "./RichTextEditor";
import { uploadBlogImage } from "../lib/upload-client";
import { sanitizePostHtml } from "../lib/sanitize-html";

interface PostPreviewModalProps {
  postId: string | null;
  onClose: () => void;
  onSaved?: (post: BlogPost) => void;
}

export function PostPreviewModal({ postId, onClose, onSaved }: PostPreviewModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [uploadingHero, setUploadingHero] = useState(false);
  const heroInputRef = useRef<HTMLInputElement | null>(null);
  const [draft, setDraft] = useState({
    title: "",
    excerpt: "",
    meta_description: "",
    html: "",
    image_url: "",
    image_alt: "",
  });

  const loadPost = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/blog/posts/${id}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load post");
      const loaded = data.post as BlogPost;
      setPost(loaded);
      setDraft({
        title: loaded.title,
        excerpt: loaded.excerpt ?? "",
        meta_description: loaded.meta_description ?? "",
        html: loaded.html,
        image_url: loaded.image_url ?? "",
        image_alt: loaded.image_alt ?? "",
      });
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setPost(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (postId) void loadPost(postId);
    else {
      setPost(null);
      setError(null);
      setEditing(false);
    }
  }, [postId, loadPost]);

  useEffect(() => {
    if (!postId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.classList.add("article-preview-open");
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("article-preview-open");
      document.body.style.overflow = "";
    };
  }, [postId, onClose]);

  const save = async () => {
    if (!postId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/blog/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title,
          excerpt: draft.excerpt || null,
          meta_description: draft.meta_description || null,
          html: draft.html,
          image_url: draft.image_url || null,
          image_alt: draft.image_alt || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      const updated = data.post as BlogPost;
      setPost(updated);
      setEditing(false);
      onSaved?.(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleHeroSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingHero(true);
    setError(null);
    try {
      const url = await uploadBlogImage(file);
      setDraft((d) => ({
        ...d,
        image_url: url,
        image_alt: d.image_alt || file.name.replace(/\.[^.]+$/, ""),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingHero(false);
    }
  };

  return (
    <AnimatePresence>
      {postId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="post-preview-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            aria-label="Close preview"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            className="relative z-10 flex h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom))] min-h-0 w-full max-w-full flex-col overflow-hidden rounded-t-2xl border border-[var(--mcv-line-brass)] glass-surface shadow-2xl sm:h-auto sm:max-h-[88vh] sm:max-w-3xl sm:rounded-2xl"
          >
            <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-border-dim glass-tile rounded-none">
              <div className="flex items-center gap-2 min-w-0">
                <Eye size={18} className="text-brass-700 shrink-0" />
                <p
                  id="post-preview-title"
                  className="text-sm font-medium text-text-heading truncate"
                >
                  {editing ? "Edit article" : "Article preview"}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!loading && post && !editing && (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium text-brass-900 bg-grad-brass hover:opacity-90"
                  >
                    <Pencil size={14} />
                    Edit
                  </button>
                )}
                {editing && (
                  <button
                    type="button"
                    onClick={save}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium text-text-on-accent bg-grad-brass hover:opacity-90 disabled:opacity-60"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Save
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-text-muted hover:text-text-heading hover:bg-black/5"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain p-4 sm:p-5">
              {loading && (
                <p className="py-8 text-center text-sm text-text-muted animate-pulse">Loading from server...</p>
              )}

              {error && (
                <p className="mb-4 rounded-lg border border-[var(--mcv-danger)]/30 bg-[var(--mcv-danger)]/10 p-3 text-sm text-[var(--mcv-danger)]/90">
                  {error}
                </p>
              )}

              {!loading && post && !editing && (
                <div className="flex min-w-0 max-w-full flex-col gap-4">
                  {post.image_url && (
                    <div className="overflow-hidden rounded-xl border border-border-dim">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={post.image_url}
                        alt={post.image_alt || post.title}
                        className="block aspect-[16/9] w-full max-w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="mb-1 text-[13px] uppercase tracking-widest text-brass-700">Title</p>
                    <h2 className="brand-font text-lg leading-snug text-text-heading sm:text-xl">{post.title}</h2>
                  </div>
                  {post.excerpt && (
                    <div className="min-w-0">
                      <p className="mb-1 text-[13px] uppercase tracking-widest text-text-muted">Excerpt</p>
                      <p className="text-sm leading-relaxed text-text-secondary">{post.excerpt}</p>
                    </div>
                  )}
                  {post.meta_description && (
                    <div className="min-w-0">
                      <p className="mb-1 text-[13px] uppercase tracking-widest text-text-muted">Meta description</p>
                      <p className="text-xs leading-relaxed text-text-muted">{post.meta_description}</p>
                    </div>
                  )}
                  <div className="min-w-0 max-w-full">
                    <p className="mb-2 text-[13px] uppercase tracking-widest text-text-muted">Content</p>
                    <div
                      className="sms-post-preview glass-tile min-w-0 max-w-full overflow-x-auto p-3 sm:p-5"
                      dangerouslySetInnerHTML={{ __html: sanitizePostHtml(post.html) }}
                    />
                  </div>
                </div>
              )}

              {!loading && post && editing && (
                <div className="flex min-w-0 max-w-full flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[13px] uppercase tracking-widest text-brass-700">Featured image</span>
                    <input
                      ref={heroInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                      className="hidden"
                      onChange={handleHeroSelected}
                    />
                    <div className="relative overflow-hidden rounded-xl border border-border-dim glass-tile">
                      {draft.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={draft.image_url}
                          alt={draft.image_alt || draft.title}
                          className="block w-full aspect-[16/9] object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1 aspect-[16/9] text-text-muted">
                          <ImageOff size={22} />
                          <span className="text-xs">No featured image</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => heroInputRef.current?.click()}
                        disabled={uploadingHero}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium text-brass-900 bg-grad-brass hover:opacity-90 disabled:opacity-60"
                      >
                        {uploadingHero ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <ImageUp size={14} />
                        )}
                        {draft.image_url ? "Replace image" : "Upload image"}
                      </button>
                      {draft.image_url && (
                        <button
                          type="button"
                          onClick={() => setDraft((d) => ({ ...d, image_url: "" }))}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium text-text-muted hover:text-text-heading hover:bg-black/5"
                        >
                          <ImageOff size={14} />
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[13px] uppercase tracking-widest text-brass-700">Title</span>
                    <input
                      value={draft.title}
                      onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                      className="input-base w-full"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[13px] uppercase tracking-widest text-text-muted">Excerpt</span>
                    <textarea
                      value={draft.excerpt}
                      onChange={(e) => setDraft((d) => ({ ...d, excerpt: e.target.value }))}
                      rows={2}
                      className="input-base w-full resize-none"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[13px] uppercase tracking-widest text-text-muted">Meta description</span>
                    <textarea
                      value={draft.meta_description}
                      onChange={(e) => setDraft((d) => ({ ...d, meta_description: e.target.value }))}
                      rows={2}
                      className="input-base w-full resize-none"
                    />
                  </label>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[13px] uppercase tracking-widest text-text-muted">Content</span>
                    <RichTextEditor
                      value={draft.html}
                      onChange={(html) => setDraft((d) => ({ ...d, html }))}
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
