import { redirect } from "next/navigation";

/** Old invite links land on the access page. */
export default async function UnlockRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { type } = await params;
  const { t } = await searchParams;
  const query = t ? `?t=${encodeURIComponent(t)}` : "";
  redirect(`/access/${type}${query}`);
}
