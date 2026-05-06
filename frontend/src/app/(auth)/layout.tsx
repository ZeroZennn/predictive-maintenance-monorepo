export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen w-full bg-lapis-bg flex items-center justify-center p-4">
      {children}
    </main>
  );
}
