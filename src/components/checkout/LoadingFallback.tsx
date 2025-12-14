export function LoadingFallback() {
    return (
        <div className="min-h-screen flex items-center justify-center text-white bg-black">
            <div className="text-center">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                <p>Loading...</p>
            </div>
        </div>
    );
}
