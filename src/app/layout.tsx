import "./globals.css";
import { Inter } from "next/font/google";
import { SessionProvider } from "@/components/SessionProvider";
import { DialogProvider } from "@/context/DialogContext";
import { ThemeProvider } from "next-themes";
import Footer from "@/components/Footer";

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
            <DialogProvider>{children}</DialogProvider>
            <Footer />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
