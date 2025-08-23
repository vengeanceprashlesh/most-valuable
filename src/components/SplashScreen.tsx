"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

// A global splash overlay that shows on initial load and on every route change
// Shows for a fixed duration to create a smooth branded transition
export default function SplashScreen({ durationMs = 1500 }: { durationMs?: number }) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true); // show on first paint
  const prevPathRef = useRef<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  // Clear any pending timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  // Initial splash on first load
  useEffect(() => {
    // Hide after initial duration
    timeoutRef.current = window.setTimeout(() => setVisible(false), durationMs);
    prevPathRef.current = pathname;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show splash on path changes
  useEffect(() => {
    if (prevPathRef.current === null) {
      prevPathRef.current = pathname;
      return;
    }
    if (pathname !== prevPathRef.current) {
      // Path changed: show overlay, then hide after duration
      setVisible(true);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setVisible(false), durationMs);
      prevPathRef.current = pathname;
    }
  }, [pathname, durationMs]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-6">
        <Image src="/shopPageLogo.png" alt="Most Valuable" width={640} height={200} className="h-56 sm:h-72 md:h-80 lg:h-96 xl:h-[28rem] w-auto opacity-95 animate-pulse" priority />
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-black border-t-transparent" aria-label="Loading" />
      </div>
    </div>
  );
}
