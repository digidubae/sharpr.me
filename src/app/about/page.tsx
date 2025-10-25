import Link from 'next/link';

export const metadata = {
  title: 'About - Sharpr.me',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              About
            </h1>
          </div>

          <div className="prose dark:prose-invert max-w-none">
            <section className="mb-8">
              <blockquote className="mb-4 border-l-4 border-gray-300 dark:border-gray-700 pl-4 italic text-gray-700 dark:text-gray-300">
                “Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away.”
                <footer className="mt-2 text-sm not-italic text-gray-600 dark:text-gray-400">— Antoine de Saint-Exupér</footer>
              </blockquote>
              <p className="mb-4 leading-relaxed">
                In the age of low barriers to technology and the rise of niche, personalized apps, I built this app to match how my brain is wired — focused, clear, and purposeful. It’s not meant for everyone, <strong>but it just might also happen to be the right tool for you.</strong>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Key Features</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>Sign in with your Google account</li>
                <li>Use your Google Drive as your storage</li>
                <li>Optional end-to-end encryption</li>
                <li>No ads, no tracking, no data collection.  Free forever</li>
                <li>Powerful tagging system to organize anything</li>
                <li>Seamless keyboard navigation</li>
              </ul>
            </section>



            <div className="text-center mt-8 pt-10">
              <Link
                href="/"
                className="inline-block px-6 py-3 text-base font-medium text-white 
                         bg-blue-500 rounded-lg hover:bg-blue-600 
                         transition-colors duration-200"
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 