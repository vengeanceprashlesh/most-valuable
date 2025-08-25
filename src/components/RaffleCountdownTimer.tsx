"use client";

import { useQuery } from "convex/react";
import { useState, useEffect } from "react";
import { api } from "../../convex/_generated/api";

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export function RaffleCountdownTimer({ className }: { className?: string }) {
  // Use robust stats that calculate from real data (prevents sync issues)
  const raffleConfig = useQuery(api.payments.getRaffleConfig);
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
  });
  const [isMounted, setIsMounted] = useState(false);

  // Prevent hydration mismatch by only showing real timer after client mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!raffleConfig) return;

    const updateTimer = () => {
      const now = Date.now();
      const timerStart = raffleConfig.timerDisplayDate || raffleConfig.startDate;
      
      // If timer hasn't started yet, show time until it starts
      if (now < timerStart) {
        const timeToStart = timerStart - now;
        const seconds = Math.floor((timeToStart / 1000) % 60);
        const minutes = Math.floor((timeToStart / 1000 / 60) % 60);
        const hours = Math.floor((timeToStart / (1000 * 60 * 60)) % 24);
        const days = Math.floor(timeToStart / (1000 * 60 * 60 * 24));
        
        setTimeRemaining({ days, hours, minutes, seconds, total: timeToStart });
        return;
      }
      
      // Timer has started, show time until end
      const total = raffleConfig.endDate - now;

      if (total <= 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
        return;
      }

      const seconds = Math.floor((total / 1000) % 60);
      const minutes = Math.floor((total / 1000 / 60) % 60);
      const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
      const days = Math.floor(total / (1000 * 60 * 60 * 24));

      setTimeRemaining({ days, hours, minutes, seconds, total });
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [raffleConfig]);

  if (!raffleConfig) {
    return (
      <div className={`flex items-center gap-2 ${className || ''}`}>
        <div className="h-8 w-20 bg-black/10 rounded animate-pulse" />
        <div className="h-6 w-32 bg-black/10 rounded animate-pulse" />
      </div>
    );
  }

  const now = Date.now();
  const timerStart = raffleConfig.timerDisplayDate || raffleConfig.startDate;
  const isTimerStarted = now >= timerStart;
  const isActive = raffleConfig.isActive && timeRemaining.total > 0;
  const hasEnded = timeRemaining.total <= 0 && isTimerStarted;

  if (hasEnded) {
    return (
      <div className={`flex items-center gap-2 text-black ${className || ''}`}>
        <div className="flex items-center gap-1">
          <span className="text-lg">🏁</span>
          <span className="text-sm font-medium">Raffle Ended</span>
        </div>
        {raffleConfig.hasWinner && (
          <div className="text-xs bg-green-500/10 text-green-700 px-2 py-1 rounded-full">
            Winner Selected
          </div>
        )}
      </div>
    );
  }

  if (!isActive) {
    return (
      <div className={`flex items-center gap-2 text-black/70 ${className || ''}`}>
        <span className="text-lg">⏸️</span>
        <span className="text-sm font-medium">Raffle Inactive</span>
      </div>
    );
  }

  // Show "Starts Soon" if timer hasn't started yet but payments are accepted
  if (!isTimerStarted) {
    return (
      <div className={`flex items-center gap-2 text-black ${className || ''}`}>
        <div className="flex items-center gap-1">
          <span className="text-base sm:text-lg animate-pulse">🌟</span>
          <span className="text-xs sm:text-sm font-medium text-black">
            Starts Soon
          </span>
        </div>
        <div className="text-xs bg-yellow-500/10 text-yellow-700 px-2 py-1 rounded-full">
          Aug 31st
        </div>
      </div>
    );
  }

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  // Show static placeholder during SSR to prevent hydration mismatch
  if (!isMounted) {
    return (
      <div className={`flex items-center gap-2 sm:gap-3 text-black ${className || ''}`}>
        <div className="flex items-center gap-1">
          <span className="text-base sm:text-lg">⏰</span>
          <span className="text-xs sm:text-sm font-medium text-black hidden sm:inline">
            Ends in
          </span>
        </div>
        <div className="flex items-center gap-0.5 sm:gap-1 text-black">
          <div className="text-center min-w-[1.5rem] sm:min-w-[2rem]">
            <div className="text-sm sm:text-lg font-bold font-mono leading-none">
              --
            </div>
            <div className="text-[8px] sm:text-[10px] text-black/60 uppercase tracking-wider">
              D
            </div>
          </div>
          <span className="text-black/40 text-xs sm:text-sm">:</span>
          <div className="text-center min-w-[1.5rem] sm:min-w-[2rem]">
            <div className="text-sm sm:text-lg font-bold font-mono leading-none">
              --
            </div>
            <div className="text-[8px] sm:text-[10px] text-black/60 uppercase tracking-wider">
              H
            </div>
          </div>
          <span className="text-black/40 text-xs sm:text-sm">:</span>
          <div className="text-center min-w-[1.5rem] sm:min-w-[2rem]">
            <div className="text-sm sm:text-lg font-bold font-mono leading-none">
              --
            </div>
            <div className="text-[8px] sm:text-[10px] text-black/60 uppercase tracking-wider">
              M
            </div>
          </div>
          <span className="text-black/40 text-xs sm:text-sm">:</span>
          <div className="text-center min-w-[1.5rem] sm:min-w-[2rem]">
            <div className="text-sm sm:text-lg font-bold font-mono leading-none">
              --
            </div>
            <div className="text-[8px] sm:text-[10px] text-black/60 uppercase tracking-wider">
              S
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 sm:gap-3 text-black ${className || ''}`}>
      {/* Timer Icon */}
      <div className="flex items-center gap-1">
        <span className="text-base sm:text-lg animate-pulse">⏰</span>
        <span className="text-xs sm:text-sm font-medium text-black hidden sm:inline">
          Ends in
        </span>
      </div>

      {/* Countdown Display */}
      <div className="flex items-center gap-0.5 sm:gap-1 text-black">
        {/* Days */}
        {timeRemaining.days > 0 && (
          <>
            <div className="text-center min-w-[1.5rem] sm:min-w-[2rem]">
              <div className="text-sm sm:text-lg font-bold font-mono leading-none">
                {formatNumber(timeRemaining.days)}
              </div>
              <div className="text-[8px] sm:text-[10px] text-black uppercase tracking-wider">
                D
              </div>
            </div>
            <span className="text-black/40 text-xs sm:text-sm">:</span>
          </>
        )}

        {/* Hours */}
        <div className="text-center min-w-[1.5rem] sm:min-w-[2rem]">
          <div className="text-sm sm:text-lg font-bold font-mono leading-none">
            {formatNumber(timeRemaining.hours)}
          </div>
          <div className="text-[8px] sm:text-[10px] text-black/60 uppercase tracking-wider">
            H
          </div>
        </div>
        
        <span className="text-black/40 text-xs sm:text-sm">:</span>

        {/* Minutes */}
        <div className="text-center min-w-[1.5rem] sm:min-w-[2rem]">
          <div className="text-sm sm:text-lg font-bold font-mono leading-none">
            {formatNumber(timeRemaining.minutes)}
          </div>
          <div className="text-[8px] sm:text-[10px] text-black/60 uppercase tracking-wider">
            M
          </div>
        </div>

        <span className="text-black/40 text-xs sm:text-sm">:</span>

        {/* Seconds */}
        <div className="text-center min-w-[1.5rem] sm:min-w-[2rem]">
          <div className="text-sm sm:text-lg font-bold font-mono leading-none">
            {formatNumber(timeRemaining.seconds)}
          </div>
          <div className="text-[8px] sm:text-[10px] text-black/60 uppercase tracking-wider">
            S
          </div>
        </div>
      </div>

      {/* Entry Count (optional) */}
      {raffleConfig.totalEntries > 0 && (
        <div className="hidden lg:flex items-center gap-1 ml-2 text-black/60 border-l border-gray-300 pl-3">
          <span className="text-xs">🎫</span>
          <span className="text-xs font-medium">
            {raffleConfig.totalEntries} entries
          </span>
        </div>
      )}
    </div>
  );
}

export default RaffleCountdownTimer;
