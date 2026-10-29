import { normalizeImageUrl, resolveFastImageUrl, type ResolvedImage } from "./images";

type ResolveParams = Parameters<typeof resolveFastImageUrl>[0];

/**
 * Tracks images used across one site generation (7 deploy posts or 25 premium).
 * Image lookups run in parallel; only snapshot reads and dedupe writes are serialized.
 */
export class SiteImagePool {
  private usedUrls = new Set<string>();
  private usedStockIds = new Set<string>();
  private lock: Promise<void> = Promise.resolve();

  private track(image: Pick<ResolvedImage, "url" | "stockId">) {
    if (image.url) this.usedUrls.add(normalizeImageUrl(image.url));
    if (image.stockId) this.usedStockIds.add(image.stockId);
  }

  private async runExclusive<T>(fn: () => T | Promise<T>): Promise<T> {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const prev = this.lock;
    this.lock = gate;
    await prev;
    try {
      return await fn();
    } finally {
      release();
    }
  }

  /** Pre-register prefetched heroes so inline picks skip them. */
  seed(images: Iterable<Pick<ResolvedImage, "url" | "stockId">>) {
    for (const image of images) this.track(image);
  }

  /** Resume dedupe state from a prior attach batch (next wave / API call). */
  seedExcludes(excludeUrls: string[] = [], excludeStockIds: string[] = []) {
    for (const url of excludeUrls) {
      if (url) this.usedUrls.add(normalizeImageUrl(url));
    }
    for (const id of excludeStockIds) {
      if (id) this.usedStockIds.add(id);
    }
  }

  snapshot(): { excludeUrls: string[]; excludeStockIds: string[] } {
    return {
      excludeUrls: [...this.usedUrls],
      excludeStockIds: [...this.usedStockIds],
    };
  }

  /** Resolve a unique image and register it in the pool. */
  async resolveUnique(params: ResolveParams): Promise<ResolvedImage> {
    const snap = await this.runExclusive(() => this.snapshot());
    const image = await resolveFastImageUrl({
      ...params,
      excludeUrls: [...(params.excludeUrls ?? []), ...snap.excludeUrls],
      excludeStockIds: [...(params.excludeStockIds ?? []), ...snap.excludeStockIds],
    });
    await this.runExclusive(() => {
      this.track(image);
    });
    return image;
  }
}
