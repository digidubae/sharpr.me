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
              <p className="mb-4 leading-relaxed">
                With all the knowledge management tools out there, we just couldn't find the right one for us so we've built one.
              </p>
              <p>
                Sharpr.me is a knowledge management tool without the hassle of all the other tools.  Focusing on simplicity, <Link href="/privacy-policy" className="text-blue-600 dark:text-blue-400 hover:underline">data privacy</Link>, and ease of use, Sharpr.me might just be the right tool for you too 🙂
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

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Keyboard Shortcuts</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Navigation</h3>
                  <ul className="space-y-1">
                    <li><kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↑</kbd> Previous subject</li>
                    <li><kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↓</kbd> Next subject</li>
                    <li><kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">→</kbd> Expand selected (collapsed view)</li>
                    <li><kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">←</kbd> Collapse selected (collapsed view)</li>
                    <li><kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">/</kbd> Focus search</li>
                    <li><kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">⌘ + h</kbd> Home</li>
                    <li><kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">t</kbd> Jump to top subject</li>
                    <li><kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">b</kbd> Jump to bottom subject</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Actions</h3>
                  <ul className="space-y-1">
                    <li><kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">a</kbd> Add subject</li>
                    <li><kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Space</kbd> Toggle complete</li>
                    <li><kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">h</kbd> Toggle hide completed</li>
                    <li><kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">c</kbd> Toggle collapsed/full view</li>
                    <li><kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">d</kbd> Delete subject</li>
                    <li><kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Enter</kbd> Edit subject</li>
                    <li><kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">p</kbd> Toggle pin</li>
                  </ul>
                </div>
              </div>
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