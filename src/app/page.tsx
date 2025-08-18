"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  // Phone input state with country selector
  const [country, setCountry] = useState("US");
  const countryOptions = useMemo(
    () => [
      { code: "US", name: "United States", dial: "+1", flag: "🇺🇸" },
      { code: "GB", name: "United Kingdom", dial: "+44", flag: "🇬🇧" },
      { code: "CA", name: "Canada", dial: "+1", flag: "🇨🇦" },
      { code: "AU", name: "Australia", dial: "+61", flag: "🇦🇺" },
      { code: "IN", name: "India", dial: "+91", flag: "🇮🇳" },
      { code: "DE", name: "Germany", dial: "+49", flag: "🇩🇪" },
      { code: "FR", name: "France", dial: "+33", flag: "🇫🇷" },
      { code: "AE", name: "United Arab Emirates", dial: "+971", flag: "🇦🇪" },
      { code: "SA", name: "Saudi Arabia", dial: "+966", flag: "🇸🇦" },
      { code: "SG", name: "Singapore", dial: "+65", flag: "🇸🇬" },
    ],
    []
  );
  const [nationalNumber, setNationalNumber] = useState("");
  const dialCode = useMemo(() => countryOptions.find((c) => c.code === country)?.dial ?? "+1", [country, countryOptions]);
  const fullPhone = useMemo(() => `${dialCode}${nationalNumber.replace(/\D/g, "")}`, [dialCode, nationalNumber]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email.");
      return;
    }
    
    // Basic phone validation: require at least country code + 6 digits
    const digits = nationalNumber.replace(/\D/g, "");
    if (!digits || digits.length < 6) {
      setError("Please enter a valid phone number.");
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('Submitting:', { email, phone: fullPhone }); // Debug log
      
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone: fullPhone }),
      });
      
      const data = await res.json();
      console.log('Response:', data); // Debug log
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to subscribe");
      }
      
      if (data.ok) {
        setSuccess(true);
        
        // Store in localStorage
        try {
          localStorage.setItem("mv_email", email);
          localStorage.setItem("mv_phone", fullPhone);
        } catch (e) {
          console.warn('Failed to store in localStorage:', e);
        }
        
        // Show success message briefly before redirecting
        setTimeout(() => {
          router.push("/shop");
        }, 2000);
      } else {
        throw new Error(data.error || "Subscription failed");
      }
      
    } catch (err) {
      console.error('Subscription error:', err);
      const errorMessage = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden text-slate-900">
      {/* Brand logo overlay (white) */}
      <Link
        href="/"
        className="absolute left-4 top-4 z-20 inline-flex items-center rounded-md"
        aria-label="Raffel home"
      >
        <Image
          src="/LogoWhite.png"
          alt="Raffel logo"
          width={180}
          height={48}
          className="h-12 w-auto sm:h-14 drop-shadow-[0_1px_6px_rgba(0,0,0,0.55)]"
          priority
        />
      </Link>
      {/* Background video */}
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src="/background.mp4"
        autoPlay
        loop
        muted
        playsInline
        aria-hidden
      />

      {/* No overlay to keep background video crisp */}

      {/* Content */}
      <main className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6">
        <div className="w-full max-w-md rounded-2xl bg-white/90 p-6 shadow-xl ring-1 ring-black/5 backdrop-blur">
          <div className="mb-6 flex w-full justify-center">
            <Image
              src="/logoBlack.png"
              alt="Raffel logo"
              width={56}
              height={56}
              className="h-14 w-14 rounded-md shadow-sm"
              priority
            />
          </div>
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl uppercase">
              Enter Free Raffle
            </h1>
            <p className="mt-2 text-slate-600">
              Join our free raffle! Winner will be selected automatically after 22 days.
            </p>
          </div>

          <form onSubmit={onSubmit} className="group">
            <label htmlFor="email" className="sr-only">
              Email
            </label>
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-full border border-slate-300 bg-white px-5 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:border-slate-400"
              required
              aria-invalid={!!error}
            />
            <label htmlFor="phone" className="sr-only">
              Phone
            </label>
            <div className="mt-3 flex w-full items-center rounded-full border border-slate-300 bg-white px-3 py-2 shadow-sm focus-within:border-slate-400">
              <div className="relative w-16 min-w-[4rem]">
                <select
                  aria-label="Country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="h-10 w-full appearance-none rounded-full bg-transparent pl-7 pr-5 text-sm outline-none truncate"
                >
                  {countryOptions.map((c) => (
                    <option key={c.code} value={c.code} title={`${c.name} (${c.code})`}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute left-1.5 top-1/2 -translate-y-1/2 text-lg">
                  {countryOptions.find((c) => c.code === country)?.flag}
                </span>
              </div>
              <div className="mx-2 h-6 w-px bg-slate-200" aria-hidden />
              <div className="flex-1">
                <div className="flex items-center">
                  <span className="select-none pr-2 text-slate-500">{dialCode}</span>
                  <input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="Phone number"
                    value={nationalNumber}
                    onChange={(e) => setNationalNumber(e.target.value.replace(/[^0-9\s-]/g, ""))}
                    className="w-full bg-transparent py-1.5 text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    required
                    aria-invalid={!!error}
                  />
                </div>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-75"
            >
              {loading ? "Submitting…" : "Subscribe"}
            </button>
            {success && (
              <p className="mt-2 text-sm text-green-600" role="alert">
                🎉 Successfully subscribed to the raffle! Redirecting to shop...
              </p>
            )}
            {error && (
              <p className="mt-2 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            <p className="mt-3 text-[11px] leading-relaxed text-slate-600">
              By submitting this form and signing up for texts, you consent to receive marketing text messages (e.g., promos, cart reminders) from Raffel at the number provided, including messages sent by autodialer. Consent is not a condition of any purchase. Msg & data rates may apply. Msg frequency varies. Reply HELP for help and STOP to cancel. View our <Link href="/terms" className="underline">Terms</Link> & <Link href="/privacy" className="underline">Privacy</Link>.
            </p>
            <div className="mt-5 flex items-center justify-center">
              <button
                type="button"
                onClick={() => router.push("/shop")}
                className="rounded-full border border-slate-300 px-5 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-50"
              >
                Shop Now
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Minimal footer */}
      <footer className="pointer-events-none absolute inset-x-0 bottom-0 z-10 hidden justify-center p-6 text-xs text-slate-500 sm:flex">
        © {new Date().getFullYear()} Raffel. All rights reserved.
      </footer>
    </div>
  );
}
