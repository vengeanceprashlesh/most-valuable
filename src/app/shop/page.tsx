"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const BUNDLE_COUNT = 5;

type RaffleStatus = {
  hasEnded: boolean;
  endDate: number;
  hasWinner: boolean;
  totalUniqueLeads: number;
  timeRemaining: number;
};

function useRaffleTimer() {
  const [raffleStatus, setRaffleStatus] = useState<RaffleStatus | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  
  // Fetch raffle status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/raffle/status');
        if (response.ok) {
          const data = await response.json();
          setRaffleStatus(data);
          setTimeRemaining(data.timeRemaining);
        }
      } catch (error) {
        console.error('Failed to fetch raffle status:', error);
      }
    };
    
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);
  
  // Update countdown timer
  useEffect(() => {
    if (!raffleStatus || raffleStatus.hasEnded) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, raffleStatus.endDate - now);
      setTimeRemaining(remaining);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [raffleStatus]);
  
  const formatTime = (ms: number) => {
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((ms % (60 * 1000)) / 1000);
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };
  
  const over = raffleStatus?.hasEnded || timeRemaining <= 0;
  const label = over ? 'Ended' : formatTime(timeRemaining);
  const hasWinner = raffleStatus?.hasWinner || false;
  
  return { over, label, hasWinner, participantCount: raffleStatus?.totalUniqueLeads || 0 };
}

function VariantTeaserCard({ images, title }: { images: [string, string]; title: string }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((v) => (v === 0 ? 1 : 0)), 3000);
    return () => clearInterval(t);
  }, []);

  function prev() {
    setIdx((v) => (v === 0 ? 1 : 0));
  }
  function next() {
    setIdx((v) => (v === 0 ? 1 : 0));
  }

  return (
    <div className="group relative rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 will-change-transform hover:-translate-y-1 hover:shadow-lg focus-within:shadow-lg animate-fade-up animate-delay-2">
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-slate-100">
        <div
          className={`absolute inset-0 flex h-full w-[200%] transition-transform duration-500 ease-out ${
            idx === 0 ? "-translate-x-0" : "-translate-x-1/2"
          }`}
          aria-live="polite"
        >
          <div className="relative h-full w-1/2">
            <Image
              src={images[0]}
              alt={`${title} - Image 1`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover"
              priority
            />
          </div>
          <div className="relative h-full w-1/2">
            <Image
              src={images[1]}
              alt={`${title} - Image 2`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover"
            />
          </div>
        </div>
        {/* Controls */}
        <button
          type="button"
          onClick={prev}
          aria-label="Previous image"
          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-slate-700 shadow hover:bg-white"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={next}
          aria-label="Next image"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-slate-700 shadow hover:bg-white"
        >
          ›
        </button>
        {/* Dots */}
        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${idx === 0 ? "bg-white" : "bg-white/60"}`} />
          <span className={`h-1.5 w-1.5 rounded-full ${idx === 1 ? "bg-white" : "bg-white/60"}`} />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">{title}</h3>
          <p className="text-sm text-slate-500">Teaser</p>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs uppercase tracking-wide text-slate-600">
          Sold out
        </span>
      </div>
    </div>
  );
}

async function createCheckout(quantity: number) {
  const email = typeof window !== "undefined" ? localStorage.getItem("mv_email") || "" : "";
  const phone = typeof window !== "undefined" ? localStorage.getItem("mv_phone") || "" : "";

  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quantity, email, phone }),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Failed to create checkout session");
  }
  const data = await res.json();
  if (data.url) {
    window.location.href = data.url;
  }
}

export default function ShopPage() {
  const { over, label, hasWinner, participantCount } = useRaffleTimer();
  const [confirmQty, setConfirmQty] = useState<number | null>(null);
  const [loadingQty, setLoadingQty] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function proceedCheckout(qty: number) {
    try {
      setErr(null);
      setLoadingQty(qty);
      await createCheckout(qty);
    } catch (e: unknown) {
      if (e instanceof Error) setErr(e.message);
      else if (typeof e === "string") setErr(e);
      else setErr("Failed to start checkout");
    } finally {
      setLoadingQty(null);
      setConfirmQty(null);
    }
  }

  return (
    <main className="relative min-h-screen text-slate-900">
      {/* Background video */}
      <video
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        src="/shopbg.mp4"
        autoPlay
        loop
        muted
        playsInline
        aria-hidden
      />

      <section className="relative z-10 mx-auto max-w-6xl px-6 py-14">
        <header className="mb-10 flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-3 animate-fade-up">
            <Link href="/" aria-label="Raffel home" className="inline-flex items-center">
              <Image
                src="/LogoWhite.png"
                alt="Raffel logo"
                width={200}
                height={56}
                className="h-14 w-auto sm:h-16 drop-shadow-[0_1px_6px_rgba(0,0,0,0.55)]"
                priority
              />
            </Link>
            <h1 className="text-3xl font-semibold tracking-tight">Most Valuable — Shop</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm animate-fade-up animate-delay-1">
              {over ? (hasWinner ? `Winner Selected! • ${participantCount} participants` : "Raffle ended") : `Raffle ends in ${label} • ${participantCount} participants`}
            </div>
            <Link
              href="/winner"
              className="rounded-full border border-white bg-white/20 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-white/30 transition animate-fade-up animate-delay-2"
            >
              {over && hasWinner ? "🏆 See Winner" : "View Raffle Status"}
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Raffle card FIRST */}
          <div className="group relative rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 will-change-transform hover:-translate-y-1 hover:shadow-lg focus-within:shadow-lg lg:col-span-1 animate-fade-up animate-delay-1">
            <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-slate-100">
              <Image
                src="/mainProduct.png"
                alt="1-of-1 Raffle Tee main product"
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition duration-500 group-hover:scale-[1.02]"
                priority
              />
            </div>
            <div className="mt-4">
              <h3 className="text-xl font-semibold">1-of-1 Raffle Tee</h3>
              <p className="mt-1 text-sm text-slate-600">Unlimited entries. Fair random draw.</p>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                onClick={() => setConfirmQty(1)}
                disabled={over}
                className="rounded-full bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-black/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingQty === 1 ? "Redirecting…" : "Buy 1 entry — $25"}
              </button>
              <button
                onClick={() => setConfirmQty(BUNDLE_COUNT)}
                disabled={over}
                className="rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingQty === BUNDLE_COUNT ? "Redirecting…" : `${BUNDLE_COUNT} entries — $100`}
              </button>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Payment handled securely by Stripe. You will receive a confirmation email.
            </p>
          </div>

          {/* Second card with MV1/MV2 slider */}
          <VariantTeaserCard images={["/mv1.png", "/mv2.png"]} title="MV Tee — Colorways" />

          {/* Third card with MVT1/MVT2 slider */}
          <VariantTeaserCard images={["/mvt1.png", "/mvt2.png"]} title="MV Tee — Alt Colorways" />

          {/* Fourth card (first in second row) with Bag1/Bag2 slider */}
          <VariantTeaserCard images={["/bagImg1.jpeg", "/bagImg2.jpeg"]} title="MV Bag — Colorways" />

          {/* Fifth card (second in second row) single image Bag2 */}
          <div className="group relative rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 will-change-transform hover:-translate-y-1 hover:shadow-lg focus-within:shadow-lg animate-fade-up animate-delay-4">
            <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-slate-100">
              <Image
                src="/Bag2.jpeg"
                alt="MV Bag — Single"
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover"
              />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">MV Bag — Single</h3>
                <p className="text-sm text-slate-500">Teaser</p>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs uppercase tracking-wide text-slate-600">
                Sold out
              </span>
            </div>
          </div>

          {/* Sixth card (third in second row) single image Member */}
          <div className="group relative rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 will-change-transform hover:-translate-y-1 hover:shadow-lg focus-within:shadow-lg animate-fade-up animate-delay-5">
            <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-slate-100">
              <Image
                src="/member.png"
                alt="Member — Single"
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover"
              />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Member — Single</h3>
                <p className="text-sm text-slate-500">Teaser</p>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs uppercase tracking-wide text-slate-600">
                Sold out
              </span>
            </div>
          </div>
        </div>

        {/* Confirm modal */}
        {confirmQty !== null && (
          <div className="fixed inset-0 z-20 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/20" aria-hidden />
            <div
              role="dialog"
              aria-modal="true"
              className="relative z-10 w-[92%] max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-black/5 animate-fade-up"
            >
              <h2 className="text-lg font-semibold">Proceed to checkout?</h2>
              <p className="mt-1 text-sm text-slate-600">
                {confirmQty === 1 ? "You’re buying 1 raffle entry for $25." : `You’re buying ${confirmQty} entries for $100.`}
              </p>
              {err && (
                <p className="mt-2 text-sm text-red-600" role="alert">{err}</p>
              )}
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  onClick={() => setConfirmQty(null)}
                  className="rounded-full border border-slate-300 px-5 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => proceedCheckout(confirmQty)}
                  className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white hover:bg-black/90"
                >
                  {loadingQty ? "Redirecting…" : "Continue"}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
