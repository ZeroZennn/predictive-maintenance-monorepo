import { redirect } from "next/navigation";

export default function RootPage() {
  // DEV BYPASS — jika SKIP_AUTH aktif, langsung ke dashboard
  // WAJIB dikembalikan ke redirect("/login") sebelum production
  if (process.env.NEXT_PUBLIC_SKIP_AUTH === "true") {
    redirect("/dashboard");
  }
  redirect("/login");
}
