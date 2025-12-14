"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
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

function Media({ src, alt, className = "", style }: { src: string; alt: string; className?: string; style?: React.CSSProperties }) {
  const url = mediaUrl(src);
  const isVideo = /\.(mp4|mov)$/i.test(url);
  return isVideo ? (
    <ClientVideo src={url} alt={alt} className={className} />
  ) : (
    <Image src={url} alt={alt} fill sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw" className={`object-contain ${className}`} style={style} />
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

  // Parallax scroll effect
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const headerOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <main className="relative min-h-screen bg-white text-black">
      {/* ============================================
          HERO SECTION - PREMIUM LUXURY DESIGN
          ============================================ */}
      <section ref={heroRef} className="relative h-screen w-full overflow-hidden bg-[#0a0a0a]">
        {/* Atmospheric Background Layers */}
        <div className="absolute inset-0">
          {/* Deep gradient base */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#111] to-[#0a0a0a]" />

          {/* Subtle radial glow behind product */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(212,175,55,0.06)_0%,_transparent_50%)]" />

          {/* Grain texture for depth */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")'
            }}
          />
        </div>

        {/* Floating Background Typography - Creates Depth */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden opacity-[0.03]">
          <span className="text-[30vw] font-bold tracking-[-0.05em] text-white whitespace-nowrap">
            MV
          </span>
        </div>

        {/* Centered Product Image with Parallax + Glow */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center z-10"
          style={{ y: imageY, scale: imageScale }}
        >
          {/* Product glow effect */}
          <div className="absolute w-[45%] sm:w-[35%] md:w-[30%] aspect-square rounded-full bg-gradient-to-t from-amber-500/15 via-amber-500/5 to-transparent blur-3xl" />

          {/* Product image */}
          <div className="relative w-[50%] sm:w-[40%] md:w-[32%] lg:w-[28%] aspect-[3/4]">
            <Image
              src="/Hoodie.png"
              alt="Most Valuable Hoodie"
              fill
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>
        </motion.div>

        {/* Premium Header */}
        <motion.header
          className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-6 sm:px-12 lg:px-16 py-6 sm:py-8"
          style={{ opacity: headerOpacity }}
        >
          {/* Left - Menu */}
          <div className="flex-1 flex justify-start">
            <Link
              href="/"
              className="group flex items-center gap-2 text-[10px] sm:text-[11px] uppercase tracking-[0.35em] text-white/50 hover:text-white transition-all duration-500"
            >
              <span className="w-4 h-[1px] bg-white/30 group-hover:w-6 group-hover:bg-amber-400 transition-all duration-500" />
              Menu
            </Link>
          </div>

          {/* Center - Logo */}
          <div className="flex-1 flex justify-center">
            <Link href="/" className="group">
              <Image
                src="/LogoWhite.png"
                alt="Most Valuable"
                width={100}
                height={35}
                className="h-6 sm:h-7 w-auto object-contain opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                priority
              />
            </Link>
          </div>

          {/* Right - Shop with Dropdown */}
          <div className="flex-1 flex justify-end">
            <div className="relative group">
              <Link
                href="#products"
                className="flex items-center gap-2 text-[10px] sm:text-[11px] uppercase tracking-[0.35em] text-white/50 hover:text-white transition-all duration-500"
              >
                Shop
                <svg className="w-3 h-3 transition-transform duration-300 group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                </svg>
              </Link>

              {/* Dropdown Menu */}
              <div className="absolute top-full right-0 mt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                {/* Invisible bridge to prevent menu from closing */}
                <div className="absolute -top-4 left-0 right-0 h-4" />

                <div className="bg-black/95 backdrop-blur-xl border border-white/10 rounded-sm py-3 min-w-[180px] shadow-2xl">
                  <a
                    href="#hoodies"
                    className="flex items-center justify-between px-5 py-2.5 text-[10px] uppercase tracking-[0.25em] text-white/60 hover:text-white hover:bg-white/5 transition-all duration-300"
                  >
                    <span>Hoodies</span>
                    <span className="text-amber-500/70 text-[9px]">{products.filter(p => p.status === "available" && p.category === "hoodie").length}</span>
                  </a>
                  <a
                    href="#tees"
                    className="flex items-center justify-between px-5 py-2.5 text-[10px] uppercase tracking-[0.25em] text-white/60 hover:text-white hover:bg-white/5 transition-all duration-300"
                  >
                    <span>T-Shirts</span>
                    <span className="text-amber-500/70 text-[9px]">{products.filter(p => p.status === "available" && p.category === "tee").length}</span>
                  </a>
                  <a
                    href="#accessories"
                    className="flex items-center justify-between px-5 py-2.5 text-[10px] uppercase tracking-[0.25em] text-white/60 hover:text-white hover:bg-white/5 transition-all duration-300"
                  >
                    <span>Accessories</span>
                    <span className="text-amber-500/70 text-[9px]">{products.filter(p => p.status === "available" && p.category === "beanie").length}</span>
                  </a>

                  {/* Divider */}
                  <div className="my-2 mx-4 h-[1px] bg-white/10" />

                  <a
                    href="#products"
                    className="flex items-center px-5 py-2.5 text-[10px] uppercase tracking-[0.25em] text-amber-500/80 hover:text-amber-400 hover:bg-white/5 transition-all duration-300"
                  >
                    View All
                  </a>
                </div>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Bottom Content - Brand Typography + CTA */}
        <motion.div
          className="absolute inset-x-0 bottom-0 z-20 pb-10 sm:pb-14 lg:pb-16 px-6"
          style={{ y: textY, opacity: headerOpacity }}
        >
          {/* Gradient fade for text readability */}
          <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/70 to-transparent pointer-events-none" />

          <div className="relative max-w-7xl mx-auto text-center">
            {/* Small tagline */}
            <motion.p
              className="text-[9px] sm:text-[10px] uppercase tracking-[0.5em] text-amber-400/60 mb-3 font-light"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Premium Streetwear • Real Gold
            </motion.p>

            {/* Main headline */}
            <motion.h1
              className="text-[10vw] sm:text-[8vw] md:text-[6vw] lg:text-[5vw] font-extralight tracking-[0.12em] text-white leading-none select-none uppercase"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0 }}
            >
              Most Valuable
            </motion.h1>

            {/* Subtle divider */}
            <motion.div
              className="w-12 h-[1px] bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto mt-5 mb-5"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            />

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <Link
                href="#products"
                className="inline-flex items-center gap-2 border border-white/20 text-white/70 px-6 sm:px-8 py-2.5 sm:py-3 text-[9px] sm:text-[10px] uppercase tracking-[0.25em] hover:border-amber-500/40 hover:text-white hover:bg-white/5 transition-all duration-500"
              >
                <span>Explore Collection</span>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                </svg>
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 hidden sm:block"
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{ opacity: headerOpacity }}
        >
          <div className="w-[1px] h-6 bg-gradient-to-b from-white/30 to-transparent" />
        </motion.div>
      </section>

      {/* ============================================
          PRODUCTS SECTION - CATEGORIZED LUXURY LAYOUT
          ============================================ */}
      <section id="products" className="relative z-20 w-full bg-[#fafafa]">
        <div className="max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16 pt-12 sm:pt-16 pb-24 sm:pb-32">

          {/* Category Navigation - Sticky */}
          <motion.div
            className="flex items-center justify-center gap-8 sm:gap-12 mb-12 sm:mb-16 py-4 border-b border-black/10"
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <a href="#hoodies" className="group text-[10px] sm:text-xs uppercase tracking-[0.3em] text-black/60 hover:text-black transition-colors duration-300">
              <span className="group-hover:underline underline-offset-8 decoration-black/30">Hoodies</span>
              <span className="ml-2 text-black/30">({products.filter(p => p.status === "available" && p.category === "hoodie").length})</span>
            </a>
            <a href="#tees" className="group text-[10px] sm:text-xs uppercase tracking-[0.3em] text-black/60 hover:text-black transition-colors duration-300">
              <span className="group-hover:underline underline-offset-8 decoration-black/30">T-Shirts</span>
              <span className="ml-2 text-black/30">({products.filter(p => p.status === "available" && p.category === "tee").length})</span>
            </a>
            <a href="#accessories" className="group text-[10px] sm:text-xs uppercase tracking-[0.3em] text-black/60 hover:text-black transition-colors duration-300">
              <span className="group-hover:underline underline-offset-8 decoration-black/30">Accessories</span>
              <span className="ml-2 text-black/30">({products.filter(p => p.status === "available" && p.category === "beanie").length})</span>
            </a>
          </motion.div>

          {/* ============ HOODIES SECTION ============ */}
          {products.filter(p => p.status === "available" && p.category === "hoodie").length > 0 && (
            <div id="hoodies" className="mb-20 sm:mb-28 scroll-mt-24">
              <motion.div
                className="flex items-end justify-between mb-8 sm:mb-12"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div>
                  <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.4em] text-black/40 mb-2">Premium Collection</p>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-extralight tracking-tight text-black">Hoodies</h2>
                </div>
                <span className="text-[10px] sm:text-xs text-black/40 tracking-wide">
                  {products.filter(p => p.status === "available" && p.category === "hoodie").length} items
                </span>
              </motion.div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-12 sm:gap-x-6 sm:gap-y-16">
                {products.filter(p => p.status === "available" && p.category === "hoodie").map((p, idx) => {
                  const hasVariants = !!p.variants?.length;
                  const selectedId = selected[p.id];
                  const activeVar = hasVariants && selectedId ? p.variants!.find(v => v.id === selectedId) : undefined;
                  const mediaArr = hasVariants ? (activeVar?.media ?? (p.media || [])) : (p.media || []);
                  const idxForCard = slideIndex[p.id] ?? 0;
                  const currentMedia = mediaArr[idxForCard] || mediaArr[0] || "";

                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-80px" }}
                      transition={{ duration: 0.5, delay: (idx % 4) * 0.05, ease: "easeOut" }}
                    >
                      <Link href={`/product/${p.slug}`} className="group block">
                        <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#f0f0f0] mb-4">
                          <div
                            className="absolute inset-0 flex transition-transform duration-500 ease-out"
                            style={{ transform: `translateX(-${(idxForCard % (mediaArr.length || 1)) * 100}%)` }}
                          >
                            {(mediaArr.length ? mediaArr : [currentMedia]).map((m, i) => (
                              <div key={i} className="relative h-full w-full shrink-0 basis-full">
                                <Media src={m} alt={p.name} className={`transition-transform duration-700 ease-out group-hover:scale-[1.03] ${m.includes("/AI-generated/") ? "object-contain" : "object-cover"}`} />
                              </div>
                            ))}
                          </div>
                          <div className="absolute inset-0 border border-transparent group-hover:border-black/20 transition-colors duration-300 pointer-events-none" />
                          {mediaArr.length > 1 && (
                            <>
                              <button type="button" aria-label="Previous image" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSlideIndex((s) => ({ ...s, [p.id]: (idxForCard - 1 + mediaArr.length) % mediaArr.length })); }} className="absolute inset-y-0 left-0 w-1/2 cursor-w-resize z-10" />
                              <button type="button" aria-label="Next image" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSlideIndex((s) => ({ ...s, [p.id]: (idxForCard + 1) % mediaArr.length })); }} className="absolute inset-y-0 right-0 w-1/2 cursor-e-resize z-10" />
                            </>
                          )}
                          {mediaArr.length > 1 && (
                            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1">
                              {mediaArr.map((_, i) => (
                                <span key={i} className={`block w-1 h-1 rounded-full transition-all duration-300 ${i === idxForCard % mediaArr.length ? 'bg-black w-4' : 'bg-black/30'}`} />
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-[11px] sm:text-xs uppercase tracking-[0.15em] text-black font-normal truncate group-hover:underline underline-offset-4 decoration-black/30 transition-all duration-300">{p.name}</h3>
                          {p.price && <p className="text-[11px] sm:text-xs text-black/60 tracking-wide font-light">{p.price}</p>}
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ============ TEES SECTION ============ */}
          {products.filter(p => p.status === "available" && p.category === "tee").length > 0 && (
            <div id="tees" className="mb-20 sm:mb-28 scroll-mt-24">
              <motion.div
                className="flex items-end justify-between mb-8 sm:mb-12"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div>
                  <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.4em] text-black/40 mb-2">Essential Collection</p>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-extralight tracking-tight text-black">T-Shirts</h2>
                </div>
                <span className="text-[10px] sm:text-xs text-black/40 tracking-wide">
                  {products.filter(p => p.status === "available" && p.category === "tee").length} items
                </span>
              </motion.div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-12 sm:gap-x-6 sm:gap-y-16">
                {products.filter(p => p.status === "available" && p.category === "tee").map((p, idx) => {
                  const hasVariants = !!p.variants?.length;
                  const selectedId = selected[p.id];
                  const activeVar = hasVariants && selectedId ? p.variants!.find(v => v.id === selectedId) : undefined;
                  const mediaArr = hasVariants ? (activeVar?.media ?? (p.media || [])) : (p.media || []);
                  const idxForCard = slideIndex[p.id] ?? 0;
                  const currentMedia = mediaArr[idxForCard] || mediaArr[0] || "";

                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-80px" }}
                      transition={{ duration: 0.5, delay: (idx % 4) * 0.05, ease: "easeOut" }}
                    >
                      <Link href={`/product/${p.slug}`} className="group block">
                        <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#f0f0f0] mb-4">
                          <div
                            className="absolute inset-0 flex transition-transform duration-500 ease-out"
                            style={{ transform: `translateX(-${(idxForCard % (mediaArr.length || 1)) * 100}%)` }}
                          >
                            {(mediaArr.length ? mediaArr : [currentMedia]).map((m, i) => (
                              <div key={i} className="relative h-full w-full shrink-0 basis-full">
                                <Media src={m} alt={p.name} className={`transition-transform duration-700 ease-out group-hover:scale-[1.03] ${m.includes("/AI-generated/") ? "object-contain" : "object-cover"}`} />
                              </div>
                            ))}
                          </div>
                          <div className="absolute inset-0 border border-transparent group-hover:border-black/20 transition-colors duration-300 pointer-events-none" />
                          {mediaArr.length > 1 && (
                            <>
                              <button type="button" aria-label="Previous image" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSlideIndex((s) => ({ ...s, [p.id]: (idxForCard - 1 + mediaArr.length) % mediaArr.length })); }} className="absolute inset-y-0 left-0 w-1/2 cursor-w-resize z-10" />
                              <button type="button" aria-label="Next image" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSlideIndex((s) => ({ ...s, [p.id]: (idxForCard + 1) % mediaArr.length })); }} className="absolute inset-y-0 right-0 w-1/2 cursor-e-resize z-10" />
                            </>
                          )}
                          {mediaArr.length > 1 && (
                            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1">
                              {mediaArr.map((_, i) => (
                                <span key={i} className={`block w-1 h-1 rounded-full transition-all duration-300 ${i === idxForCard % mediaArr.length ? 'bg-black w-4' : 'bg-black/30'}`} />
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-[11px] sm:text-xs uppercase tracking-[0.15em] text-black font-normal truncate group-hover:underline underline-offset-4 decoration-black/30 transition-all duration-300">{p.name}</h3>
                          {p.price && <p className="text-[11px] sm:text-xs text-black/60 tracking-wide font-light">{p.price}</p>}
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ============ ACCESSORIES SECTION ============ */}
          {products.filter(p => p.status === "available" && p.category === "beanie").length > 0 && (
            <div id="accessories" className="scroll-mt-24">
              <motion.div
                className="flex items-end justify-between mb-8 sm:mb-12"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div>
                  <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.4em] text-black/40 mb-2">Finishing Touches</p>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-extralight tracking-tight text-black">Accessories</h2>
                </div>
                <span className="text-[10px] sm:text-xs text-black/40 tracking-wide">
                  {products.filter(p => p.status === "available" && p.category === "beanie").length} items
                </span>
              </motion.div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-12 sm:gap-x-6 sm:gap-y-16">
                {products.filter(p => p.status === "available" && p.category === "beanie").map((p, idx) => {
                  const hasVariants = !!p.variants?.length;
                  const selectedId = selected[p.id];
                  const activeVar = hasVariants && selectedId ? p.variants!.find(v => v.id === selectedId) : undefined;
                  const mediaArr = hasVariants ? (activeVar?.media ?? (p.media || [])) : (p.media || []);
                  const idxForCard = slideIndex[p.id] ?? 0;
                  const currentMedia = mediaArr[idxForCard] || mediaArr[0] || "";

                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-80px" }}
                      transition={{ duration: 0.5, delay: (idx % 4) * 0.05, ease: "easeOut" }}
                    >
                      <Link href={`/product/${p.slug}`} className="group block">
                        <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#f0f0f0] mb-4">
                          <div
                            className="absolute inset-0 flex transition-transform duration-500 ease-out"
                            style={{ transform: `translateX(-${(idxForCard % (mediaArr.length || 1)) * 100}%)` }}
                          >
                            {(mediaArr.length ? mediaArr : [currentMedia]).map((m, i) => (
                              <div key={i} className="relative h-full w-full shrink-0 basis-full">
                                <Media src={m} alt={p.name} className={`transition-transform duration-700 ease-out group-hover:scale-[1.03] ${m.includes("/AI-generated/") ? "object-contain" : "object-cover"}`} />
                              </div>
                            ))}
                          </div>
                          <div className="absolute inset-0 border border-transparent group-hover:border-black/20 transition-colors duration-300 pointer-events-none" />
                          {mediaArr.length > 1 && (
                            <>
                              <button type="button" aria-label="Previous image" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSlideIndex((s) => ({ ...s, [p.id]: (idxForCard - 1 + mediaArr.length) % mediaArr.length })); }} className="absolute inset-y-0 left-0 w-1/2 cursor-w-resize z-10" />
                              <button type="button" aria-label="Next image" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSlideIndex((s) => ({ ...s, [p.id]: (idxForCard + 1) % mediaArr.length })); }} className="absolute inset-y-0 right-0 w-1/2 cursor-e-resize z-10" />
                            </>
                          )}
                          {mediaArr.length > 1 && (
                            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1">
                              {mediaArr.map((_, i) => (
                                <span key={i} className={`block w-1 h-1 rounded-full transition-all duration-300 ${i === idxForCard % mediaArr.length ? 'bg-black w-4' : 'bg-black/30'}`} />
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-[11px] sm:text-xs uppercase tracking-[0.15em] text-black font-normal truncate group-hover:underline underline-offset-4 decoration-black/30 transition-all duration-300">{p.name}</h3>
                          {p.price && <p className="text-[11px] sm:text-xs text-black/60 tracking-wide font-light">{p.price}</p>}
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

        </div>




        {/* The Vault - Premium Sold Out Section */}
        {products.filter(p => p.status === "sold_out").length > 0 && (
          <div className="relative py-20 px-4 sm:px-6 -mx-3 sm:-mx-4 mt-16">
            {/* Dark gradient background */}
            <div className="absolute inset-0 bg-gradient-to-b from-neutral-900 via-black to-neutral-900" />

            {/* Subtle texture overlay */}
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

            <div className="relative z-10 max-w-7xl mx-auto">
              {/* Section Header */}
              <div className="text-center mb-16">
                <p className="text-[10px] sm:text-xs uppercase tracking-[0.5em] text-amber-500/70 mb-4 font-light">
                  Archive Collection
                </p>
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-extralight text-white tracking-tight mb-4">
                  THE VAULT
                </h2>
                <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto mb-6" />
                <p className="text-neutral-500 text-sm sm:text-base font-light tracking-wide">
                  Past Exclusives • Sold Out Forever
                </p>
              </div>

              {/* Product Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 max-w-5xl mx-auto">
                {products.filter(p => p.status === "sold_out").map((p) => {
                  const mediaArr = p.media || [];
                  const idxForCard = slideIndex[p.id] ?? 0;
                  const currentMedia = mediaArr[idxForCard] || mediaArr[0] || "";

                  return (
                    <div
                      key={p.id}
                      className="group relative"
                    >
                      {/* Card Container */}
                      <div className="relative bg-neutral-900/50 backdrop-blur-sm border border-neutral-800/50 rounded-lg overflow-hidden transition-all duration-500 group-hover:border-amber-500/30 group-hover:shadow-[0_0_40px_rgba(245,158,11,0.1)]">

                        {/* Gold Ribbon - SOLD OUT */}
                        <div className="absolute top-4 right-4 z-20">
                          <span className="bg-gradient-to-r from-amber-600 to-amber-500 text-black text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded shadow-lg">
                            Sold Out
                          </span>
                        </div>

                        {/* Image Container */}
                        <div className="relative aspect-square w-full overflow-hidden bg-neutral-900">
                          {/* Grayscale to color effect */}
                          <div
                            className="absolute inset-0 flex transition-transform duration-500 ease-out will-change-transform"
                            style={{ transform: `translateX(-${(idxForCard % (mediaArr.length || 1)) * 100}%)` }}
                          >
                            {(mediaArr.length ? mediaArr : [currentMedia]).map((m, i) => (
                              <div key={i} className="relative h-full w-full shrink-0 grow-0 basis-full">
                                <Media
                                  src={m}
                                  alt={p.name}
                                  className={`grayscale group-hover:grayscale-0 transition-all duration-700 ${p.id === "p4"
                                    ? "scale-[1.3] md:scale-[1.35]"
                                    : p.id === "p5"
                                      ? "scale-[1.6] md:scale-[1.3]"
                                      : "scale-100 object-contain"
                                    }`}
                                />
                              </div>
                            ))}
                          </div>

                          {/* Subtle vignette overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                        </div>

                        {/* Product Info */}
                        <div className="p-5 sm:p-6 text-center border-t border-neutral-800/50">
                          <h3 className="text-sm sm:text-base font-light text-white uppercase tracking-[0.2em] mb-2">
                            {p.name}
                          </h3>
                          {p.price && (
                            <p className="text-amber-500/80 text-sm font-light line-through decoration-amber-500/40">
                              {p.price}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* CTA Section */}
              <div className="text-center mt-16">
                <p className="text-neutral-500 text-sm mb-6 font-light">
                  Don&apos;t miss the next drop
                </p>
                <Link
                  href="/"
                  className="inline-block border border-amber-500/50 text-amber-500 px-8 py-3 text-[10px] sm:text-xs uppercase tracking-[0.3em] hover:bg-amber-500 hover:text-black transition-all duration-500 rounded"
                >
                  Get Notified
                </Link>
              </div>
            </div>
          </div>
        )}

      </section>

      {/* Section 1 - Black Background (Collection Hero) */}
      <section className="relative min-h-screen bg-black text-white flex items-center justify-center overflow-hidden">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black opacity-60" />

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.4em] text-white/40 mb-8 font-light">
            Collection
          </p>
          <h2 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-extralight tracking-[-0.02em] mb-8 leading-[0.9]">
            GOLD RUSH
          </h2>
          <p className="text-base sm:text-lg text-white/50 font-light tracking-wide max-w-lg mx-auto leading-relaxed">
            Premium streetwear infused with real gold. Every piece tells a story of value.
          </p>
          <div className="mt-12">
            <span className="inline-block border border-white/20 text-white/60 px-8 py-3 text-[10px] uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all duration-500 cursor-pointer">
              Explore Collection
            </span>
          </div>
        </div>
      </section>

      {/* Section 2 - White Background (Featured Product) */}
      <section className="min-h-screen bg-white text-black flex items-center justify-center px-6 py-24">
        <div className="max-w-6xl w-full">
          <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-center">
            {/* Left - Image */}
            <div className="relative aspect-[4/5] bg-neutral-50 overflow-hidden group">
              <Image
                src="/Hoodie.png"
                alt="Featured Product"
                fill
                className="object-contain transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            {/* Right - Content */}
            <div className="space-y-8">
              <p className="text-[10px] uppercase tracking-[0.4em] text-neutral-400">Featured</p>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-extralight tracking-tight leading-[1.1]">
                Members Only<br />
                <span className="font-normal">Hoodie</span>
              </h2>
              <p className="text-neutral-500 text-base leading-relaxed max-w-md">
                Crafted for those who understand value. Each hoodie comes with 7 grams of pure gold,
                making it not just apparel, but an investment.
              </p>
              <div className="pt-4">
                <Link href="/product/mv-members-only-hoodie" className="inline-block border border-black text-black px-10 py-4 text-[10px] uppercase tracking-[0.3em] hover:bg-black hover:text-white transition-all duration-500">
                  View Product
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 - Black Background (Brand Story) */}
      <section className="min-h-screen bg-black text-white flex items-center justify-center px-6 py-24">
        <div className="max-w-3xl text-center">
          <p className="text-[10px] uppercase tracking-[0.4em] text-white/40 mb-12 font-light">
            The Vision
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extralight tracking-tight leading-[1.3] mb-12">
            &ldquo;Value isn&apos;t just what you wear.<br />
            <span className="text-white/50">It&apos;s what you embody.&rdquo;</span>
          </h2>
          <p className="text-white/40 text-sm sm:text-base leading-relaxed max-w-xl mx-auto mb-12">
            Most Valuable represents the intersection of luxury streetwear and tangible worth.
            Every piece in our collection contains real gold, bridging the gap between fashion and investment.
          </p>
          <div className="flex items-center justify-center gap-12 pt-8">
            <div className="text-center">
              <p className="text-3xl sm:text-4xl font-light text-white mb-2">24K</p>
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">Pure Gold</p>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="text-center">
              <p className="text-3xl sm:text-4xl font-light text-white mb-2">100%</p>
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">Premium Cotton</p>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="text-center">
              <p className="text-3xl sm:text-4xl font-light text-white mb-2">1:1</p>
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">Limited Pieces</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4 - White Background (Coming Soon Grid) */}
      <section className="min-h-screen bg-white text-black py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-[10px] uppercase tracking-[0.4em] text-neutral-400 mb-6">Preview</p>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-extralight tracking-tight">Coming Soon</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
            {products.filter(p => p.status === "coming_soon").map((p) => {
              const mediaArr = p.media || [];
              const idxForCard = slideIndex[p.id] ?? 0;
              const currentMedia = mediaArr[idxForCard] || mediaArr[0] || "";

              return (
                <div key={p.id} className="group cursor-pointer">
                  <div className="relative aspect-[3/4] bg-neutral-50 overflow-hidden mb-6">
                    {/* Sliding track with auto-scroll */}
                    <div
                      className="absolute inset-0 flex transition-transform duration-1000 ease-out will-change-transform"
                      style={{ transform: `translateX(-${(idxForCard % (mediaArr.length || 1)) * 100}%)` }}
                    >
                      {(mediaArr.length ? mediaArr : [currentMedia]).map((m, i) => (
                        <div key={i} className="relative h-full w-full shrink-0 grow-0 basis-full">
                          <Media
                            src={m}
                            alt={p.name}
                            className="object-cover transition-all duration-700 group-hover:scale-105"
                          />
                        </div>
                      ))}
                    </div>
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-500" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xs sm:text-sm font-normal text-black uppercase tracking-[0.15em] mb-2">{p.name}</h3>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-400">Coming Soon</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 5 - Newsletter Section */}
      <section className="bg-black text-white py-24 sm:py-32 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-[10px] uppercase tracking-[0.4em] text-white/40 mb-8">Stay Connected</p>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-extralight tracking-tight mb-8">
            Join The<br />Movement
          </h2>
          <p className="text-white/40 text-sm sm:text-base leading-relaxed max-w-md mx-auto mb-12">
            Be the first to know about exclusive drops, limited editions, and members-only access.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 bg-transparent border border-white/20 px-6 py-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/50 transition-colors"
            />
            <button className="bg-white text-black px-8 py-4 text-[10px] uppercase tracking-[0.3em] hover:bg-white/90 transition-all duration-300">
              Subscribe
            </button>
          </div>
          <p className="text-[10px] text-white/30 mt-6 tracking-wide">
            By subscribing, you agree to our Privacy Policy
          </p>
        </div>
      </section>

      {/* ============================================
          FOOTER - ALAÏA INSPIRED MINIMAL
          ============================================ */}
      <footer className="relative bg-black text-white overflow-hidden">
        {/* Minimal Top Content */}
        <div className="relative z-10 pt-12 pb-4 px-6 text-center">
          <a
            href="https://instagram.com/mostvaluableco"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] sm:text-xs uppercase tracking-[0.4em] text-white/50 hover:text-white transition-colors duration-300"
          >
            @mostvaluableco
          </a>
        </div>

        {/* Massive Brand Typography - THE MAIN EVENT */}
        <div className="relative z-0 pb-4 sm:pb-6 overflow-hidden">
          <h2
            className="text-center text-[18vw] sm:text-[16vw] md:text-[14vw] font-extralight tracking-[0.05em] text-white leading-[0.85] select-none whitespace-nowrap uppercase"
            aria-hidden="true"
          >
            MOST VALUABLE
          </h2>
        </div>

        {/* Copyright - Tiny at bottom */}
        <div className="relative z-10 pb-4 text-center">
          <p className="text-[9px] uppercase tracking-[0.2em] text-white/30">
            © 2024 Most Valuable
          </p>
        </div>
      </footer>
    </main>
  );
}

