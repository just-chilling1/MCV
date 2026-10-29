import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UpsellType } from "@/types";
import AccessPowerupClient from "./AccessPowerupClient";

const VALID: UpsellType[] = ["10x", "infinite", "automation", "protector"];

function isUpsellType(value: string): value is UpsellType {
  return VALID.includes(value as UpsellType);
}

export default async function AccessPowerupPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { type: rawType } = await params;
  const { t = "" } = await searchParams;
  const type = rawType === "dfy" ? "protector" : rawType;

  if (!isUpsellType(type)) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const nextPath = `/access/${type}${t ? `?t=${encodeURIComponent(t)}` : ""}`;
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  const { data: existingGrant } = await supabase
    .from("user_powerup_grants")
    .select("powerup")
    .eq("user_id", user.id)
    .in("powerup", type === "protector" ? ["protector", "dfy"] : [type])
    .maybeSingle();

  return (
    <AccessPowerupClient
      powerup={type}
      token={typeof t === "string" ? t : ""}
      initialEmail={user.email ?? ""}
      alreadyGranted={!!existingGrant}
    />
  );
}
