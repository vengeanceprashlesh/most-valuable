"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { products } from "@/data/products";
import { RaffleCountdownTimer } from "@/components/RaffleCountdownTimer";

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
  // Track selected variant per product (tees 1-3)
  const initial: VariantState = useMemo(() => {
    // Preselect Black for Members Only Tee (p3) so its button is active by default
    return { p3: "p3b" };
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

      <section className="relative z-10 mx-auto max-w-6xl px-6 py-14">
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


        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                className={`group relative block rounded-xl border border-gray-200 bg-white text-black p-5 shadow-md transition duration-300 will-change-transform hover:-translate-y-1 hover:shadow-lg focus-within:shadow-lg animate-fade-up animate-delay-${(idx % 5) + 1}`}
              >
                <div className="relative">
                  <div className="block">
                    <div className={`relative aspect-[3/4] w-full overflow-hidden rounded-lg ${(["raffle","p1b","p1w","p3","p4","p5","p8"].includes(p.id) || idx >= 6) ? "bg-white" : "bg-gray-100"} ring-1 ring-gray-200`}>
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
                                  ? "scale-[1.2] md:scale-[1.3]"
                                  : p.id === "p6"
                                  ? "scale-[1.3] md:scale-[1.4]"
                                  : p.id === "p7"
                                  ? "scale-[1.3] md:scale-[1.4]"
                                  : p.id === "p3" || p.id === "p4"
                                  ? "scale-[1.25] md:scale-[1.35]"
                                  : ["p5","p8"].includes(p.id)
                                  ? "scale-[1.2] md:scale-[1.3]"
                                  : ""
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

                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium underline-offset-2 group-hover:underline">{p.name}</h3>
                  </div>
                  <StatusBadge status={p.status} />
                </div>

                {hasVariants && p.id !== "raffle" && (
                  <div className="mt-3 flex gap-2">
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
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                )}

              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}

