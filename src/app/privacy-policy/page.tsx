import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy - Sharpr.me',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Privacy Policy
            </h1>
          </div>

          <div className="prose dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Information We Collect</h2>
              <p>When you use Sharpr.me, we do NOT collect ANY information about your account, data or usage.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Data Storage</h2>
              <p>Your spaces are stored in your Google Drive account. We only access the specific folder created for Sharpr.me and do can NOT access other files in your Drive.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Data Security</h2>
              <p>The app is served over https and uses Google Sign in to protect your data.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">When you stop using the app</h2>
              <p>When you stop using the app, we don't have any trace or data about you and your data is already in your Google Drive.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Contact Us</h2>
              <p>If you have any questions about this Privacy Policy, please contact us at <a href="mailto:digidub.ae@gmail.com">digidub.ae@gmail.com</a></p>
            </section>
          </div>
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
  );
} 