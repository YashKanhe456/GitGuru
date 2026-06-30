import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GitGuru",
  description: "AI-powered codebase intelligence for GitHub repositories.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
