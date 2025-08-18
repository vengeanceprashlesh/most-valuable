import Link from "next/link";
export const dynamic = "force-static";

export default function PrivacyPage() {
  return (
    <main className="relative min-h-screen bg-white text-slate-900">
      <section className="mx-auto max-w-3xl px-6 py-12">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="mt-1 text-sm text-slate-500">Effective date: {new Date().getFullYear()} | Last updated: {new Date().toLocaleDateString()}</p>
        </header>

        <nav className="mb-8 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
          <p className="mb-2 font-medium">Contents</p>
          <ul className="grid list-disc grid-cols-1 gap-2 pl-5 sm:grid-cols-2">
            <li><a className="text-slate-700 underline" href="#scope">Scope</a></li>
            <li><a className="text-slate-700 underline" href="#info">Information we collect</a></li>
            <li><a className="text-slate-700 underline" href="#sources">Sources of information</a></li>
            <li><a className="text-slate-700 underline" href="#use">How we use information</a></li>
            <li><a className="text-slate-700 underline" href="#sharing">How we share information</a></li>
            <li><a className="text-slate-700 underline" href="#ads">Marketing & SMS</a></li>
            <li><a className="text-slate-700 underline" href="#cookies">Cookies & tracking</a></li>
            <li><a className="text-slate-700 underline" href="#security">Data security</a></li>
            <li><a className="text-slate-700 underline" href="#retention">Data retention</a></li>
            <li><a className="text-slate-700 underline" href="#rights">Your rights (GDPR/CCPA/CPRA)</a></li>
            <li><a className="text-slate-700 underline" href="#children">Children&#39;s privacy</a></li>
            <li><a className="text-slate-700 underline" href="#intl">International transfers</a></li>
            <li><a className="text-slate-700 underline" href="#changes">Changes to this policy</a></li>
            <li><a className="text-slate-700 underline" href="#contact">Contact us</a></li>
          </ul>
        </nav>

        <article className="prose prose-slate max-w-none">
          <h2 id="scope">1. Scope</h2>
          <p>
            This Privacy Policy describes how Raffel (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects, uses, discloses, and protects your
            information when you visit our website, make purchases, participate in raffles, or communicate with us. This policy
            applies to visitors and customers located in the United States and internationally.
          </p>

          <h2 id="info">2. Information we collect</h2>
          <ul>
            <li><strong>Contact information</strong>: name, email address, phone number, shipping/billing address.</li>
            <li><strong>Order information</strong>: items purchased, raffle entries, transaction amounts, and delivery details.</li>
            <li><strong>Device/usage data</strong>: IP address, browser type, pages visited, and interactions with our site.</li>
            <li><strong>Marketing preferences</strong>: opt-ins/opt-outs for email and SMS.
            </li>
          </ul>

          <h2 id="sources">3. Sources of information</h2>
          <p>
            We collect information directly from you (e.g., forms, checkout), automatically via cookies and similar technologies,
            and from service providers (e.g., payment processors, analytics partners, and fulfillment partners).
          </p>

          <h2 id="use">4. How we use information</h2>
          <ul>
            <li>Provide, operate, and improve our website, raffles, and services.</li>
            <li>Process orders and payments; arrange shipping and delivery.</li>
            <li>Communicate with you about your account, orders, and promotions.</li>
            <li>Prevent fraud, enforce our <Link href="/terms" className="underline">Terms</Link>, and comply with law.</li>
            <li>Personalize your experience and measure the effectiveness of campaigns.</li>
          </ul>

          <h2 id="sharing">5. How we share information</h2>
          <p>
            We may share information with trusted service providers who perform services on our behalf (e.g., payment processing,
            cloud hosting, analytics, email/SMS delivery, fulfillment). We require these providers to use your information only to
            provide services to us and to protect it appropriately. We may also share information to comply with law, respond to
            legal requests, or protect our rights.
          </p>

          <h2 id="ads">6. Marketing & SMS</h2>
          <p>
            If you opt in, we may send you marketing emails and/or text messages. By signing up for texts, you agree to receive
            recurring automated promotional and personalized marketing messages at the phone number used to sign up. Consent is
            not a condition of any purchase. Message & data rates may apply. Message frequency varies. Reply HELP for help and
            STOP to cancel.
          </p>

          <h2 id="cookies">7. Cookies & tracking</h2>
          <p>
            We use cookies and similar technologies to operate the site, analyze traffic, remember preferences, and measure
            marketing performance. You can control cookies through your browser settings and certain industry opt-out tools.
          </p>

          <h2 id="security">8. Data security</h2>
          <p>
            We implement reasonable technical and organizational measures to protect your information. However, no method of
            transmission over the Internet or method of electronic storage is 100% secure, and we cannot guarantee absolute security.
          </p>

          <h2 id="retention">9. Data retention</h2>
          <p>
            We retain information for as long as necessary to fulfill the purposes outlined in this policy, to comply with our
            legal obligations, resolve disputes, and enforce our agreements.
          </p>

          <h2 id="rights">10. Your rights (GDPR/CCPA/CPRA)</h2>
          <p>
            Depending on your jurisdiction, you may have rights regarding your personal information, including the right to access,
            correct, delete, or restrict processing, as well as the right to opt out of certain data sharing or sales. To exercise
            these rights, contact us at the email below. We will not discriminate against you for exercising your rights.
          </p>

          <h2 id="children">11. Children&#39;s privacy</h2>
          <p>
            Our Services are not directed to children under 13 (or under 16 in the EU). We do not knowingly collect personal
            information from children. If we learn that we have collected such information, we will delete it.
          </p>

          <h2 id="intl">12. International data transfers</h2>
          <p>
            If you are located outside the United States, your information may be transferred to and processed in the U.S. or other
            countries where our service providers are located. These locations may have data protection laws different from your
            jurisdiction. Where required, we use appropriate safeguards for such transfers.
          </p>

          <h2 id="changes">13. Changes to this policy</h2>
          <p>
            We may update this Privacy Policy from time to time. The updated version will be indicated by an updated &quot;Last updated&quot;
            date and will be effective as soon as it is accessible. Your continued use of the Services constitutes acceptance of the changes.
          </p>

          <h2 id="contact">14. Contact us</h2>
          <p>
            Questions or requests regarding this policy can be sent to
            <a className="underline" href="mailto:privacy@raffel.example"> privacy@raffel.example</a>.
          </p>
        </article>

        <div className="mt-10">
          <Link href="/" className="rounded-full border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">Back to home</Link>
        </div>
      </section>
    </main>
  );
}
