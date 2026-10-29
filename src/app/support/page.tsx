import { loadFeaturePage } from "@/lib/load-feature-page";

const SupportPage = loadFeaturePage(
  () => import("@/features/support/pages/SupportPage"),
  "Loading Support..."
);

export default function Page() {
  return <SupportPage />;
}
