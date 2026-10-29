export interface FetchJsonOptions extends RequestInit {
  retries?: number;
}

export async function fetchJson<T>(
  url: string,
  init?: FetchJsonOptions
): Promise<
  | { ok: true; data: T; status: number }
  | { ok: false; status: number; data?: unknown; error: string }
> {
  const { retries = 2, ...rest } = init ?? {};
  let lastError = "Request failed";

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, rest);
      const status = res.status;
      let data: unknown;
      const ct = res.headers.get("content-type");
      const rawText = await res.text();
      if (ct?.includes("application/json") && rawText.length > 0) {
        try {
          data = JSON.parse(rawText) as unknown;
        } catch {
          data = undefined;
        }
      } else {
        data = rawText.length > 0 ? rawText : undefined;
      }

      if (res.ok) {
        return { ok: true, data: data as T, status };
      }

      const errBody = data as { error?: string; details?: string } | undefined;
      lastError = errBody?.details || errBody?.error || res.statusText || `HTTP ${status}`;

      if (status >= 400 && status < 500) {
        return { ok: false, status, data, error: lastError };
      }

      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
        continue;
      }

      return { ok: false, status, data, error: lastError };
    } catch (e) {
      lastError = e instanceof Error ? e.message : "Network error";
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
        continue;
      }
      return { ok: false, status: 0, error: lastError };
    }
  }

  return { ok: false, status: 0, error: lastError };
}
