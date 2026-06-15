import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono, Lora } from "next/font/google";
import "./globals.css";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const serif = Lora({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Between 8 & 2",
  description: "8.2's question space",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jakartaSans.variable} ${mono.variable} ${serif.variable} h-full antialiased`}
    >
      <body className="h-full w-full flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}