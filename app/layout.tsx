import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Elevate Underground Lab Access",
  description: "Request access to the Elevate Underground lab, view schedule, and check lab status.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
