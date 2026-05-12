import AppShell from "@/components/layout/AppShell";
import WebSocketInitializer from "@/components/providers/WebSocketInitializer";
import NotificationProvider from "@/components/providers/NotificationProvider";

// TODO Fase 8: Tambahkan <CopilotSlidingPanel /> di sini

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <WebSocketInitializer />
      <NotificationProvider />
      <AppShell>{children}</AppShell>
    </>
  );
}
