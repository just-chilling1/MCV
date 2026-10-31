import { redirect } from "next/navigation";

export default function Page() {
  // Contact form is the top of /support — hash fragments are unreliable in server redirects.
  redirect("/support");
}
