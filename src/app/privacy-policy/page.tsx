import Link from 'next/link';

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
              <p>Your spaces are stored in your Google Drive account. We only access the specific folder created for Sharpr.me and do not access other files in your Drive.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Data Security</h2>
              <p>The app is served over https and uses Google Sign in to protect your data.  This makes the app as secure as your Google account.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">When you stop using the app</h2>
              <p>By just stopping using the app, we don't have any trace or data about you and your data is already in your Google Drive.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Contact Us</h2>
              <p>If you have any questions about this Privacy Policy, please contact us at <a href="mailto:digidub.ae@gmail.com">digidub.ae@gmail.com</a></p>
            </section>
          </div>

        </div>
      </div>
    </div>
  );
} 