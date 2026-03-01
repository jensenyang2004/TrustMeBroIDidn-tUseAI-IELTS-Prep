import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "IELTS Vibe Tutor",
  description: "Automated IELTS Writing Practice",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#fafafa]">
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
