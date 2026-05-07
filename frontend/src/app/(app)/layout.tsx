import AppShell from "@/components/layout/AppShell";
import WebSocketInitializer from "@/components/providers/WebSocketInitializer";

// TODO Fase 5: Tambahkan <GlobalToastProvider /> di sini
// TODO Fase 8: Tambahkan <CopilotSlidingPanel /> di sini

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <WebSocketInitializer />
      <AppShell>{children}</AppShell>
    </>
  );
}
