"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "../../convex/_generated/api";

export default function Home() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAlreadySubscribed, setShowAlreadySubscribed] = useState(false);
  const [isNewUser, setIsNewUser] = useState(true);
  const [redirectCountdown, setRedirectCountdown] = useState(0);
  const [showEmailForm, setShowEmailForm] = useState(false);

  const router = useRouter();
  const addLead = useMutation(api.leads.addLead);

  // Countdown timer effect for redirect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if ((showSuccess || showAlreadySubscribed) && redirectCountdown > 0) {
      interval = setInterval(() => {
        setRedirectCountdown(prev => prev - 1);
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [showSuccess, showAlreadySubscribed, redirectCountdown]);

  // Separate effect to handle redirect when countdown reaches 0
  useEffect(() => {
    if ((showSuccess || showAlreadySubscribed) && redirectCountdown === 0) {
      const timeoutId = setTimeout(() => {
        router.push('/shop');
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [showSuccess, showAlreadySubscribed, redirectCountdown, router]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      alert('Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      alert('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 15000)
      );

      const leadPromise = addLead({
        email: trimmedEmail.toLowerCase(),
        source: "landing_page"
      });

      const result = await Promise.race([leadPromise, timeoutPromise]) as {
        isNewLead: boolean;
        alreadyHasFreeEntry: boolean;
        leadId: string;
      };

      if (result.isNewLead) {
        setIsNewUser(true);
        setShowSuccess(true);
      } else {
        setIsNewUser(false);
        if (result.alreadyHasFreeEntry) {
          setShowAlreadySubscribed(true);
        } else {
          setShowSuccess(true);
        }
      }

      setEmail("");
      setRedirectCountdown(4);

    } catch (error) {
      console.error("Failed to add lead:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      {/* Full-bleed background video */}
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src="/IMG_7627.mp4"
        autoPlay
        loop
        muted
        playsInline
        aria-hidden
      />

      {/* Cinematic gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />

      {/* Minimal Header */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 sm:px-10 py-6">
        <nav className="flex items-center gap-8">
          <Link href="/shop" className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-white/60 hover:text-white transition-colors duration-300">
            Shop
          </Link>
        </nav>
        <nav className="flex items-center gap-6 sm:gap-8">
          <Link href="/shop" className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-white/60 hover:text-white transition-colors duration-300">
            Collection
          </Link>
          <button
            onClick={() => setShowEmailForm(true)}
            className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-white/60 hover:text-white transition-colors duration-300"
          >
            Join
          </button>
        </nav>
      </header>

      {/* Massive Brand Typography - Alaïa style */}
      <div className="absolute inset-0 z-10 flex items-end justify-center pb-16 sm:pb-24">
        <div className="text-center px-4">
          {/* Super large brand name */}
          <h1 className="text-[15vw] sm:text-[12vw] md:text-[10vw] font-extralight tracking-[-0.02em] text-white leading-[0.85] select-none">
            MOST
            <br />
            <span className="font-light">VALUABLE</span>
          </h1>

          {/* Subtle tagline */}
          <p className="mt-6 sm:mt-8 text-[10px] sm:text-xs uppercase tracking-[0.5em] text-white/40 font-light">
            Gold Infused Streetwear
          </p>

          {/* CTA Button */}
          <div className="mt-10 sm:mt-12">
            <Link
              href="/shop"
              className="inline-block border border-white/30 text-white px-10 sm:px-14 py-4 text-[10px] sm:text-xs uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all duration-500"
            >
              Enter Shop
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
        <div className="w-px h-12 bg-gradient-to-b from-white/0 via-white/40 to-white/0 animate-pulse" />
      </div>

      {/* Email Modal Overlay */}
      {showEmailForm && !showSuccess && !showAlreadySubscribed && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center px-6"
          onClick={() => setShowEmailForm(false)}
        >
          <div
            className="w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-center mb-10">
              <p className="text-[10px] uppercase tracking-[0.4em] text-white/40 mb-4">Exclusive Access</p>
              <h2 className="text-3xl sm:text-4xl font-extralight tracking-tight text-white">
                Join The<br />Movement
              </h2>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full bg-transparent border border-white/20 px-6 py-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/50 transition-colors text-center tracking-wider"
                required
                suppressHydrationWarning
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-white text-black py-4 text-[10px] uppercase tracking-[0.3em] hover:bg-white/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                suppressHydrationWarning
              >
                {isSubmitting ? "Joining..." : "Get Early Access"}
              </button>
            </form>

            <p className="mt-6 text-[10px] text-white/30 text-center tracking-wide leading-relaxed">
              By subscribing, you agree to receive updates.{" "}
              <Link href="/privacy" className="underline hover:text-white/50 transition-colors">
                Privacy Policy
              </Link>
            </p>

            <button
              onClick={() => setShowEmailForm(false)}
              className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center px-6">
          <div className="w-full max-w-md text-center">
            <div className="w-16 h-16 mx-auto mb-8 rounded-full border border-white/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-white/40 mb-4">Welcome</p>
            <h2 className="text-3xl sm:text-4xl font-extralight tracking-tight text-white mb-4">
              You&apos;re In
            </h2>
            <p className="text-white/50 text-sm mb-8">
              {isNewUser ? 'Free raffle entry added to your account.' : 'Welcome back to Most Valuable.'}
            </p>

            {redirectCountdown > 0 && (
              <div className="space-y-4">
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
                  Redirecting to shop in {redirectCountdown}s
                </p>
                <button
                  onClick={() => {
                    setRedirectCountdown(0);
                    setShowSuccess(false);
                  }}
                  className="text-[10px] uppercase tracking-[0.2em] text-white/40 hover:text-white underline transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Already Subscribed Modal */}
      {showAlreadySubscribed && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center px-6">
          <div className="w-full max-w-md text-center">
            <div className="w-16 h-16 mx-auto mb-8 rounded-full border border-white/20 flex items-center justify-center">
              <span className="text-2xl">👋</span>
            </div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-white/40 mb-4">Welcome Back</p>
            <h2 className="text-3xl sm:text-4xl font-extralight tracking-tight text-white mb-4">
              Already A Member
            </h2>
            <p className="text-white/50 text-sm mb-4">
              You already have your free raffle entry.
            </p>
            <p className="text-white/40 text-xs mb-8">
              Want more chances? Purchase entries for <span className="text-white">$50 each</span> in the shop.
            </p>

            {redirectCountdown > 0 && (
              <div className="space-y-4">
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
                  Redirecting to shop in {redirectCountdown}s
                </p>
                <button
                  onClick={() => {
                    setRedirectCountdown(0);
                    setShowAlreadySubscribed(false);
                  }}
                  className="text-[10px] uppercase tracking-[0.2em] text-white/40 hover:text-white underline transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Minimal Footer */}
      <footer className="absolute bottom-0 left-0 right-0 z-10 px-6 sm:px-10 py-6 flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">
          © 2025 Most Valuable
        </p>
        <div className="flex items-center gap-6">
          <Link href="/privacy" className="text-[10px] uppercase tracking-[0.2em] text-white/30 hover:text-white/60 transition-colors">
            Privacy
          </Link>
          <Link href="/terms" className="text-[10px] uppercase tracking-[0.2em] text-white/30 hover:text-white/60 transition-colors">
            Terms
          </Link>
        </div>
      </footer>
    </div>
  );
}
