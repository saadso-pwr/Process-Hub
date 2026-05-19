import type { Metadata } from "next";
import { PowerOneShell } from "@/components/PowerOneShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Process Hub | Power Technology",
  description: "Offerings Process Maps",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full overflow-hidden bg-white">
        <PowerOneShell>{children}</PowerOneShell>
      </body>
    </html>
  );
}
