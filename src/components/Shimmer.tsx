'use client';

interface ShimmerProps {
  message?: string;
}

export default function Shimmer({ message = 'Loading...' }: ShimmerProps) {
  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <div className="mb-12 text-center relative">
        <div className="h-8 w-48 mx-auto rounded-lg animate-shimmer" />
        <div className="absolute right-0 top-0 w-6 h-6 rounded animate-shimmer" />
        <p className="mt-4 text-gray-400 dark:text-gray-500">{message}</p>
      </div>
      
      <div className="space-y-8 w-full">
        {/* Search bar shimmer */}
        <div className="space-y-4 w-full">
          <div className="h-12 w-full rounded-lg animate-shimmer" />
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 w-20 rounded-full animate-shimmer" />
            ))}
          </div>
        </div>

        {/* Add subject form shimmer */}
        <div className="h-12 w-full rounded-lg animate-shimmer" />

        {/* Subject list shimmer */}
        <div className="space-y-4 w-full">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 w-full rounded-lg animate-shimmer" />
          ))}
        </div>
      </div>
    </div>
  );
} 