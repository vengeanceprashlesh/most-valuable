import Link from "next/link";

export default function ThankYouPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="mx-auto w-full max-w-lg px-6 text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          You&#39;re in.
        </h1>
        <p className="mt-4 text-white/80">
          Thanks for joining our waitlist. We&#39;ll be in touch soon with early access.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-white px-5 py-2 text-sm font-medium text-black transition hover:bg-white/90"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
