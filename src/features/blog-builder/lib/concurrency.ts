/**
 * Run async tasks with a bounded concurrency pool, preserving input order in
 * the returned results. Used to parallelize bulk post/image generation while
 * keeping pressure on the shared RapidAPI quota predictable.
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  const poolSize = Math.max(1, Math.min(limit, items.length));
  let cursor = 0;

  async function runner(): Promise<void> {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: poolSize }, runner));
  return results;
}
