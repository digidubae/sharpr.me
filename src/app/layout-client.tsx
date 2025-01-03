'use client';

import { usePathname } from 'next/navigation';
import { SubjectProvider } from "@/context/SubjectContext";
import Footer from "@/components/Footer";
import { SessionProvider } from 'next-auth/react';
import AuthButton from '@/components/AuthButton';
import SyncStatus from '@/components/SyncStatus';

function HeaderButtons() {
  const pathname = usePathname();
  const isInSpace = pathname.startsWith('/s/');

  return (
    <>
      {isInSpace && (
        <div className="fixed top-4 left-4 z-50">
          <SyncStatus />
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