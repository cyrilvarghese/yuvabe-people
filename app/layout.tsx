import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";
import { SignOutButton } from "./_components/sign-out-button";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Yuvabe ATS",
  description: "Hiring is a human act.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Render the Sign out button only when there's a valid session — keeps it
  // off the /login and /apply pages (the only routes anonymous users see).
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const isAuthenticated = process.env.AUTH_SECRET
    ? await verifySession(token, process.env.AUTH_SECRET)
    : false;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {isAuthenticated && <SignOutButton />}
        {children}
      </body>
    </html>
  );
}
