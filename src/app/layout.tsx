import './globals.css';
import { Inter } from 'next/font/google';
import { SessionProvider } from '@/components/SessionProvider';
import { DialogProvider } from '@/context/DialogContext';
import Footer from '@/components/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Sharpr.me',
  description: 'A simple, fast, and beautiful way to organize your thoughts.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProvider>
          <DialogProvider>
            {children}
          </DialogProvider>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
