/** First-run checklist: user copied a publish kit at least once. */
export const ONBOARDING_PUBLISH_COPY_KEY = "mcv_onboarding_publish_copy";
const PUBLISH_COPY_KEY = ONBOARDING_PUBLISH_COPY_KEY;

export function markPublishCopyDone() {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(PUBLISH_COPY_KEY, "1");
      window.dispatchEvent(new Event("mcv-onboarding-copy"));
    }
  } catch {
    /* ignore */
  }
}

export function hasPublishCopyDone(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(PUBLISH_COPY_KEY) === "1";
  } catch {
    return false;
  }
}
