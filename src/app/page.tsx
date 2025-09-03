"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import Image from "next/image";
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
      }, 100); // Small delay to ensure state updates are complete
      
      return () => clearTimeout(timeoutId);
    }
  }, [showSuccess, showAlreadySubscribed, redirectCountdown, router]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submissions
    if (isSubmitting) return;
    
    // Basic validation
    const trimmedEmail = email.trim();
    
    if (!trimmedEmail) {
      alert('Please enter your email address.');
      return;
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      alert('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Add timeout to prevent hanging
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
      
      // Handle different scenarios based on response
      if (result.isNewLead) {
        // New user - they got a free entry
        setIsNewUser(true);
        setShowSuccess(true);
      } else {
        // Existing user
        setIsNewUser(false);
        if (result.alreadyHasFreeEntry) {
          // Already has free entry - show different message
          setShowAlreadySubscribed(true);
        } else {
          // Shouldn't happen, but handle gracefully
          setShowSuccess(true);
        }
      }
      
      setEmail("");
      
      // Start countdown timer (4 seconds)
      setRedirectCountdown(4);
      
    } catch (error) {
      console.error("Failed to add lead:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShopNow = () => {
    window.location.href = "/shop";
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background video */}
      <video
        className="absolute inset-0 h-full w-full object-cover scale-[1.45] object-[15%_10%] sm:scale-100 sm:object-center"
        src="/IMG_7627.mp4"
        autoPlay
        loop
        muted
        playsInline
        aria-hidden
      />

      {/* Removed dark overlay to keep background clear */}

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-4">
        <Image src="/LogoWhite.png" alt="Most Valuable" width={120} height={34} className="h-8 w-auto" priority />
        <nav className="hidden sm:flex items-center space-x-4 text-white/80 text-sm">
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
        </nav>
      </header>

      {/* Main content - centered */}
      <main className="relative z-10 flex items-center justify-center min-h-screen px-6">
        <div className="w-full max-w-md">
          {/* Centered card - completely transparent on mobile, visible on desktop */}
          <div className="bg-transparent border-transparent rounded-2xl p-8">
            {/* Logo */}
            <div className="text-center mb-6">
              <Image 
                src="/LogoWhite.png" 
                alt="Most Valuable" 
                width={640} 
                height={180} 
                className="mx-auto h-40 w-auto sm:h-48" 
              />
            </div>

            {/* Removed tagline and highlight to keep a clean hero with large MV logo */}

            {/* Form */}
            {!showSuccess && !showAlreadySubscribed ? (
              <>
                {/* Title */}
                <div className="text-center mb-6">
                  <h2 className="text-white text-lg sm:text-2xl font-bold tracking-wide uppercase whitespace-nowrap">
                    Sign Up for Exclusive Access
                  </h2>
                </div>
                
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-white text-black px-6 py-3 rounded-xl font-semibold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Adding..." : "Subscribe"}
                  </button>
                </form>
                
                {/* Subscription disclaimer */}
                <div className="mt-4 text-center">
                  <p className="text-white text-xs leading-relaxed">
                    By submitting this form, you consent to receive marketing emails (e.g., promos, cart reminders, collection updates) at the email provided. Consent is not a condition of purchase. Unsubscribe anytime using the unsubscribe link.{" "}
                    <Link href="/privacy" className="underline hover:text-white/80 transition-colors">
                      Privacy Policy
                    </Link>
                    {" & "}
                    <Link href="/terms" className="underline hover:text-white/80 transition-colors">
                      Terms
                    </Link>
                    .
                  </p>
                </div>
              </>
            ) : showSuccess ? (
              <div className="text-center p-6 bg-green-500/20 backdrop-blur border border-green-400/50 rounded-xl mb-4">
                <div className="text-green-400 font-semibold text-lg mb-2">✅ You&apos;re In The Raffle!</div>
                <p className="text-white/90 text-sm mb-2">You&apos;ve been successfully added to our waitlist!</p>
                <div className="bg-white/10 rounded-lg p-2 mb-3">
                  <p className="text-yellow-300 text-sm font-medium">
                    🎫 {isNewUser ? 'Free Entry Added!' : 'Already In The Raffle!'}
                  </p>
                  <p className="text-white/80 text-xs">
                    {isNewUser ? 'You now have 1 raffle entry' : 'You already have your free raffle entry'}
                  </p>
                </div>
                {redirectCountdown > 0 && (
                  <div className="bg-white/10 rounded-lg p-3 border border-white/20">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                      <span className="text-white/80 text-sm">Taking you to shop...</span>
                    </div>
                    <div className="text-white font-mono text-xl">
                      {redirectCountdown}
                    </div>
                    <div className="text-white/60 text-xs mt-1 mb-2">
                      Redirecting in {redirectCountdown} second{redirectCountdown !== 1 ? 's' : ''}
                    </div>
                    <button
                      onClick={() => {
                        setRedirectCountdown(0);
                        setShowSuccess(false);
                      }}
                      className="text-xs text-white/60 hover:text-white underline transition-colors"
                    >
                      Cancel redirect
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-6 bg-blue-500/20 backdrop-blur border border-blue-400/50 rounded-xl mb-4">
                <div className="text-blue-400 font-semibold text-lg mb-2">👋 Welcome Back!</div>
                <p className="text-white/90 text-sm mb-2">You&apos;re already subscribed to our waitlist!</p>
                <div className="bg-white/10 rounded-lg p-2 mb-3">
                  <p className="text-yellow-300 text-sm font-medium">
                    🎫 You Already Have Your Free Entry!
                  </p>
                  <p className="text-white/80 text-xs">
                    Only one free entry per email is allowed
                  </p>
                </div>
                <div className="bg-white/10 rounded-lg p-3 border border-white/20">
                  <p className="text-white/90 text-sm mb-2">
                    💡 Want more chances to win?
                  </p>
                  <p className="text-white/80 text-xs">
                    Purchase additional entries for <span className="text-green-300 font-semibold">$50 each</span> in our shop!
                  </p>
                </div>
                {redirectCountdown > 0 && (
                  <div className="bg-white/10 rounded-lg p-3 border border-white/20 mt-3">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                      <span className="text-white/80 text-sm">Taking you to shop...</span>
                    </div>
                    <div className="text-white font-mono text-xl">
                      {redirectCountdown}
                    </div>
                    <div className="text-white/60 text-xs mt-1 mb-2">
                      Redirecting in {redirectCountdown} second{redirectCountdown !== 1 ? 's' : ''}
                    </div>
                    <button
                      onClick={() => {
                        setRedirectCountdown(0);
                        setShowAlreadySubscribed(false);
                      }}
                      className="text-xs text-white/60 hover:text-white underline transition-colors"
                    >
                      Cancel redirect
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Shop button */}
            <div className="mt-6">
              <button
                onClick={handleShopNow}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-[1.02] shadow-lg"
              >
                Shop Now
              </button>
            </div>

            {/* Trust indicators removed as requested */}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 z-10 p-4 text-center text-white/50 text-xs">
        <p>© 2025 Most Valuable. All rights reserved.</p>
      </footer>
    </div>
  );
}
