import AppShell from "@/components/layout/AppShell";
import WebSocketInitializer from "@/components/providers/WebSocketInitializer";
import NotificationProvider from "@/components/providers/NotificationProvider";
import { CopilotSlidingPanel } from "@/components/copilot";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      <WebSocketInitializer />
      <NotificationProvider />
      <div className="flex-1 h-screen overflow-hidden relative">
        {children}
        <CopilotSlidingPanel />
      </div>
    </AppShell>
  );
}
