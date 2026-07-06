import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import NodeBackground from "@/components/NodeBackground";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AL Portfolio",
  description: "A portfolio of my GitHub projects.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} text-gray-900 dark:text-gray-100`}>
        <NodeBackground />
        <Navbar />
        <main className="pt-20">{children}</main>
      </body>
    </html>
  );
}
