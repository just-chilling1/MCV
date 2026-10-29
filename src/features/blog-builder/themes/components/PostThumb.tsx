import Image from "next/image";
import Link from "next/link";

interface PostThumbProps {
  href?: string;
  imageUrl?: string | null;
  alt: string;
  className?: string;
  large?: boolean;
}

export function PostThumb({ href, imageUrl, alt, className = "", large }: PostThumbProps) {
  const inner = (
    <>
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={alt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover"
          loading="lazy"
        />
      ) : (
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.35), transparent 50%), radial-gradient(circle at 80% 80%, rgba(0,0,0,0.2), transparent 40%)",
          }}
          aria-hidden
        />
      )}
    </>
  );

  const classes = `blog-thumb ${large ? "" : "blog-thumb-aspect"} ${className}`.trim();

  if (href) {
    return (
      <Link href={href} className={classes}>
        {inner}
      </Link>
    );
  }

  return <div className={classes}>{inner}</div>;
}
