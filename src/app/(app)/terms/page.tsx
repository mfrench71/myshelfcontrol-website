/**
 * Terms of Service Page
 * Legal terms for using the service
 */
'use client';

import Link from 'next/link';

export default function TermsPage() {
  return (
    <>
      {/* Sub-navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-14 z-30">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between min-h-[52px]">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center text-sm">
              <li className="flex items-center min-w-0">
                <Link href="/" className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-blue-400 hover:underline">
                  Home
                </Link>
              </li>
              <li className="mx-2 text-gray-400">/</li>
              <li className="text-gray-900 dark:text-gray-100 font-medium" aria-current="page">
                Terms of Service
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <article className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Terms of Service</h1>
          <p className="text-gray-500 dark:text-gray-300 text-sm mb-8">Last updated: January 2026</p>

          <div className="space-y-8 text-gray-600 dark:text-gray-300">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">1. Acceptance of Terms</h2>
              <p className="leading-relaxed">
                By accessing or using Book Assembly (&quot;the Service&quot;), you agree to be bound by these Terms of
                Service. If you do not agree to these terms, please do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">2. Description of Service</h2>
              <p className="leading-relaxed">
                Book Assembly is a personal book tracking application that allows you to catalogue your books, track
                reading progress, and organise your library. The Service is currently provided free of charge, though
                we reserve the right to introduce paid features or subscription tiers in the future.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">3. Account Terms</h2>
              <ul className="space-y-2 ml-6 list-disc leading-relaxed">
                <li>You must provide a valid email address to create an account</li>
                <li>You are responsible for maintaining the security of your account and password</li>
                <li>You are responsible for all activity that occurs under your account</li>
                <li>You must be at least 13 years old to use this Service</li>
                <li>One person may not maintain more than one account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">4. Acceptable Use</h2>
              <p className="leading-relaxed mb-3">You agree not to:</p>
              <ul className="space-y-2 ml-6 list-disc leading-relaxed">
                <li>Use the Service for any unlawful purpose</li>
                <li>Attempt to gain unauthorised access to the Service or its related systems</li>
                <li>Interfere with or disrupt the integrity or performance of the Service</li>
                <li>Use automated scripts to collect information from or interact with the Service</li>
                <li>Upload malicious code or attempt to compromise the security of the Service</li>
                <li>Impersonate another person or misrepresent your identity</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">5. Your Data</h2>
              <p className="leading-relaxed mb-3">
                You retain ownership of all data you enter into the Service, including book information, notes, and
                ratings. You grant us a limited licence to store and display this data solely for the purpose of
                providing the Service to you.
              </p>
              <p className="leading-relaxed">
                You can export or delete your data at any time. See our{' '}
                <Link href="/privacy" className="text-primary dark:text-blue-400 hover:underline">
                  Privacy Policy
                </Link>{' '}
                for details on how we handle your data.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">6. Intellectual Property</h2>
              <p className="leading-relaxed">
                The Service, including its original content, features, and functionality, is owned by Book Assembly
                and is protected by copyright, trademark, and other intellectual property laws. Book metadata and
                cover images are sourced from third-party APIs and remain the property of their respective owners.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">7. Third-Party Services</h2>
              <p className="leading-relaxed">
                The Service integrates with third-party APIs (Google Books, Open Library) to provide book
                information. We are not responsible for the availability, accuracy, or content of these external
                services.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">8. Service Availability</h2>
              <p className="leading-relaxed">
                We strive to maintain high availability but do not guarantee uninterrupted access to the Service.
                We may modify, suspend, or discontinue the Service (or any part of it) at any time, with or without
                notice. We shall not be liable to you or any third party for any modification, suspension, or
                discontinuation of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">9. Disclaimer of Warranties</h2>
              <p className="leading-relaxed">
                The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either express
                or implied, including but not limited to implied warranties of merchantability, fitness for a
                particular purpose, and non-infringement. We do not warrant that the Service will be error-free or
                that defects will be corrected.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">10. Limitation of Liability</h2>
              <p className="leading-relaxed">
                To the maximum extent permitted by law, Book Assembly shall not be liable for any indirect,
                incidental, special, consequential, or punitive damages, including but not limited to loss of data,
                profits, or goodwill, arising from your use of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">11. Account Termination</h2>
              <p className="leading-relaxed mb-3">
                You may delete your account at any time from the Settings page. We reserve the right to suspend or
                terminate your account if you violate these Terms or engage in behaviour that we reasonably believe
                is harmful to other users or the Service.
              </p>
              <p className="leading-relaxed">
                Upon termination, your right to use the Service will immediately cease. You may request a copy of
                your data before account deletion.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">12. Future Paid Services</h2>
              <p className="leading-relaxed">
                We may introduce paid features or subscription tiers in the future. Any paid services will be
                clearly identified, and you will not be charged without your explicit consent. Free features
                available at the time of your registration will remain available to you.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">13. Changes to Terms</h2>
              <p className="leading-relaxed">
                We may update these Terms from time to time. We will notify you of any material changes by posting
                the new Terms on this page and updating the &quot;Last updated&quot; date. Your continued use of the Service
                after any changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">14. Governing Law</h2>
              <p className="leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of England and Wales,
                without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">15. Contact</h2>
              <p className="leading-relaxed">
                If you have any questions about these Terms, please contact us via the{' '}
                <Link href="/support" className="text-primary dark:text-blue-400 hover:underline">
                  Support
                </Link>{' '}
                page.
              </p>
            </section>
          </div>
        </article>
      </div>
    </>
  );
}
