"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { VideoOverlay } from "@/components/ui/video-overlay";
import { vimeoEmbedUrl } from "@/lib/support";
import type { TrainingVideo } from "@/lib/training-videos";
import { resolveVideoThumbnail } from "@/lib/video-thumbnails";

export default function PremiumFeatureVideo({
  video,
  thumbnailSrc,
}: {
  video: TrainingVideo;
  /** Optional override when the Vimeo id is shared across features */
  thumbnailSrc?: string;
}) {
  const [open, setOpen] = useState(false);
  const thumb = resolveVideoThumbnail(video.id, thumbnailSrc ?? null) ?? undefined;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="card-base mb-6 flex w-full flex-col overflow-hidden p-0 text-left lg:flex-row"
      >
        <span className="relative aspect-video w-full bg-ink lg:w-1/2">
          {thumb ? (
            <Image src={thumb} alt="" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 40vw" />
          ) : null}
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-grad-brass text-brass-900 shadow-brass">
              <Play className="h-5 w-5" />
            </span>
          </span>
        </span>
        <span className="flex flex-1 flex-col justify-center gap-2 p-5">
          <span className="page-eyebrow">Watch first</span>
          <span className="ds-h3">{video.title}</span>
          <span className="text-sm leading-relaxed text-text-secondary">{video.description}</span>
        </span>
      </button>
      {open ? (
        <VideoOverlay
          open={open}
          onClose={() => setOpen(false)}
          videoUrl={vimeoEmbedUrl(video.id)}
          title={video.title}
        />
      ) : null}
    </>
  );
}
