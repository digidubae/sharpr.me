import "./globals.css";
import { Inter } from "next/font/google";
import { SessionProvider } from "@/components/SessionProvider";
import { DialogProvider } from "@/context/DialogContext";
import { ThemeProvider } from "next-themes";
import { Providers } from "@/components/Providers";
import { ToastProvider } from "@/components/ToastProvider";
import { Analytics } from "@vercel/analytics/react";
import LayoutClient from "./layout-client";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { typedEnv } from './environment-variables';

typedEnv;

const font = Inter({ subsets: ["latin"]});
export const metadata = {
  title: "Sharpr.me",
  description: "Stay sharp with information at your fingertips.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={font.className}>
        <ThemeProvider attribute="class" enableSystem defaultTheme="system">
          <SessionProvider>
            <DialogProvider>
              <Providers>
                <ToastProvider>
                  <LayoutClient>
                    {children}
                    <SpeedInsights />
                  </LayoutClient>
                </ToastProvider>
              </Providers>
            </DialogProvider>
          </SessionProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
