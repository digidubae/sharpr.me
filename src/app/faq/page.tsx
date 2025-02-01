import ExampleSpaces from '@/components/ExampleSpaces';
import Link from 'next/link';

export const metadata = {
  title: 'FAQ - Sharpr.me',
};

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Frequently Asked Questions
            </h1>
          </div>

          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">How to get started?</h2>
              <p className="text-gray-600 dark:text-gray-300">
                Simply sign in with your Google account and create your first space. 
                Once signed in, use the "Create New Space" 
                button to start organizing your knowledge.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">What is the organization paradigm of Sharpr.me?</h2>
              <p className="text-gray-600 dark:text-gray-300">
                Each space represents a distinct area 
                of your life (like work, study, or personal projects). Within each <b>space</b>, you can create <b>subjects</b> and organize them with <b>tags</b>. 
                This flexible structure allows you to manage any kind of information in a way that makes sense to you.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Can I see example spaces before I decide to sign in?</h2>
              <div className="text-gray-600 dark:text-gray-300">
                Yes! We provide several example spaces that you can explore without signing in.  <ExampleSpaces />
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">How secure is my data?</h2>
              <p className="text-gray-600 dark:text-gray-300">
                All your information is stored in your personal Google Drive account, which means you 
                maintain full control over your data. Additionally, we offer optional end-to-end encryption for an enterprise level security. When enabled, 
                <b>your data is secured even if your Google account is compromised</b> and can only be decrypted with the password you set.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Why does the app ask for Google Drive permission?</h2>
              <p className="text-gray-600 dark:text-gray-300">
                Sharpr.me uses Google Drive as its storage backend to ensure your data remains under your control. Google's permission allow us to only access a specific folder called "Sharpr.me Data" and <b>we cannot read any other data in your Google Drive</b>. 
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">How can I contribute to Sharpr.me codebase?</h2>
              <p className="text-gray-600 dark:text-gray-300">
                We welcome contributions from the community! Sharpr.me is an open-source project, and you can contribute by visiting our {' '}
                <Link href="https://github.com/sharpr-me/sharpr-me" className="text-blue-600 dark:text-blue-400 hover:underline">GitHub repository</Link>. 
                Whether it's bug fixes, feature improvements, or documentation updates, your contributions help make 
                Sharpr.me better for everyone.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">I have an issue or feedback</h2>
              <p className="text-gray-600 dark:text-gray-300">
                We value your feedback and are here to help with any issues you encounter. You can reach out to us at{' '}
                <Link href="mailto:digidub.ae@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline">
                  digidub.ae@gmail.com
                </Link>{' '}
                for any questions or concerns.
              </p>
            </section>

            <div className="text-center mt-12">
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