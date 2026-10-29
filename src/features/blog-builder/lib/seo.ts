export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "post";
}

export function buildArticleJsonLd(params: {
  title: string;
  description: string;
  url: string;
  imageUrl?: string | null;
  datePublished: string;
  dateModified?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: params.title,
    description: params.description,
    url: params.url,
    image: params.imageUrl ?? undefined,
    datePublished: params.datePublished,
    dateModified: params.dateModified ?? params.datePublished,
    author: { "@type": "Organization", name: "Secret Millionaire Society" },
    publisher: {
      "@type": "Organization",
      name: "Secret Millionaire Society",
    },
  };
}
