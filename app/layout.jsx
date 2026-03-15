import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Smart Billing",
  description: "AI Powered Mobile Billing",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-linear-to-br from-indigo-50 via-purple-50 to-emerald-50 min-h-screen`}
      >
        <main className="max-w-md w-full mx-auto min-h-screen bg-white shadow-xl">
          {children}
        </main>
      </body>
    </html>
  );
}
