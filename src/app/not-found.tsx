import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="space-y-8">
          {/* Icon */}
          <div className="mx-auto w-24 h-24 text-gray-400 dark:text-gray-500">
            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>

          {/* Text content */}
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Page Not Found
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              The page you are looking for doesn't exist
            </p>
          </div>

          {/* Action button */}
          <Link
            href="/"
            className="inline-block px-6 py-3 text-base font-medium text-white 
                     bg-blue-500 rounded-lg hover:bg-blue-600 
                     transition-colors duration-200"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
} 