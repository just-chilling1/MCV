"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { BlogPost } from "../types";

export function PostCard({ post, siteSlug }: { post: BlogPost; siteSlug: string }) {
  const href = `/sites/${siteSlug}/${post.slug}`;
  return (
    <div className="glass-card p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          {post.is_pillar && <span className="status-pill-gold mb-1">Pillar</span>}
          <h3 className="brand-font text-text-heading text-base">{post.title}</h3>
        </div>
        {post.status === "live" ? (
          <span className="status-pill-active">{post.status}</span>
        ) : (
          <span className="status-pill-muted">{post.status}</span>
        )}
      </div>
      {post.excerpt && <p className="text-xs text-text-muted line-clamp-2">{post.excerpt}</p>}
      <div className="flex items-center gap-4 text-xs text-text-muted mt-1">
        <span>{post.views} views</span>
        {post.status === "live" && (
          <Link
            href={href}
            target="_blank"
            className="inline-flex items-center gap-1 text-brass-700 hover:underline"
          >
            View live <ExternalLink size={12} />
          </Link>
        )}
      </div>
    </div>
  );
}
