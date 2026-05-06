import AppShell from "@/components/layout/AppShell";

// TODO Fase 5: Tambahkan <GlobalToastProvider /> di sini
// TODO Fase 8: Tambahkan <CopilotSlidingPanel /> di sini

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
