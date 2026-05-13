import type { Metadata } from "next";

import SessionKeepAlive from "@/components/SessionKeepAlive";

import "./globals.css";

export const metadata: Metadata = {
  title: "WDCC Calendar",
  description: "WDCC calendar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <SessionKeepAlive />
        {children}
      </body>
    </html>
  );
}
