"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface RaffleStatus {
  startDate: number;
  endDate: number;
  currentTime: number;
  hasEnded: boolean;
  hasWinner: boolean;
  winnerEmail: string | null;
  winnerSelectedAt: number | null;
  totalUniqueLeads: number;
  timeRemaining: number;
}

interface WinnerSelectionResult {
  success: boolean;
  message: string;
  winner: {
    email: string;
    selectedAt: number;
    totalLeadsCount: number;
  } | null;
  alreadySelected: boolean;
  error?: string;
}

export default function WinnerPage() {
  const [raffleStatus, setRaffleStatus] = useState<RaffleStatus | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [winnerResult, setWinnerResult] = useState<WinnerSelectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch raffle status
  const fetchRaffleStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/raffle/status");
      if (response.ok) {
        const data = await response.json();
        setRaffleStatus(data);
        setTimeRemaining(data.timeRemaining);
        setError(null);
      } else {
        setError("Failed to fetch raffle status");
      }
    } catch (err) {
      setError("Network error occurred");
      console.error("Error fetching raffle status:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check and select winner if raffle has ended
  const checkForWinner = useCallback(async () => {
    if (!raffleStatus?.hasEnded || raffleStatus.hasWinner) return;
    setChecking(true);
    try {
      const response = await fetch("/api/raffle/check-winner", {
        method: "POST",
      });
      const result: WinnerSelectionResult = await response.json();
      setWinnerResult(result);
      if (result.success && result.winner) {
        await fetchRaffleStatus();
      }
    } catch (err) {
      console.error("Error checking for winner:", err);
    } finally {
      setChecking(false);
    }
  }, [raffleStatus?.hasEnded, raffleStatus?.hasWinner, fetchRaffleStatus]);

  // Update countdown timer
  useEffect(() => {
    if (!raffleStatus || raffleStatus.hasEnded) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, raffleStatus.endDate - now);
      setTimeRemaining(remaining);
      
      // If timer just ended, trigger winner selection
      if (remaining === 0) {
        fetchRaffleStatus();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [raffleStatus, fetchRaffleStatus]);

  // Initial load and periodic refresh
  useEffect(() => {
    fetchRaffleStatus();
    const interval = setInterval(fetchRaffleStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchRaffleStatus]);

  // Auto-check for winner when raffle ends
  useEffect(() => {
    if (raffleStatus?.hasEnded && !raffleStatus.hasWinner && !checking && !winnerResult) {
      checkForWinner();
    }
  }, [raffleStatus?.hasEnded, raffleStatus?.hasWinner, checking, winnerResult, checkForWinner]);

  // Format time remaining
  const formatTime = (ms: number) => {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading raffle status...</p>
        </div>
      </div>
    );
  }

  if (error || !raffleStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-md p-6 bg-white rounded-lg shadow-lg text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Error Loading Raffle</h1>
          <p className="text-slate-600 mb-4">{error || "Failed to load raffle information"}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchRaffleStatus();
            }}
            className="bg-black text-white px-4 py-2 rounded-full hover:bg-slate-800 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-nowrap justify-between items-center">
          <Link href="/" className="flex items-center flex-shrink-0">
            <Image
              src="/logoBlack.png"
              alt="Raffel logo"
              width={40}
              height={40}
              className="rounded-md"
            />
            <span className="ml-3 text-xl font-bold text-slate-900 whitespace-nowrap">Raffel</span>
          </Link>
          <nav className="flex items-center gap-6 flex-nowrap">
            <Link
              href="/shop"
              className="text-slate-600 hover:text-slate-900 transition whitespace-nowrap"
            >
              Shop
            </Link>
            <Link
              href="/"
              className="bg-black text-white px-4 py-2 rounded-full text-sm hover:bg-slate-800 transition whitespace-nowrap"
            >
              Join Raffle
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">🎉 Free Raffle Winner</h1>
          <p className="text-xl text-slate-600">
            22-day countdown raffle • One winner selected automatically
          </p>
        </div>

        {/* Raffle Status Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left Side - Status */}
            <div>
              {!raffleStatus.hasEnded ? (
                <>
                  <div className="text-6xl mb-4">⏰</div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">Raffle Active</h2>
                  <p className="text-slate-600 mb-6">
                    The winner will be selected automatically when the timer reaches zero.
                  </p>
                  
                  {/* Countdown Timer */}
                  <div className="bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl p-6">
                    <p className="text-sm font-medium text-slate-700 mb-2">Time Remaining:</p>
                    <div className="text-3xl font-mono font-bold text-slate-900">
                      {formatTime(timeRemaining)}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-6xl mb-4">🏁</div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">Raffle Ended</h2>
                  <p className="text-slate-600 mb-4">
                    The raffle ended on {formatDate(raffleStatus.endDate)}
                  </p>
                  
                  {checking && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600 mr-3"></div>
                        <p className="text-yellow-800 font-medium">Selecting winner...</p>
                      </div>
                    </div>
                  )}
                  
                  {winnerResult && !winnerResult.success && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <p className="text-red-800">
                        <strong>Error:</strong> {winnerResult.error}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Right Side - Winner or Stats */}
            <div>
              {raffleStatus.hasWinner && raffleStatus.winnerEmail ? (
                <>
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-2xl font-bold text-green-700 mb-4">Winner Selected!</h3>
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                    <p className="text-green-800 text-lg font-medium mb-2">
                      🏆 {raffleStatus.winnerEmail}
                    </p>
                    <p className="text-green-700 text-sm">
                      Selected on {formatDate(raffleStatus.winnerSelectedAt!)}
                    </p>
                    <p className="text-green-600 text-sm mt-1">
                      Randomly chosen from {raffleStatus.totalUniqueLeads} unique participants
                    </p>
                  </div>
                </>
              ) : raffleStatus.hasEnded && raffleStatus.totalUniqueLeads === 0 ? (
                <>
                  <div className="text-6xl mb-4">😔</div>
                  <h3 className="text-2xl font-bold text-slate-700 mb-4">No Participants</h3>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                    <p className="text-slate-600">
                      Unfortunately, no one entered this raffle.
                    </p>
                    <Link
                      href="/"
                      className="inline-block mt-3 bg-black text-white px-4 py-2 rounded-full text-sm hover:bg-slate-800 transition"
                    >
                      Join Next Raffle
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-6xl mb-4">📊</div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">Raffle Stats</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-slate-200">
                      <span className="text-slate-600">Total Participants:</span>
                      <span className="font-bold text-slate-900">{raffleStatus.totalUniqueLeads}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-200">
                      <span className="text-slate-600">Started:</span>
                      <span className="font-medium text-slate-900">
                        {formatDate(raffleStatus.startDate)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-slate-600">Ends:</span>
                      <span className="font-medium text-slate-900">
                        {formatDate(raffleStatus.endDate)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Call to Action */}
        {!raffleStatus.hasEnded && (
          <div className="text-center">
            <p className="text-slate-600 mb-6">
              Want to join? Enter your email and phone number to participate in the raffle!
            </p>
            <Link
              href="/"
              className="inline-flex items-center bg-black text-white px-8 py-3 rounded-full font-medium hover:bg-slate-800 transition"
            >
              Join Free Raffle
              <span className="ml-2">→</span>
            </Link>
          </div>
        )}

        {/* Admin controls removed for production UI */}
      </main>
    </div>
  );
}
