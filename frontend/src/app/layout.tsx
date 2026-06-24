import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AvatarProvider } from "@/context/AvatarContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SignWave | AI-Powered Sign Language Translation & Captioning",
  description: "Transform any video or audio into accurate captions and lifelike 3D sign language avatars with AI.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="min-h-full bg-background text-foreground font-sans antialiased">
        <AvatarProvider>
          {children}
        </AvatarProvider>
      </body>
    </html>
  );
}
