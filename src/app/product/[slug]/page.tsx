"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, use } from "react";
import { products } from "@/data/products";
import InstagramLink from "@/components/InstagramLink";

function mediaUrl(path: string) {
  if (path.startsWith("/media/")) return path.replace("/media/", "/socoldblooded-attachments/");
  return path;
}

// Client-only video component to prevent hydration issues
function ClientVideo({ src, className = "" }: { src: string; alt: string; className?: string }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    // Show a placeholder during SSR
    return <div className={`absolute inset-0 w-full h-full object-contain bg-gray-100 ${className}`} />;
  }

  return (
    <video
      className={`absolute inset-0 w-full h-full object-cover scale-110 ${className}`}
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
    <Image src={url} alt={alt} fill className={className} />
  );
}

export default function ProductDetail({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const product = useMemo(() => products.find(p => p.slug === resolvedParams.slug), [resolvedParams.slug]);

  // Default to product hero media; do not preselect a variant
  const isRaffle = product?.id === "raffle";
  const isBoxLogo = product?.id === "p1b" || product?.id === "p1w"; // 2nd row 1st & 2nd products
  const initialMedia = product?.media || product?.variants?.[0]?.media || [];
  const [activeVariantId, setActiveVariantId] = useState<string | undefined>(undefined);
  const variantMedia = activeVariantId ? (product?.variants?.find(v => v.id === activeVariantId)?.media || []) : [];
  const [activeImage, setActiveImage] = useState(initialMedia[0] ? mediaUrl(initialMedia[0]) : "");
  const displayedMedia = (variantMedia.length ? variantMedia : (isRaffle && product?.variants?.[0]?.media ? product.variants[0].media : initialMedia));

  // For raffle: preselect Black variant and show its first image
  useEffect(() => {
    if (!product) return;
    if (isRaffle && product.variants?.length) {
      const black = product.variants.find(v => v.id === "raffle-blk") || product.variants[0];
      if (black) {
        setActiveVariantId(black.id);
        const first = black.media?.[0] ? mediaUrl(black.media[0]) : "";
        if (first) setActiveImage(first);
      }
    }
  }, [isRaffle, product]);
  const [size, setSize] = useState<string>("M");
  const sizes = ["XS", "S", "M", "L", "XL", "2XL"];

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-8 flex items-center justify-between">
          <Link href="/shop" className="text-sm underline">← Back to shop</Link>
        </header>

        {!product ? (
          <div className="text-center py-20">
            <p className="text-lg">Product not found.</p>
            <Link href="/shop" className="mt-4 inline-block underline">Back to shop</Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Gallery */}
              <div>
                <div className="relative w-full aspect-square rounded-xl bg-white ring-1 ring-gray-200 overflow-hidden">
                  {activeImage && (
                    <Media src={activeImage} alt={product.name} className={`object-contain ${product.id === "p7" ? "scale-[1.3] md:scale-[1.4] object-[60%_50%]" : ""}`} />
                  )}
                </div>
                {/* Thumbs */}
                <div className="mt-4 grid grid-cols-4 gap-3">
                  {displayedMedia.map((m, i) => {
                    const url = mediaUrl(m);
                    const showLabel = isBoxLogo && (i === 0 || i === 1);
                    const label = i === 0 ? "Front view" : i === 1 ? "Back view" : "";
                    return (
                      <div key={i} className="flex flex-col items-center">
                        <button
                          className={`relative aspect-square w-full rounded-lg ring-1 ${activeImage === url ? "ring-black" : "ring-gray-200"} overflow-hidden bg-gray-100`}
                          onClick={() => setActiveImage(url)}
                        >
                          <Media src={url} alt={`${product.name} ${i + 1}`} className={`object-cover ${product.id === "p7" ? "scale-[1.3] md:scale-[1.4] object-[60%_60%]" : ""}`} />
                        </button>
                        {showLabel && (
                          <span className="mt-1 text-xs text-gray-600">{label}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Info */}
              <div>
                <h1 className="text-2xl font-semibold mb-2">{product.name}</h1>
                <p className="text-sm text-gray-700 mb-4">{product.description || product.category}</p>

                {product.variants?.length ? (
                  <div className="mb-6">
                    <label className="text-sm font-medium">Color</label>
                    <div className="mt-2 flex gap-2">
                      {product.variants.map(v => (
                        <button key={v.id}
                          onClick={() => {
                            setActiveVariantId(v.id);
                            const first = v.media?.[0] ? mediaUrl(v.media[0]) : "";
                            if (first) setActiveImage(first);
                          }}
                          className={`h-9 rounded-full px-3 text-xs font-medium ring-1 transition ${activeVariantId === v.id ? "bg-black text-white ring-black/20" : "bg-gray-100 text-black ring-gray-300 hover:bg-gray-200"}`}>
                          {v.color}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Size selector - only show for tees and hoodies */}
                {(product.category === "tee" || product.category === "hoodie") && (
                  <div className="mb-6">
                    <label className="text-sm font-medium">Size</label>
                    <select value={size} onChange={(e) => setSize(e.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2">
                      {sizes.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <details className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <summary className="cursor-pointer text-sm font-medium">Size chart</summary>
                      <div className="mt-2 text-xs text-gray-700">
                        <div className="grid grid-cols-6 gap-2">
                          <div className="font-semibold">Size</div>
                          <div className="font-semibold">Chest (in)</div>
                          <div className="font-semibold">Length (in)</div>
                          <div className="font-semibold">Shoulder (in)</div>
                          <div className="font-semibold">Sleeve (in)</div>
                          <div className="font-semibold">Waist (in)</div>
                          {sizes.map(s => (
                            <div key={s} className="contents">
                              <div>{s}</div>
                              <div>18–24</div>
                              <div>26–32</div>
                              <div>16–22</div>
                              <div>7–9</div>
                              <div>28–38</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </details>
                  </div>
                )}

                {/* CTA */}
                {isRaffle ? (
                  <button
                    onClick={() => {
                      const selectedColor = activeVariantId ? product.variants?.find(v => v.id === activeVariantId)?.color || 'Black' : 'Black';
                      const sizeParam = (product.category === "tee" || product.category === "hoodie") ? `&size=${encodeURIComponent(size)}` : '';
                      const checkoutUrl = `/checkout?quantity=1&product=${product.id}&variant=${activeVariantId || 'raffle-blk'}&color=${encodeURIComponent(selectedColor)}&type=direct${sizeParam}`;
                      window.location.href = checkoutUrl;
                    }}
                    className="w-full rounded-full bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-black/90"
                  >
                    Buy $100
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button className="rounded-full bg-black text-white px-6 py-3 text-sm font-medium disabled:opacity-60" disabled>
                      {product.status === "available" ? "Add to Cart" : "Sold Out"}
                    </button>
                    <Link href="/shop" className="rounded-full border border-gray-300 bg-gray-100 px-6 py-3 text-sm font-medium text-black hover:bg-gray-200">Back</Link>
                  </div>
                )}
              </div>
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
          </>
        )}
      </div>
    </main>
  );
}
