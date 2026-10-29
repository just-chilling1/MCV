"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Heading,
  List,
  Link2,
  Code2,
  Eye,
  ImagePlus,
  Loader2,
} from "lucide-react";
import { uploadBlogImage } from "../lib/upload-client";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
}

type ToolbarAction = {
  icon: typeof Bold;
  label: string;
  run: () => void;
};

/**
 * Visual-first article editor. Users edit the rendered content directly
 * instead of raw HTML, can insert new images, and can replace any existing
 * image by clicking it. Uploads are stored server-side (Supabase Storage);
 * the resulting URLs live in the HTML which is persisted on Save.
 */
export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const replaceTargetRef = useRef<HTMLImageElement | null>(null);
  const [mode, setMode] = useState<"visual" | "html">("visual");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Seed the editable region once when entering visual mode. We deliberately
  // keep it uncontrolled afterwards so typing never resets the caret position.
  useEffect(() => {
    if (mode !== "visual") return;
    const el = editorRef.current;
    if (el && el.innerHTML !== value) {
      el.innerHTML = value;
    }
  }, [mode, value]);

  const emit = useCallback(() => {
    const el = editorRef.current;
    if (el) onChange(el.innerHTML);
  }, [onChange]);

  const exec = (command: string, arg?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    emit();
  };

  const toggleHeading = () => {
    const sel = window.getSelection();
    const node = sel?.anchorNode as HTMLElement | null;
    const inHeading = node ? !!(node.parentElement ?? node).closest?.("h2") : false;
    exec("formatBlock", inHeading ? "p" : "h2");
  };

  const addLink = () => {
    const url = window.prompt("Link URL", "https://");
    if (url) exec("createLink", url);
  };

  const insertImage = () => {
    replaceTargetRef.current = null;
    setError(null);
    editorRef.current?.focus();
    fileInputRef.current?.click();
  };

  // Clicking any image in the editor replaces just that image.
  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "IMG") {
      e.preventDefault();
      replaceTargetRef.current = target as HTMLImageElement;
      setError(null);
      fileInputRef.current?.click();
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const url = await uploadBlogImage(file);
      const target = replaceTargetRef.current;

      if (target) {
        target.src = url;
        target.removeAttribute("srcset");
      } else {
        const safeAlt = file.name.replace(/\.[^.]+$/, "").replace(/"/g, "&quot;");
        const figure = `<figure class="sms-inline-figure"><img src="${url}" alt="${safeAlt}" loading="lazy" /></figure><p></p>`;
        editorRef.current?.focus();
        document.execCommand("insertHTML", false, figure);
      }
      emit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      replaceTargetRef.current = null;
      setUploading(false);
    }
  };

  const actions: ToolbarAction[] = [
    { icon: Bold, label: "Bold", run: () => exec("bold") },
    { icon: Italic, label: "Italic", run: () => exec("italic") },
    { icon: Heading, label: "Heading", run: toggleHeading },
    { icon: List, label: "Bullet list", run: () => exec("insertUnorderedList") },
    { icon: Link2, label: "Link", run: addLink },
  ];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1 flex-wrap rounded-lg border border-border-dim glass-tile p-1.5">
        {mode === "visual" && (
          <>
            {actions.map(({ icon: Icon, label, run }) => (
              <button
                key={label}
                type="button"
                title={label}
                aria-label={label}
                onMouseDown={(e) => e.preventDefault()}
                onClick={run}
                className="inline-flex items-center justify-center h-8 w-8 rounded-md text-text-muted hover:text-text-heading hover:bg-black/10 transition-colors"
              >
                <Icon size={15} />
              </button>
            ))}
            <span className="mx-0.5 h-5 w-px bg-black/10" aria-hidden />
            <button
              type="button"
              title="Insert image"
              aria-label="Insert image"
              disabled={uploading}
              onMouseDown={(e) => e.preventDefault()}
              onClick={insertImage}
              className="inline-flex items-center justify-center h-8 w-8 rounded-md text-text-muted hover:text-text-heading hover:bg-black/10 transition-colors disabled:opacity-50"
            >
              {uploading ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />}
            </button>
          </>
        )}
        <div className="ml-auto">
          <button
            type="button"
            onClick={() => setMode((m) => (m === "visual" ? "html" : "visual"))}
            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-[13px] font-medium text-text-muted hover:text-text-heading hover:bg-black/10 transition-colors"
          >
            {mode === "visual" ? <Code2 size={14} /> : <Eye size={14} />}
            {mode === "visual" ? "HTML" : "Visual"}
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
        className="hidden"
        onChange={handleFileSelected}
      />

      {mode === "visual" ? (
        <>
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={emit}
            onClick={handleEditorClick}
            role="textbox"
            aria-multiline="true"
            aria-label="Article content"
            className="sms-post-preview sms-editable glass-tile p-4 sm:p-5 min-h-[18rem] max-h-[55vh] overflow-y-auto outline-none focus:ring-2 focus:ring-brass-100 rounded-xl"
          />
          <p className="text-[13px] text-text-muted">
            Tip: click any image to replace it with your own upload.
          </p>
        </>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={16}
          spellCheck={false}
          className="input-base w-full text-xs font-mono resize-none"
        />
      )}

      {error && (
        <p className="text-xs text-[var(--mcv-danger)]/90 rounded-lg border border-[var(--mcv-danger)]/30 bg-[var(--mcv-danger)]/10 p-2">
          {error}
        </p>
      )}
    </div>
  );
}
