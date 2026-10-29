import { redirect } from "next/navigation";

/** Legacy Accelerator / Blackbox sources URL — Autopilot lives at /autopilot. */
export default function Page() {
  redirect("/autopilot");
}
