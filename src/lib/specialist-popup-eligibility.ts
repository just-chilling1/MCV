import geoip from "geoip-country";

/** Pacific business hours for the Start-Up Specialist welcome popup. */
export const SPECIALIST_TZ = "America/Los_Angeles";

/** Inclusive start: 08:30 PT */
export const SPECIALIST_WINDOW_START_MINUTES = 8 * 60 + 30;

/** Exclusive end: 17:30 PT */
export const SPECIALIST_WINDOW_END_MINUTES = 17 * 60 + 30;

const ELIGIBLE_COUNTRIES = new Set(["US", "CA"]);

/** Edge placeholders that are not real ISO country codes. */
const INVALID_COUNTRY_CODES = new Set(["XX", "T1", "ZZ"]);

function normalizeClientIp(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let ip = raw.trim();
  if (ip.includes(",")) ip = ip.split(",")[0]?.trim() ?? "";
  if (ip.startsWith("[")) {
    const end = ip.indexOf("]");
    if (end > 0) ip = ip.slice(1, end);
  } else if (/^\d+\.\d+\.\d+\.\d+:\d+$/.test(ip)) {
    ip = ip.replace(/:\d+$/, "");
  }
  return ip || null;
}

function isPrivateOrLocalIp(ip: string): boolean {
  if (ip === "::1" || ip === "127.0.0.1" || ip === "0.0.0.0") return true;
  if (ip.startsWith("10.") || ip.startsWith("192.168.") || ip.startsWith("127.")) {
    return true;
  }
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) return true;
  const lower = ip.toLowerCase();
  if (
    lower.startsWith("fc") ||
    lower.startsWith("fd") ||
    lower.startsWith("fe80:") ||
    lower.startsWith("::ffff:10.") ||
    lower.startsWith("::ffff:192.168.")
  ) {
    return true;
  }
  return false;
}

/** Best-effort client IP for DigitalOcean App Platform (+ common proxies). */
export function clientIpFromRequest(request: Request): string | null {
  const candidates = [
    request.headers.get("do-connecting-ip"),
    request.headers.get("true-client-ip"),
    request.headers.get("cf-connecting-ip"),
    request.headers.get("x-real-ip"),
    request.headers.get("x-forwarded-for"),
  ];
  for (const raw of candidates) {
    const ip = normalizeClientIp(raw);
    if (ip && !isPrivateOrLocalIp(ip)) return ip;
  }
  return null;
}

export function countryFromIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  try {
    const hit = geoip.lookup(ip);
    const code = hit?.country?.trim().toUpperCase();
    if (code && /^[A-Z]{2}$/.test(code) && !INVALID_COUNTRY_CODES.has(code)) {
      return code;
    }
  } catch {
    // corrupt / unknown IP — fail closed
  }
  return null;
}

export function resolveRequestCountry(request: Request): string | null {
  const headerCandidates = [
    request.headers.get("x-vercel-ip-country"),
    request.headers.get("cf-ipcountry"),
    request.headers.get("cloudfront-viewer-country"),
    request.headers.get("x-country-code"),
  ];

  for (const raw of headerCandidates) {
    const code = raw?.trim().toUpperCase();
    if (!code || INVALID_COUNTRY_CODES.has(code)) continue;
    if (/^[A-Z]{2}$/.test(code)) return code;
  }

  const fromIp = countryFromIp(clientIpFromRequest(request));
  if (fromIp) return fromIp;

  if (process.env.NODE_ENV === "development") {
    const url = new URL(request.url);
    const debug = url.searchParams.get("debugCountry");
    if (debug) {
      const code = debug.trim().toUpperCase();
      if (/^[A-Z]{2}$/.test(code) && !INVALID_COUNTRY_CODES.has(code)) {
        return code;
      }
    }
  }

  return null;
}

export function isUsOrCa(country: string | null | undefined): boolean {
  if (!country) return false;
  return ELIGIBLE_COUNTRIES.has(country.trim().toUpperCase());
}

type PtParts = {
  weekday: string;
  hour: number;
  minute: number;
};

function getPacificParts(date: Date): PtParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: SPECIALIST_TZ,
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  let hour = Number(get("hour"));
  if (hour === 24) hour = 0;

  return {
    weekday: get("weekday"),
    hour,
    minute: Number(get("minute")),
  };
}

const WEEKDAYS = new Set(["Mon", "Tue", "Wed", "Thu", "Fri"]);

export function isWithinSpecialistHours(date: Date): boolean {
  const { weekday, hour, minute } = getPacificParts(date);
  if (!WEEKDAYS.has(weekday)) return false;
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return false;

  const minutes = hour * 60 + minute;
  return (
    minutes >= SPECIALIST_WINDOW_START_MINUTES &&
    minutes < SPECIALIST_WINDOW_END_MINUTES
  );
}

export function msUntilSpecialistWindowClose(date: Date): number | null {
  if (!isWithinSpecialistHours(date)) return null;

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: SPECIALIST_TZ,
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? NaN);

  let hour = get("hour");
  if (hour === 24) hour = 0;
  const minute = get("minute");
  const second = get("second");
  const minutesNow = hour * 60 + minute;
  const msIntoMinute = second * 1000 + date.getMilliseconds();
  return (SPECIALIST_WINDOW_END_MINUTES - minutesNow) * 60_000 - msIntoMinute;
}

export function evaluateSpecialistEligibility(
  country: string | null | undefined,
  date: Date = new Date()
): { eligible: boolean; country: string | null; closesInMs?: number } {
  const normalized = country?.trim().toUpperCase() || null;
  const countryOk = isUsOrCa(normalized);
  const hoursOk = isWithinSpecialistHours(date);
  const eligible = countryOk && hoursOk;

  if (!eligible) {
    return { eligible: false, country: normalized };
  }

  const closesInMs = msUntilSpecialistWindowClose(date);
  return {
    eligible: true,
    country: normalized,
    ...(closesInMs != null ? { closesInMs } : {}),
  };
}
