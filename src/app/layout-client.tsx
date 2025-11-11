'use client';

import AuthButton from '@/components/AuthButton';
import Footer from "@/components/Footer";
import { SubjectProvider } from "@/context/SubjectContext";
import { SessionProvider } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

function HeaderButtons() {
  const pathname = usePathname();
  const isInSpace = pathname.startsWith('/s/');

  return (
    <>
      {isInSpace && (
        <div className="fixed top-4 left-4 z-50">
          {/* <SyncStatus /> */}
        </div>
      )}
      <div className="fixed top-4 right-4 z-50">
        <AuthButton />
      </div>
    </>
  );
}

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';
  
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  const content = (
    <>
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );

  const wrappedContent = (
    <SessionProvider>
      {isLandingPage ? (
        <>
          <div className="fixed top-4 right-4 z-50">
            <AuthButton />
          </div>
          {content}
        </>
      ) : (
        <SubjectProvider>
          <HeaderButtons />
          {content}
        </SubjectProvider>
      )}
    </SessionProvider>
  );

  return wrappedContent;
}