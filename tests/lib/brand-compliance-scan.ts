import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import path from "path";
import { SUPPORT_EMAIL, RESEND_SENDER_EMAIL } from "@/lib/support";

export const CANONICAL_SUPPORT_EMAIL = SUPPORT_EMAIL;

export const ALLOWED_EMAILS = new Set([
  CANONICAL_SUPPORT_EMAIL.toLowerCase(),
  RESEND_SENDER_EMAIL.toLowerCase(),
  "you@example.com",
  "your@email.com",
  "user@example.com",
  "dev-local@mobile-cash-vault.local",
]);

const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
export const BANNED_BRAND_PATTERN =
  /BatteryProfits|battery-profits|batteryprof|BlackBox Cash|blackbox_cash|robin\s*hood|robinhood/i;

const SCAN_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".md", ".json", ".html", ".css", ".txt", ".svg"]);

const PROJECT_ROOT = path.resolve(__dirname, "../..");

export const SCAN_DIRECTORIES = ["src", "docs", "public"] as const;

export const SCAN_FILES = [
  "README.md",
  "DESIGN_SYSTEM.md",
  "MOBILE_GUIDE.md",
  "package.json",
] as const;

export type ScanTarget = { file: string; content: string };

function walkDirectory(dir: string, files: string[] = []): string[] {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      if (entry === "node_modules" || entry === ".next") continue;
      walkDirectory(fullPath, files);
    } else if (SCAN_EXTENSIONS.has(path.extname(fullPath))) {
      files.push(fullPath);
    }
  }
  return files;
}

export function collectScanTargets(): ScanTarget[] {
  const targets: ScanTarget[] = [];
  for (const dir of SCAN_DIRECTORIES) {
    const absoluteDir = path.join(PROJECT_ROOT, dir);
    for (const file of walkDirectory(absoluteDir)) {
      targets.push({
        file: path.relative(PROJECT_ROOT, file),
        content: readFileSync(file, "utf8"),
      });
    }
  }
  for (const relativeFile of SCAN_FILES) {
    const absoluteFile = path.join(PROJECT_ROOT, relativeFile);
    if (!existsSync(absoluteFile)) continue;
    targets.push({
      file: relativeFile,
      content: readFileSync(absoluteFile, "utf8"),
    });
  }
  return targets;
}

export function findEmailViolations(targets: ScanTarget[]): string[] {
  const violations: string[] = [];
  for (const { file, content } of targets) {
    const matches = content.match(EMAIL_PATTERN) ?? [];
    for (const match of matches) {
      if (!ALLOWED_EMAILS.has(match.toLowerCase())) {
        violations.push(`${file}: ${match}`);
      }
    }
  }
  return violations;
}

export function findBannedBrandViolations(targets: ScanTarget[]): string[] {
  const violations: string[] = [];
  for (const { file, content } of targets) {
    if (BANNED_BRAND_PATTERN.test(content)) violations.push(file);
  }
  return violations;
}
