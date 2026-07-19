import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import NodeBackground from "@/components/NodeBackground";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Andrés López — Senior Backend Engineer (Ruby · Python · Java · Go · AI/LLM) | ex-Mercado Libre",
  description: "Senior backend engineer: 3 years at Mercado Libre operating Golang at 250k req/min. Now building AI-powered backends (LLM, MCP, agents). Remote from Spain.",
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
    <html lang="en" className="dark">
      <body className={`${inter.className} text-gray-900 dark:text-gray-100`}>
        <NodeBackground />
        <Navbar />
        <main className="pt-20">{children}</main>
      </body>
    </html>
  );
}
