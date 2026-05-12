import { redirect } from "next/navigation";

// (app)/page.tsx — route "/"
// Redirect ke /dashboard sebagai halaman utama app
export default function AppIndexPage() {
  redirect("/dashboard");
}
