import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { MascotIcon } from "@/components/Mascot";
import { getAuthUser } from "@/lib/supabase/session";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Notely",
  description: "Record or upload a lecture, get structured notes, flashcards, and a quiz.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Notely",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#5FC7F2",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getAuthUser();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ServiceWorkerRegister />
        <header className="bg-card border-b border-card-border sticky top-0 z-10">
          <div className="max-w-3xl mx-auto flex items-center justify-between px-6 py-3.5">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <MascotIcon className="h-8 w-8" />
              Notely
            </Link>
            {user && (
              <div className="flex items-center gap-4">
                <Link
                  href="/lectures"
                  className="text-sm font-medium text-muted hover:text-foreground transition-colors px-3 py-1.5 rounded-full hover:bg-brand-blue/10"
                >
                  My Lectures
                </Link>
                <span className="text-xs text-muted hidden sm:inline">{user.email}</span>
                <form action="/auth/signout" method="post">
                  <button
                    type="submit"
                    className="text-sm font-medium text-muted hover:text-brand-pink-dark transition-colors"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            )}
          </div>
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
      </body>
    </html>
  );
}
