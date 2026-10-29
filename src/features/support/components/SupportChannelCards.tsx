"use client";

import { BookOpen, ExternalLink, Mail } from "lucide-react";
import { support } from "@/config/support.config";

const channels = [
  {
    href: `mailto:${support.email}`,
    icon: Mail,
    title: "Email Support",
    detail: support.email,
    external: false,
  },
  {
    href: support.helpCenterUrl,
    icon: BookOpen,
    title: "Help Center",
    detail: "Browse articles and track your tickets",
    external: true,
  },
];

export function SupportChannelCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {channels.map(({ href, icon: Icon, title, detail, external }) => (
        <a
          key={title}
          href={href}
          className="group"
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          <div className="card-base flex h-full items-center gap-4 transition-colors hover:border-success/30 hover:bg-success/5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-success/20 bg-success/10 transition-colors group-hover:bg-success/15">
              <Icon className="h-6 w-6 text-success" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="ds-h4 mb-0.5">{title}</h3>
              <p className="truncate text-sm text-text-muted">{detail}</p>
            </div>
            <ExternalLink className="h-5 w-5 shrink-0 text-text-muted transition-colors group-hover:text-success" />
          </div>
        </a>
      ))}
    </div>
  );
}
