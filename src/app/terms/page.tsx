import Link from "next/link";
export const dynamic = "force-static";

export default function TermsPage() {
  return (
    <main className="relative min-h-screen bg-white text-slate-900">
      <section className="mx-auto max-w-3xl px-6 py-12">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
          <p className="mt-1 text-sm text-slate-500">Effective date: {new Date().getFullYear()} | Last updated: {new Date().toLocaleDateString()}</p>
        </header>

        <nav className="mb-8 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
          <p className="mb-2 font-medium">Contents</p>
          <ul className="grid list-disc grid-cols-1 gap-2 pl-5 sm:grid-cols-2">
            <li><a className="text-slate-700 underline" href="#acceptance">Acceptance of terms</a></li>
            <li><a className="text-slate-700 underline" href="#eligibility">Eligibility</a></li>
            <li><a className="text-slate-700 underline" href="#accounts">Accounts & security</a></li>
            <li><a className="text-slate-700 underline" href="#purchases">Purchases & raffles</a></li>
            <li><a className="text-slate-700 underline" href="#pricing">Pricing, taxes & shipping</a></li>
            <li><a className="text-slate-700 underline" href="#returns">Returns & cancellations</a></li>
            <li><a className="text-slate-700 underline" href="#conduct">Acceptable use</a></li>
            <li><a className="text-slate-700 underline" href="#ip">Intellectual property</a></li>
            <li><a className="text-slate-700 underline" href="#sms">SMS program terms</a></li>
            <li><a className="text-slate-700 underline" href="#warranties">Disclaimers</a></li>
            <li><a className="text-slate-700 underline" href="#liability">Limitation of liability</a></li>
            <li><a className="text-slate-700 underline" href="#law">Governing law</a></li>
            <li><a className="text-slate-700 underline" href="#changes">Changes</a></li>
            <li><a className="text-slate-700 underline" href="#contact">Contact</a></li>
          </ul>
        </nav>

        <article className="prose prose-slate max-w-none">
          <h2 id="acceptance">1. Acceptance of terms</h2>
          <p>
            These Terms of Service (&quot;Terms&quot;) govern your access to and use of the Raffel website and services
            (collectively, the &quot;Services&quot;). By accessing or using the Services, you agree to be bound by these
            Terms and our <Link className="underline" href="/privacy">Privacy Policy</Link>.
          </p>

          <h2 id="eligibility">2. Eligibility</h2>
          <p>
            You must be at least the age of majority in your jurisdiction to make a purchase. By using the Services,
            you represent and warrant that you meet this requirement and that you have the legal capacity to enter into these Terms.
          </p>

          <h2 id="accounts">3. Accounts & security</h2>
          <p>
            You may be required to provide information (e.g., email and phone) to participate in raffles, make purchases, or
            receive updates. You are responsible for maintaining the accuracy of this information and for all activity that occurs
            under your account or device.
          </p>

          <h2 id="purchases">4. Purchases, raffles, and availability</h2>
          <ul>
            <li>All orders are subject to availability and our acceptance.</li>
            <li>We may limit quantities or refuse service to anyone at our discretion.</li>
            <li>Raffle entries are non-refundable except as required by applicable law.</li>
            <li>Winners are selected at random and notified using the contact details provided.</li>
            <li>We reserve the right to verify eligibility and compliance with raffle rules.</li>
          </ul>

          <h2 id="pricing">5. Pricing, taxes, and shipping</h2>
          <p>
            Prices are displayed in U.S. dollars unless stated otherwise and are subject to change without notice.
            Applicable taxes and shipping fees are calculated at checkout based on your delivery address. International shipments may be subject to import duties, customs, and fees imposed by the destination country; you are responsible for these charges.
          </p>

          <h2 id="returns">6. Returns, cancellations, and risk of loss</h2>
          <ul>
            <li>We will provide return, exchange, or cancellation options consistent with our posted policies at checkout.</li>
            <li>Risk of loss passes to you upon our delivery of products to the carrier.</li>
          </ul>

          <h2 id="conduct">7. Acceptable use</h2>
          <ul>
            <li>Do not misuse the Services, attempt unauthorized access, or interfere with normal operations.</li>
            <li>Do not use automated means to obtain entries or advantages in any raffle.</li>
            <li>Do not upload unlawful, infringing, or harmful content.</li>
          </ul>

          <h2 id="ip">8. Intellectual property</h2>
          <p>
            All content, trademarks, logos, and designs on the Services are owned by Raffel or our licensors and are protected by
            intellectual property laws. You may not use our IP without prior written permission.
          </p>

          <h2 id="sms">9. SMS program terms</h2>
          <p>
            By enrolling in our text messaging program, you agree to receive recurring automated promotional and personalized
            marketing text messages (e.g., cart reminders) at the phone number you provide. Consent is not a condition of purchase.
            Message and data rates may apply. Message frequency varies. Reply HELP for help and STOP to cancel.
          </p>

          <h2 id="warranties">10. Disclaimers</h2>
          <p>
            THE SERVICES ARE PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
            MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. We do not warrant that the Services will be
            uninterrupted, secure, or error-free.
          </p>

          <h2 id="liability">11. Limitation of liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, RAFFEL AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS WILL NOT BE LIABLE
            FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES,
            ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICES.
          </p>

          <h2 id="law">12. Governing law & jurisdiction</h2>
          <p>
            These Terms are governed by the laws of the State of California, U.S.A., without regard to conflict of laws principles.
            You agree to the exclusive jurisdiction of the state and federal courts located in California for the resolution of any dispute.
          </p>

          <h2 id="changes">13. Changes to these Terms</h2>
          <p>
            We may update these Terms from time to time. The updated version will be indicated by an updated &quot;Last updated&quot; date and
            will be effective as soon as it is accessible. Your continued use of the Services constitutes acceptance of the changes.
          </p>

          <h2 id="contact">14. Contact</h2>
          <p>
            Questions about these Terms? Contact us at <a className="underline" href="mailto:support@raffel.example">support@raffel.example</a>.
          </p>
        </article>

        <div className="mt-10">
          <Link href="/" className="rounded-full border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">Back to home</Link>
        </div>
      </section>
    </main>
  );
}
