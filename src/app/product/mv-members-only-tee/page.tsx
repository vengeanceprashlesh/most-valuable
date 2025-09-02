"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { products } from "@/data/products";

function mediaUrl(path: string) {
  if (path.startsWith("/media/")) {
    return path.replace("/media/", "/socoldblooded-attachments/");
  }
  return path;
}

export default function MVMembersOnlyTeePage() {
  // Find the MV Members Only Tee product
  const product = products.find(p => p.id === "mv-tee");
  
  const [selectedVariant, setSelectedVariant] = useState(product?.variants?.[0] || null);
  const [selectedSize, setSelectedSize] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  if (!product) {
    return <div>Product not found</div>;
  }

  const sizes = ["S", "M", "L", "XL", "XXL"];

  const handleBuyNow = () => {
    if (!selectedVariant || !selectedSize) {
      alert("Please select both color and size");
      return;
    }
    
    setIsLoading(true);
    
    // Construct checkout URL with direct purchase parameters
    const params = new URLSearchParams({
      product: product.id,
      variant: selectedVariant.id,
      color: selectedVariant.color,
      size: selectedSize,
      type: "direct"
    });
    
    window.location.href = `/checkout?${params.toString()}`;
  };

  const currentMedia = selectedVariant?.media?.[0] || product.media?.[0] || "";

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/shop" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
            ← Back to Shop
          </Link>
        </div>
      </div>

      {/* Product Details */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start">
          {/* Product Image */}
          <div className="flex flex-col">
            <div className="w-full aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {currentMedia && (
                <Image
                  src={mediaUrl(currentMedia)}
                  alt={product.name}
                  width={600}
                  height={600}
                  className="w-full h-full object-cover"
                  priority
                />
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="mt-8 lg:mt-0">
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            <p className="mt-3 text-3xl font-bold text-gray-900">{product.price}</p>
            
            {product.description && (
              <div className="mt-6">
                <p className="text-gray-700">{product.description}</p>
              </div>
            )}

            {/* Color Selection */}
            {product.variants && product.variants.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900">Color</h3>
                <div className="mt-3 flex space-x-3">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg border-2 transition-colors ${
                        selectedVariant?.id === variant.id
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-300 bg-white text-gray-900 hover:border-gray-400"
                      }`}
                    >
                      {variant.color}
                    </button>
                  ))}
                </div>
                {selectedVariant && (
                  <p className="mt-2 text-sm text-gray-600">
                    Selected: {selectedVariant.color}
                  </p>
                )}
              </div>
            )}

            {/* Size Selection */}
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900">Size</h3>
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`py-2 text-sm font-medium rounded-lg border-2 transition-colors ${
                      selectedSize === size
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-300 bg-white text-gray-900 hover:border-gray-400"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {selectedSize && <p className="mt-2 text-sm text-gray-600">Selected: {selectedSize}</p>}
            </div>

            {/* Buy Button */}
            <div className="mt-8">
              <button
                onClick={handleBuyNow}
                disabled={isLoading || !selectedVariant || !selectedSize}
                className={`w-full py-3 px-8 rounded-lg text-lg font-medium transition-colors ${
                  isLoading || !selectedVariant || !selectedSize
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-black text-white hover:bg-gray-800"
                }`}
              >
                {isLoading ? "Processing..." : `Buy Now - ${product.price}`}
              </button>
            </div>


            {/* Shipping Info */}
            <div className="mt-8 border-t border-gray-200 pt-8">
              <h3 className="text-lg font-medium text-gray-900">Shipping</h3>
              <p className="mt-2 text-sm text-gray-600">
                Free shipping on all orders. Please allow up to 4 weeks for delivery due to high demand.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
