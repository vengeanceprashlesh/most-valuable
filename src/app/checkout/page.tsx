"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
// import PhoneInput from 'react-phone-number-input';
// import 'react-phone-number-input/style.css';
// import '../../styles/phone-input.css';
// import type { Value } from 'react-phone-number-input';

function CheckoutPageContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  
  // Product selection states
  const [productId, setProductId] = useState<string>("");
  const [variantId, setVariantId] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");

  useEffect(() => {
    const qtyParam = searchParams.get("quantity");
    if (qtyParam) {
      const parsedQty = parseInt(qtyParam, 10);
      if (!isNaN(parsedQty) && parsedQty > 0) {
        setQuantity(parsedQty);
      }
    }
    
    // Capture product selection parameters
    const productIdParam = searchParams.get("productId");
    const variantIdParam = searchParams.get("variantId");
    const colorParam = searchParams.get("color");
    const sizeParam = searchParams.get("size");
    
    if (productIdParam) setProductId(productIdParam);
    if (variantIdParam) setVariantId(variantIdParam);
    if (colorParam) setSelectedColor(colorParam);
    if (sizeParam) setSelectedSize(sizeParam);
  }, [searchParams]);

  const isBundle = quantity === 4;
  const price = isBundle ? 100 : quantity * 50;  // Matches database: $50 per entry
  const savings = isBundle ? "Save $100!" : "";

  // Email validation without state updates (pure function)
  const isEmailValid = (emailValue: string) => {
    const trimmed = emailValue.trim();
    if (!trimmed) return false;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(trimmed);
  };

  // Real-time email validation with state updates
  const validateEmailWithState = (emailValue: string) => {
    const trimmed = emailValue.trim();
    if (!trimmed) {
      setEmailError("");
      return false;
    }
    
    if (!isEmailValid(trimmed)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    
    setEmailError("");
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setError(""); // Clear general error when user starts typing
    
    // Only validate if user has typed something
    if (value.length > 0) {
      validateEmailWithState(value);
    } else {
      setEmailError("");
    }
  };

  const isFormValid = () => {
    const trimmedEmail = email.trim();
    return trimmedEmail.length > 0 && isEmailValid(trimmedEmail) && !isLoading;
  };

  async function handleCheckout(e?: React.FormEvent) {
    e?.preventDefault();
    
    console.log("🚀 Starting checkout process...");
    console.log("📧 Email:", email);
    console.log("📱 Phone:", phone);
    console.log("🔢 Quantity:", quantity);
    
    // Clear previous errors
    setError("");
    setEmailError("");

    // Validate email
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError("Email address is required");
      document.getElementById("email")?.focus();
      return;
    }

    if (!validateEmailWithState(trimmedEmail)) {
      document.getElementById("email")?.focus();
      return;
    }

    // Validate quantity
    if (!quantity || quantity <= 0) {
      setError("Invalid quantity selected");
      return;
    }

    setIsLoading(true);
    console.log("🔄 Setting loading state...");

    try {
      console.log("📡 Making API request to /api/checkout...");
      
      const requestBody = {
        quantity,
        email: trimmedEmail.toLowerCase(),
        phone: phone || undefined,
        // Product selection data
        productId: productId || undefined,
        variantId: variantId || undefined,
        selectedColor: selectedColor || undefined,
        selectedSize: selectedSize || undefined,
      };
      
      console.log("📦 Request body:", requestBody);
      
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(requestBody),
      });

      console.log("📡 Response status:", res.status);
      console.log("📡 Response ok:", res.ok);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ API Error:", errorText);
        throw new Error(errorText || `HTTP ${res.status}`);
      }

      const data = await res.json();
      console.log("✅ API Response:", data);
      
      if (data.url) {
        console.log("🔗 Redirecting to:", data.url);
        
        // Enhanced mobile redirect with fallback
        try {
          // For mobile devices, add a small delay to ensure proper rendering
          const isMobile = window.innerWidth <= 768 || /Mobi|Android/i.test(navigator.userAgent);
          
          if (isMobile) {
            console.log("📱 Mobile device detected - optimizing redirect");
            setTimeout(() => {
              window.location.href = data.url;
            }, 100);
          } else {
            window.location.href = data.url;
          }
        } catch (redirectError) {
          console.error("❌ Redirect failed:", redirectError);
          // Fallback: try to open in new window
          window.open(data.url, '_self');
        }
        
        return; // Don't reset loading state since we're redirecting
      } else {
        console.error("❌ No checkout URL in response:", data);
        throw new Error("No checkout URL received from server");
      }
    } catch (error) {
      console.error("❌ Checkout error:", error);
      
      let errorMessage = "Something went wrong. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          errorMessage = "Unable to connect to payment system. Please check your internet connection and try again.";
        } else if (error.message.includes('raffle')) {
          errorMessage = error.message;
        } else {
          errorMessage = error.message || errorMessage;
        }
      }
      
      setError(errorMessage);
      setIsLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      {/* Background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(800px at 15% 10%, rgba(255, 0, 128, 0.28), transparent 60%)," +
            "radial-gradient(700px at 85% 15%, rgba(0, 200, 255, 0.25), transparent 60%)," +
            "radial-gradient(700px at 20% 85%, rgba(255, 200, 0, 0.22), transparent 60%)," +
            "radial-gradient(900px at 90% 85%, rgba(100, 255, 150, 0.20), transparent 60%)," +
            "linear-gradient(180deg, #0b0f1a 0%, #0d0c1f 40%, #111827 100%)",
          backgroundBlendMode: "screen, screen, screen, screen, normal",
        }}
      />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/shop" className="inline-flex items-center mb-6">
              <Image
                src="/LogoWhite.png"
                alt="MV logo"
                width={200}
                height={56}
                className="h-12 w-auto"
                priority
              />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight mb-2">
              Almost There!
            </h1>
            <p className="text-slate-300 text-sm">
              Just need a few details to complete your raffle entry
            </p>
          </div>

          {/* Main Card */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
            {/* Order Summary */}
            <div className="bg-white/5 px-6 py-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">
                    {isBundle ? "4 Raffle Entries" : `${quantity} Raffle Entry${quantity > 1 ? 's' : ''}`}
                  </h3>
                  <p className="text-sm text-slate-300">
                    Most Valuable Holiday Collection
                  </p>
                  {/* Product Selection Details */}
                  {(selectedColor || selectedSize) && (
                    <div className="mt-2 space-y-1">
                      {selectedColor && (
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-slate-400">Color:</span>
                          <span className="text-xs text-white font-medium capitalize">
                            {selectedColor}
                          </span>
                        </div>
                      )}
                      {selectedSize && (
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-slate-400">Size:</span>
                          <span className="text-xs text-white font-medium">
                            {selectedSize}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  {savings && (
                    <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-green-500/20 text-green-300 rounded-full">
                      {savings}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold">${price}</div>
                  {isBundle && (
                    <div className="text-sm text-slate-400 line-through">$200</div>
                  )}
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="p-6">
              {/* Why we need this info */}
              <div className="mb-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    <svg
                      className="w-5 h-5 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-300 mb-1">
                      Why do we need your email?
                    </h4>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      We&apos;ll use your email to send you purchase confirmation, raffle updates, and most importantly - to notify you if you win! No spam, just essential raffle communications.
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Messages */}
              {(error || emailError) && (
                <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <svg
                        className="w-5 h-5 text-red-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-red-300 mb-1">
                        Please fix the following error{(error && emailError) ? 's' : ''}:
                      </h4>
                      <ul className="text-sm text-red-200 space-y-1">
                        {emailError && <li>• {emailError}</li>}
                        {error && <li>• {error}</li>}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleCheckout} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-white mb-2"
                  >
                    Email Address <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="your@email.com"
                    className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                      emailError 
                        ? 'border-red-400 focus:ring-red-500' 
                        : 'border-white/20 focus:ring-blue-500'
                    }`}
                    required
                    disabled={isLoading}
                    autoComplete="email"
                  />
                  {emailError && (
                    <p className="text-xs text-red-400 mt-1">{emailError}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-white mb-2"
                  >
                    Phone Number{" "}
                    <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={phone || ''}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setError(""); // Clear error when user starts typing
                    }}
                    placeholder="+1 (555) 123-4567"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    disabled={isLoading}
                    autoComplete="tel"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Optional - only used for urgent winner notifications
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || !isFormValid()}
                  className={`w-full mt-6 px-6 py-4 font-semibold rounded-lg transition-all duration-200 ${
                    isLoading || !isFormValid()
                      ? 'bg-gray-600 text-gray-300 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transform hover:scale-105'
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    `Complete Purchase - $${price}`
                  )}
                </button>
              </form>

              {/* Trust Signals */}
              <div className="mt-4 text-center">
                <div className="flex items-center justify-center space-x-4 text-xs text-slate-400">
                  <div className="flex items-center space-x-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Secure checkout</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>SSL encrypted</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>Powered by Stripe</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Back to Shop */}
          <div className="text-center mt-6">
            <Link
              href="/shop"
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              ← Back to shop
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center text-white">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
        <p>Loading...</p>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CheckoutPageContent />
    </Suspense>
  );
}
