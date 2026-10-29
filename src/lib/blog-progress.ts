/** Compute sidebar workflow progress from a blog_builder_sessions row. */
export function computeBlogProgressFromSession(row: {
  deployed?: boolean;
  theme_chosen?: boolean;
  step?: number;
  territory_chosen?: boolean;
  links_armed?: boolean;
} | null | undefined): number {
  if (!row) return 0;
  if (row.deployed) return 4;
  if (row.theme_chosen || (typeof row.step === "number" && row.step >= 3)) return 3;
  if (row.territory_chosen || (typeof row.step === "number" && row.step >= 2)) return 2;
  if (row.links_armed || (typeof row.step === "number" && row.step >= 1)) return 1;
  return 0;
}
