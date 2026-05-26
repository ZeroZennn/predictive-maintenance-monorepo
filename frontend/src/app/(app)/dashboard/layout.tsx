import { MachineListSidebar } from "@/components/dashboard";

export default function DashboardSpecificLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row h-full w-full overflow-hidden">
      <MachineListSidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
