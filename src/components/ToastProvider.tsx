'use client';

import { Toaster, ToastBar, toast } from 'react-hot-toast';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster 
        position="top-left"
        toastOptions={{
          duration: 5000,
          style: {
            background: '#111827',
            color: '#fff',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          },
          error: {
            duration: 5000,
            style: {
              background: '#ef4444',
              color: '#fff',
            },
            icon: null,
          },
          success: {
            duration: 5000,
            style: {
              background: '#34d399',
              color: '#fff',
            },
          },
          loading: {
            duration: 5000,
            style: {
              background: '#f59e0b',
              color: '#fff',
            },
          },
        }}
      >
        {(t) => (
          <ToastBar toast={t}>
            {({ message }) => (
              <>
                {message}
                {t.type !== 'loading' && (
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="ml-2 p-1 hover:bg-red-600 rounded-full transition-colors"
                    aria-label="Dismiss notification"
                  >
                    <svg 
                      className="w-4 h-4" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M6 18L18 6M6 6l12 12" 
                      />
                    </svg>
                  </button>
                )}
              </>
            )}
          </ToastBar>
        )}
      </Toaster>
    </>
  );
} 