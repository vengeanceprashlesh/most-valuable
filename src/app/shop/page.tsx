"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { products } from "@/data/products";
import { RaffleCountdownTimer } from "@/components/RaffleCountdownTimer";
import InstagramLink from "@/components/InstagramLink";

type VariantState = Record<string, string>; // productId -> variantId

function mediaUrl(path: string) {
  // Map /media/* -> /socoldblooded-attachments/*
  if (path.startsWith("/media/")) {
    return path.replace("/media/", "/socoldblooded-attachments/");
  }
  return path;
}

function StatusBadge({ status }: { status: "sold_out" | "coming_soon" | "available" }) {
  if (status === "available") return null;
  const label = status === "sold_out" ? "SOLD OUT" : "COMING SOON";
  return (
    <span className="rounded-full border border-gray-300 bg-gray-100 px-3 py-1 text-xs uppercase tracking-wide text-gray-700">
      {label}
    </span>
  );
}

// Client-only video component to prevent hydration issues
function ClientVideo({ src, className = "" }: { src: string; alt: string; className?: string }) {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  if (!isMounted) {
    // Show a placeholder during SSR
    return <div className={`absolute inset-0 h-full w-full bg-gray-100 ${className}`} />;
  }
  
  return (
    <video 
      className={`absolute inset-0 h-full w-full object-contain ${className}`} 
      src={src} 
      autoPlay 
      loop 
      muted 
      playsInline
      key={src} // Force re-render on src change to avoid browser extension conflicts
    />
  );
}

function Media({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  const url = mediaUrl(src);
  const isVideo = /\.(mp4|mov)$/i.test(url);
  return isVideo ? (
    <ClientVideo src={url} alt={alt} className={className} />
  ) : (
    <Image src={url} alt={alt} fill sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw" className={`object-contain ${className}`} />
  );
}

export default function ShopPage() {
  // Track selected variant per product
  const initial: VariantState = useMemo(() => {
    // Preselect Black variants for products with variants
    return { 
      "mv-hoodie": "mv-hoodie-blk", // MV Members Only Hoodie
      "mv-tee": "mv-tee-blk" // MV Members Only Tee
    };
  }, []);
  const [selected, setSelected] = useState<VariantState>(initial);
  const [loadingQty, setLoadingQty] = useState<number | null>(null);
  const [slideIndex, setSlideIndex] = useState<Record<string, number>>({});

  // Auto-slide images every 3s for products that have multiple media
  useEffect(() => {
    const id = setInterval(() => {
      setSlideIndex((prev) => {
        const next: Record<string, number> = { ...prev };
        for (const p of products) {
          const hasVariants = !!p.variants?.length;
          const selectedId = selected[p.id];
          const activeVar = hasVariants && selectedId ? (p.variants!.find(v => v.id === selectedId) ?? undefined) : undefined;
          const mediaArr = hasVariants ? (activeVar?.media ?? (p.media || [])) : (p.media || []);
          if (mediaArr.length > 1) {
            const cur = prev[p.id] ?? 0;
            next[p.id] = (cur + 1) % mediaArr.length;
          }
        }
        return next;
      });
    }, 3000);
    return () => clearInterval(id);
  }, [selected]);

  function handleBuyClick(quantity: number) {
    // Redirect to checkout page with quantity parameter
    window.location.href = `/checkout?quantity=${quantity}`;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-black">
      {/* Background set to pure white (gradient removed) */}

      <section className="relative z-10 mx-auto max-w-6xl px-0 py-14 sm:px-6">
        <header className="mb-10">
          {/* One-line header: big logo + raffle timer */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link href="/" aria-label="MV home" className="inline-flex items-center">
              <Image src="/shopPageLogo.png" alt="Most Valuable" width={540} height={180} className="h-20 sm:h-24 w-auto" priority />
            </Link>
            <div className="inline-flex items-center gap-3 bg-black/5 border border-gray-200 rounded-2xl px-4 sm:px-6 py-3 shadow-sm text-black">
              <span className="text-xs sm:text-sm font-medium">Gold Rush</span>
              <RaffleCountdownTimer className="sm:border-l border-gray-300 sm:pl-4 text-black" />
            </div>
          </div>
        </header>


        {/* Mobile: 2x2 grid, Desktop: 3x3 grid */}
        <div className="grid grid-cols-2 gap-0 px-0 sm:grid-cols-3 sm:gap-4 lg:gap-6 sm:px-0">
          {products.map((p, idx) => {
            const hasVariants = !!p.variants?.length;
            const selectedId = selected[p.id];
            const activeVar = hasVariants && selectedId ? p.variants!.find(v => v.id === selectedId) : undefined;
            const mediaArr = hasVariants ? (activeVar?.media ?? (p.media || [])) : (p.media || []);
            const idxForCard = slideIndex[p.id] ?? 0;
            const currentMedia = mediaArr[idxForCard] || mediaArr[0] || "";

            return (
              <Link
                href={`/product/${p.slug}`}
                key={p.id}
                className={`group relative block rounded-none p-2 sm:rounded-xl sm:border sm:border-gray-200 sm:bg-white text-black sm:p-5 sm:shadow-md transition duration-300 will-change-transform sm:hover:-translate-y-1 sm:hover:shadow-lg sm:focus-within:shadow-lg animate-fade-up animate-delay-${(idx % 5) + 1}`}
              >
                <div className="relative">
                  <div className="block">
                    <div className={`relative aspect-[1/1] sm:aspect-[3/4] w-full overflow-hidden rounded-none bg-transparent ring-0 sm:rounded-lg ${(["raffle","p1b","p1w","p3","p4","p5","p7","p8"].includes(p.id) || idx >= 6) ? "sm:bg-white" : "sm:bg-gray-100"} sm:ring-1 sm:ring-gray-200`}>
                      {/* Sliding track */}
                      <div
                        className="absolute inset-0 flex transition-transform duration-500 ease-out will-change-transform"
                        style={{ transform: `translateX(-${(idxForCard % (mediaArr.length || 1)) * 100}%)` }}
                      >
                        {(mediaArr.length ? mediaArr : [currentMedia]).map((m, i) => (
                          <div key={i} className="relative h-full w-full shrink-0 grow-0 basis-full">
                            <Media
                              src={m}
                              alt={p.name}
                              className={
                                p.id === "raffle"
                                  ? "scale-[1.7] md:scale-[1.3] object-[50%_60%] sm:object-center"
                                  : p.id === "mv-hoodie"
                                  ? "scale-[1.4] md:scale-[1.2] object-center"
                                  : p.id === "mv-tee"
                                  ? "scale-[2.1] md:scale-[1.35] object-[50%_60%] sm:object-center"
                                  : p.id === "p6"
                                  ? "scale-[1.7] md:scale-[1.4]"
                                  : p.id === "p7"
                                  ? "scale-[1.7] md:scale-[1.4] object-[60%_50%]"
                                  : p.id === "p3"
                                  ? "scale-[2.1] md:scale-[1.35] object-[50%_60%] sm:object-center"
                                  : p.id === "p4"
                                  ? "scale-[1.3] md:scale-[1.35]"
                                  : ["p5","p8"].includes(p.id)
                                  ? "scale-[1.6] md:scale-[1.3]"
                                  : ["p1b","p1w"].includes(p.id)
                                  ? "scale-[1.1] sm:scale-100"
                                  : p.id === "p9"
                                  ? "scale-100 sm:scale-100"
                                  : "scale-[1.7] sm:scale-100"
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Left/Right click zones for slide */}
                  {mediaArr.length > 1 && (
                    <>
                      <button
                        type="button"
                        aria-label="Previous image"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSlideIndex((s) => ({
                            ...s,
                            [p.id]: (idxForCard - 1 + mediaArr.length) % mediaArr.length,
                          }));
                        }}
                        className="absolute inset-y-0 left-0 w-1/2 cursor-pointer"
                      />
                      <button
                        type="button"
                        aria-label="Next image"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSlideIndex((s) => ({
                            ...s,
                            [p.id]: (idxForCard + 1) % mediaArr.length,
                          }));
                        }}
                        className="absolute inset-y-0 right-0 w-1/2 cursor-pointer"
                      />
                    </>
                  )}
                </div>

                <div className="mt-1 flex flex-col items-center text-center sm:mt-4">
                  <div className="flex flex-col items-center sm:items-center w-full">
                    <h3 className="text-xs font-medium sm:text-lg underline-offset-2 group-hover:underline text-center">{p.name}</h3>
                    {/* Show price for sold out and coming soon items with faded styling */}
                    {p.price && p.status !== "available" && (
                      <span className="text-xs sm:text-sm text-gray-400 opacity-60 mt-1">{p.price}</span>
                    )}
                  </div>
                  <div className="mt-2 sm:mt-3"><StatusBadge status={p.status} /></div>
                </div>

                {/* Hide variants on mobile for cleaner look */}
                {hasVariants && p.id !== "raffle" && (
                  <div className="hidden sm:flex mt-3 gap-2">
                    {p.variants!.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        aria-label={`Select ${v.color}`}
                        onClick={(e) => { e.stopPropagation(); setSelected((s) => ({ ...s, [p.id]: v.id })); }}
                        className={`h-8 rounded-full px-3 text-xs font-medium ring-1 transition ${
                          selected[p.id] === v.id ? "bg-black text-white ring-black/20" : "bg-gray-100 text-black hover:bg-gray-200 ring-gray-300"
                        }`}
                      >
                        {v.color}
                      </button>
                    ))}
                  </div>
                )}

                {p.status === "available" && (
                  p.id === "raffle" ? (
                    <>
                      {/* Mobile: tag-style pricing options for raffle */}
                      <div className="mt-3 sm:hidden flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setLoadingQty(1);
                            handleBuyClick(1);
                          }}
                          className="rounded-full border border-gray-300 bg-black text-white px-3 py-1.5 text-xs font-medium transition hover:bg-black/90 active:scale-95"
                        >
                          {loadingQty === 1 ? "Loading..." : "+1 — $50"}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setLoadingQty(4);
                            handleBuyClick(4);
                          }}
                          className="rounded-full border border-gray-300 bg-gray-100 text-black px-3 py-1.5 text-xs font-medium transition hover:bg-gray-200 active:scale-95"
                        >
                          {loadingQty === 4 ? "Loading..." : "+4 — $100"}
                        </button>
                      </div>
                      {/* Desktop/tablet: raffle entry buttons */}
                      <div className="hidden sm:mt-4 sm:grid sm:grid-cols-2 sm:gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setLoadingQty(1);
                            handleBuyClick(1);
                          }}
                          className="rounded-full bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-black/90"
                        >
                          {loadingQty === 1 ? "Redirecting…" : "+1 entry — $50"}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setLoadingQty(4);
                            handleBuyClick(4);
                          }}
                          className="rounded-full border border-gray-300 bg-gray-100 px-5 py-3 text-sm font-medium text-black transition hover:bg-gray-200"
                        >
                          {loadingQty === 4 ? "Redirecting…" : "+4 entries — $100"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Mobile: simple price display for direct purchase products */}
                      <div className="mt-3 sm:hidden flex justify-center">
                        <span className="text-sm font-medium text-gray-900">{p.price}</span>
                      </div>
                      {/* Desktop: single buy button for direct purchase */}
                      <div className="hidden sm:mt-4 sm:block">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // For direct purchase products, redirect to their individual product page
                            window.location.href = `/product/${p.slug}`;
                          }}
                          className="w-full rounded-full bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-black/90"
                        >
                          Buy {p.price}
                        </button>
                      </div>
                    </>
                  )
                )}

              </Link>
            );
          })}
        </div>
        
        {/* Instagram Link */}
        <div className="mt-16 mb-8 flex justify-center">
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl px-6 py-4 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-3">Connect with us</p>
              <InstagramLink size="lg" className="justify-center" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

