"use client";

import { clsx } from "clsx";
import { getNavIcon } from "@/lib/nav-icons";
import { brand } from "@/config/brand.config";

interface BrandLogoProps {
  size?: "sm" | "md" | "sidebar" | "lg";
  showTagline?: boolean;
  compact?: boolean;
  splitTitle?: boolean;
  stacked?: boolean;
  className?: string;
}

const SIZES = {
  sm: {
    box: "w-[38px] h-[38px]",
    icon: 18,
    imgHeight: "h-[38px] w-[38px]",
    wordmarkHeight: "h-[38px] sm:h-10",
    wordmarkWidth: "",
    img: 38,
    title: "text-[19px]",
    tagline: "text-[13px]",
  },
  md: {
    box: "w-[38px] h-[38px]",
    icon: 18,
    imgHeight: "h-[38px] w-[38px]",
    wordmarkHeight: "h-10 sm:h-11",
    wordmarkWidth: "",
    img: 38,
    title: "text-[19px] sm:text-[21px]",
    tagline: "text-[13px]",
  },
  sidebar: {
    box: "w-[38px] h-[38px]",
    icon: 18,
    imgHeight: "h-[38px] w-[38px]",
    wordmarkHeight: "",
    wordmarkWidth: "sidebar-brand-wordmark",
    img: 38,
    title: "text-[19px] leading-tight",
    tagline: "text-[13px]",
  },
  lg: {
    box: "w-[38px] h-[38px]",
    icon: 18,
    imgHeight: "h-[38px] w-[38px]",
    wordmarkHeight: "",
    wordmarkWidth: "auth-brand-wordmark",
    img: 38,
    title: "text-[19px] sm:text-[24px]",
    tagline: "text-[13px] sm:text-[15px]",
  },
};

export function BrandLogo({
  size = "sm",
  showTagline = true,
  compact = false,
  splitTitle = false,
  stacked = false,
  className,
}: BrandLogoProps) {
  const s = SIZES[size];
  const Icon = getNavIcon(brand.logo.icon);
  const useImage = brand.logo.type === "image";
  const isWordmarkImage = useImage && brand.logo.wordmark;
  const imageSrc = useImage && compact && brand.logo.iconSrc ? brand.logo.iconSrc : brand.logo.src;

  return (
    <div
      className={clsx(
        "flex min-w-0",
        stacked ? "flex-col items-center gap-3 text-center" : compact ? "items-center justify-center" : "items-stretch w-full",
        !stacked && !compact && "gap-0",
        !stacked && compact && "gap-2.5 sm:gap-4",
        className
      )}
    >
      {useImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSrc}
          alt={brand.logo.alt}
          width={compact ? s.img : undefined}
          height={compact ? s.img : undefined}
          className={
            compact
              ? clsx("shrink-0 object-contain w-auto", s.imgHeight)
              : isWordmarkImage && s.wordmarkWidth
                ? s.wordmarkWidth
                : clsx(
                    "shrink-0 object-contain w-auto",
                    s.wordmarkHeight,
                    isWordmarkImage ? "max-w-[min(100%,20rem)]" : "max-w-full"
                  )
          }
          loading="eager"
          decoding="async"
        />
      ) : (
        <div
          className={`${s.box} bg-grad-brass flex items-center justify-center rounded-lg shadow-brass shrink-0`}
        >
          <Icon size={s.icon} className="text-brass-900" />
        </div>
      )}
      {!compact && !isWordmarkImage && (
        <div className={clsx("flex flex-col min-w-0", stacked && "items-center")}>
          <span
            className={clsx(
              "brand-font whitespace-nowrap text-text-primary tracking-tight leading-tight",
              splitTitle ? s.title : compact ? "text-sm sm:text-base" : s.title
            )}
          >
            {brand.productName}
          </span>
          {showTagline && (
            <span className={`${s.tagline} font-medium text-text-muted mt-0.5 sm:mt-1 truncate`}>
              {brand.tagline}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
