import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="scroll-smooth">
      {/* THE MOST CRITICAL PART: INJECTING VARIABLES HERE */}
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans bg-[#081819] text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}
