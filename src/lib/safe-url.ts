import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const BLOCKED_HOSTS = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata",
  "169.254.169.254",
]);

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return true;
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

function stripIpBrackets(host: string): string {
  return host.startsWith("[") && host.endsWith("]") ? host.slice(1, -1) : host;
}

function mappedIpv4(ip: string): string | null {
  const lower = stripIpBrackets(ip).toLowerCase();
  const dotted = lower.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (dotted?.[1]) return dotted[1];

  // Node URL normalizes ::ffff:169.254.169.254 → ::ffff:a9fe:a9fe
  const hex = lower.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (!hex) return null;
  const hi = parseInt(hex[1]!, 16);
  const lo = parseInt(hex[2]!, 16);
  if (Number.isNaN(hi) || Number.isNaN(lo)) return null;
  return `${(hi >> 8) & 255}.${hi & 255}.${(lo >> 8) & 255}.${lo & 255}`;
}

function isPrivateIpv6(ip: string): boolean {
  const lower = stripIpBrackets(ip).toLowerCase();
  const v4 = mappedIpv4(lower);
  if (v4) return isPrivateIpv4(v4);
  return (
    lower === "::1" ||
    lower.startsWith("fc") ||
    lower.startsWith("fd") ||
    lower.startsWith("fe80")
  );
}

export function isPrivateOrLocalHost(hostname: string): boolean {
  const host = stripIpBrackets(hostname.trim().toLowerCase().replace(/\.$/, ""));
  if (!host || BLOCKED_HOSTS.has(host)) return true;
  if (host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    return true;
  }

  const v4Mapped = mappedIpv4(host);
  if (v4Mapped) return isPrivateIpv4(v4Mapped);

  const ipVersion = isIP(host);
  if (ipVersion === 4) return isPrivateIpv4(host);
  if (ipVersion === 6) return isPrivateIpv6(host);
  return false;
}

export function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function assertPublicHttpsUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Invalid URL");
  }

  if (url.protocol !== "https:") {
    throw new Error("Only https URLs are allowed");
  }
  if (url.username || url.password) {
    throw new Error("URLs with credentials are not allowed");
  }
  if (isPrivateOrLocalHost(url.hostname)) {
    throw new Error("Private or local URLs are not allowed");
  }
  return url;
}

export async function assertPublicHttpsUrlResolved(raw: string): Promise<URL> {
  const url = assertPublicHttpsUrl(raw);
  if (isIP(url.hostname)) return url;

  try {
    const records = await lookup(url.hostname, { all: true });
    if (records.length === 0) throw new Error("Host could not be resolved");
    for (const rec of records) {
      if (isPrivateOrLocalHost(rec.address)) {
        throw new Error("Host resolves to a private address");
      }
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes("private")) throw err;
    throw new Error("Host could not be resolved");
  }

  return url;
}

export function assertPublicHttpUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Invalid URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http(s) URLs are allowed");
  }
  if (url.username || url.password) {
    throw new Error("URLs with credentials are not allowed");
  }
  if (isPrivateOrLocalHost(url.hostname)) {
    throw new Error("Private or local URLs are not allowed");
  }
  return url;
}

/** Like assertPublicHttpsUrlResolved, but allows http as well (remote images). */
export async function assertPublicHttpUrlResolved(raw: string): Promise<URL> {
  const url = assertPublicHttpUrl(raw);
  if (isIP(url.hostname)) return url;

  try {
    const records = await lookup(url.hostname, { all: true });
    if (records.length === 0) throw new Error("Host could not be resolved");
    for (const rec of records) {
      if (isPrivateOrLocalHost(rec.address)) {
        throw new Error("Host resolves to a private address");
      }
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes("private")) throw err;
    throw new Error("Host could not be resolved");
  }

  return url;
}

const MAX_REDIRECTS = 5;

/**
 * Fetch a public http(s) URL, re-validating each redirect Location so a
 * public host cannot bounce the server onto a private address.
 */
export async function fetchPublicHttp(
  raw: string,
  init: RequestInit & { allowHttp?: boolean } = {}
): Promise<Response> {
  const { allowHttp = false, ...fetchInit } = init;
  let current = allowHttp
    ? (await assertPublicHttpUrlResolved(raw)).toString()
    : (await assertPublicHttpsUrlResolved(raw)).toString();

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const res = await fetch(current, {
      ...fetchInit,
      redirect: "manual",
    });

    if (res.status < 300 || res.status >= 400) return res;

    const location = res.headers.get("location");
    if (!location) return res;

    const next = new URL(location, current).toString();
    current = allowHttp
      ? (await assertPublicHttpUrlResolved(next)).toString()
      : (await assertPublicHttpsUrlResolved(next)).toString();
  }

  throw new Error("Too many redirects");
}
