import Image from "next/image";
import Link from "next/link";

interface CheckoutHeaderProps {
    title?: string;
    subtitle?: string;
}

export function CheckoutHeader({
    title = "Complete Your Purchase",
    subtitle = "Provide your contact details and shipping address to ensure secure delivery of your Gold Rush collection items"
}: CheckoutHeaderProps) {
    return (
        <div className="relative z-10 px-6 py-6">
            <div className="max-w-7xl mx-auto">
                <div className="text-center">
                    <Link href="/shop" className="inline-flex items-center mb-4">
                        <Image
                            src="/LogoWhite.png"
                            alt="MV logo"
                            width={200}
                            height={56}
                            className="h-10 w-auto"
                            priority
                        />
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">
                        {title}
                    </h1>
                    <p className="text-slate-300 text-sm max-w-2xl mx-auto">
                        {subtitle}
                    </p>
                </div>
            </div>
        </div>
    );
}
