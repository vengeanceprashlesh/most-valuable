import Image from "next/image";
export default function RootLoading() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-5">
        {/* Brand Logo */}
        <Image src="/shopPageLogo.png" alt="Most Valuable" width={256} height={80} className="h-16 w-auto opacity-95 animate-pulse" priority />
        {/* Simple spinner */}
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-black border-t-transparent" aria-label="Loading" />
      </div>
    </div>
  );
}
