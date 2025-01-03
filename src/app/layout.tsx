import "./globals.css";
import { Inter } from "next/font/google";
import { SessionProvider } from "@/components/SessionProvider";
import { DialogProvider } from "@/context/DialogContext";
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
        <SessionProvider>
          <DialogProvider>{children}</DialogProvider>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
