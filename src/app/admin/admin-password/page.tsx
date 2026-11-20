import { redirect } from "next/navigation";

/** Moved: both password screens are now one page at /admin/passwords. */
export default function OldPasswordPage() {
  redirect("/admin/passwords?type=admin");
}
