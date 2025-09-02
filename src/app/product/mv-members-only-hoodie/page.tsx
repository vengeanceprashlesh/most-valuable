"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { products } from "@/data/products";
import InstagramLink from "@/components/InstagramLink";

export default function MVHoodieProductPage() {
  const [selectedVariant, setSelectedVariant] = useState("mv-hoodie-blk");
  const [selectedSize, setSelectedSize] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Find the product
  const product = products.find(p => p.slug === "mv-members-only-hoodie");
  
  if (!product) {
    return <div>Product not found</div>;
  }

  const currentVariant = product.variants?.find(v => v.id === selectedVariant);
  const currentImage = currentVariant?.media[0] || product.media?.[0] || "";

  const sizes = ["S", "M", "L", "XL", "XXL"];

  const handlePurchase = async () => {
    if (!selectedSize) {
      alert("Please select a size");
      return;
    }

    setIsLoading(true);
    
    // Redirect to checkout with product info
    const params = new URLSearchParams({
      product: product.id,
      variant: selectedVariant,
      size: selectedSize,
      type: "direct"
    });
    
    window.location.href = `/checkout?${params.toString()}`;
  };

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Navigation */}
        <div className="mb-8 flex items-center text-sm">
          <Link href="/shop" className="text-gray-600 hover:text-black">
            Shop
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-black">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Product Image */}
          <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
            <Image
              src={currentImage}
              alt={`${product.name} - ${currentVariant?.color || "Default"}`}
              width={600}
              height={600}
              className="h-full w-full object-contain"
              priority
            />
          </div>

          {/* Product Details */}
          <div className="flex flex-col">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-black">{product.name}</h1>
              <p className="mt-2 text-2xl font-medium text-black">{product.price}</p>
              <p className="mt-4 text-gray-600">{product.description}</p>
            </div>

            {/* Color Selection */}
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-medium text-black">Color</h3>
              <div className="flex gap-2">
                {product.variants?.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant.id)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      selectedVariant === variant.id
                        ? "bg-black text-white"
                        : "bg-gray-100 text-black hover:bg-gray-200"
                    }`}
                  >
                    {variant.color}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Selection */}
            <div className="mb-8">
              <h3 className="mb-3 text-sm font-medium text-black">Size</h3>
              <div className="grid grid-cols-5 gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`rounded-lg border-2 py-3 text-center text-sm font-medium transition ${
                      selectedSize === size
                        ? "border-black bg-black text-white"
                        : "border-gray-300 bg-white text-black hover:border-gray-400"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Purchase Button */}
            <button
              onClick={handlePurchase}
              disabled={!selectedSize || isLoading}
              className="w-full rounded-full bg-black py-4 text-lg font-medium text-white transition hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? "Processing..." : `Add to Cart — ${product.price}`}
            </button>

            {/* Shipping Info */}
            <div className="mt-8 border-t border-gray-200 pt-8">
              <h3 className="text-lg font-medium text-black">Shipping</h3>
              <p className="mt-2 text-sm text-gray-600">
                Free shipping on all orders. Please allow up to 4 weeks for delivery due to high demand.
              </p>
            </div>
          </div>
        </div>

        {/* Instagram Link */}
        <div className="mt-16 flex justify-center">
          <div className="rounded-2xl bg-white/80 border border-gray-200 px-6 py-4 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="text-center">
              <p className="mb-3 text-sm text-gray-600">Connect with us</p>
              <InstagramLink size="lg" className="justify-center" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
