import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lapis AI — Predictive Maintenance Dashboard",
  description:
    "Industrial predictive maintenance platform powered by AI. Monitor machine health, detect anomalies, and prevent downtime in real time.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
