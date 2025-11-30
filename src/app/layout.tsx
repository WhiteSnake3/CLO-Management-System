import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CLOMS",
  description: "Course Learning Outcomes Management System",
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
