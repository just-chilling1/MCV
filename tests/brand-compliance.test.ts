import { describe, expect, it } from "vitest";
import { SUPPORT_EMAIL } from "@/lib/support";
import {
  CANONICAL_SUPPORT_EMAIL,
  collectScanTargets,
  findBannedBrandViolations,
  findEmailViolations,
  SCAN_DIRECTORIES,
} from "./lib/brand-compliance-scan";

describe("brand compliance", () => {
  const targets = collectScanTargets();

  it("scans source, docs, and public assets", () => {
    expect(targets.length).toBeGreaterThan(0);
    const scannedPaths = new Set(targets.map((t) => t.file.replaceAll("\\", "/")));
    expect(scannedPaths.has("src/lib/support.ts")).toBe(true);
    expect(
      SCAN_DIRECTORIES.every((dir) =>
        targets.some((t) => t.file.replaceAll("\\", "/").startsWith(`${dir}/`))
      )
    ).toBe(true);
  });

  it("uses only the canonical support email plus known senders", () => {
    expect(findEmailViolations(targets)).toEqual([]);
  });

  it("contains no previous brand names", () => {
    expect(findBannedBrandViolations(targets)).toEqual([]);
  });

  it("defines the Mobile Cash Vault support email", () => {
    expect(CANONICAL_SUPPORT_EMAIL).toBe(SUPPORT_EMAIL);
    expect(SUPPORT_EMAIL).toBe("MobileCashVault@neoai.freshdesk.com");
  });
});
