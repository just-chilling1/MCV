export function normalizeAffiliateUrl(raw: string): string {
  let url = raw.trim();
  if (!url) return "";

  const lower = url.toLowerCase();
  const httpsIdx = lower.indexOf("https://");
  const httpIdx = lower.indexOf("http://");

  if (httpsIdx > 0) url = url.slice(httpsIdx);
  else if (httpIdx > 0) url = url.slice(httpIdx);
  else if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

  return url;
}

export function isValidAffiliateUrl(raw: string): boolean {
  const url = normalizeAffiliateUrl(raw);
  if (!url) return false;

  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function detectLinkNetwork(url: string): "digistore" | "amazon" | "other" {
  const lower = url.toLowerCase();
  if (lower.includes("digistore24") || lower.includes("digistore")) return "digistore";
  if (lower.includes("amazon.")) return "amazon";
  return "other";
}
