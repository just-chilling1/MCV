import { redirect } from "next/navigation";

export default function Page() {
  redirect("/sales-offer-generator?step=3");
}
