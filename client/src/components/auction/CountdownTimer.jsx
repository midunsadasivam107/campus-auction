import { useState, useEffect } from 'react';

/**
 * Live countdown timer component
 * Computes remaining time to target date, ticks every second.
 * Visually turns amber if < 10 mins, red if < 60 seconds.
 */
function CountdownTimer({ targetDate, onEnd, className = '' }) {
  const calculateTimeLeft = () => {
    if (!targetDate) return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0, isEnded: true };
    const difference = new Date(targetDate).getTime() - Date.now();

    if (difference <= 0) {
      return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0, isEnded: true };
    }

    return {
      total: difference,
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      isEnded: false,
    };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft);

  useEffect(() => {
    const timer = setInterval(() => {
      const nextTime = calculateTimeLeft();
      setTimeLeft(nextTime);

      if (nextTime.isEnded) {
        clearInterval(timer);
        if (onEnd) onEnd();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (timeLeft.isEnded) {
    return (
      <span className={`inline-flex items-center font-semibold text-slate-500 ${className}`}>
        ⏱️ Ended
      </span>
    );
  }

  // Format parts
  const isUrgent = timeLeft.total <= 60 * 1000; // < 60s
  const isWarning = timeLeft.total <= 10 * 60 * 1000; // < 10m

  let colorClass = 'text-zinc-300 bg-zinc-900 border border-zinc-800';
  if (isUrgent) {
    colorClass = 'text-red-300 bg-red-950/90 border border-red-600 animate-pulse font-bold';
  } else if (isWarning) {
    colorClass = 'text-amber-300 bg-amber-950/70 border border-amber-800/60 font-semibold';
  }

  const pad = (n) => String(n).padStart(2, '0');

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-mono ${colorClass} ${className}`}>
      <span>⏰</span>
      {timeLeft.days > 0 && <span>{timeLeft.days}d </span>}
      <span>{pad(timeLeft.hours)}h </span>
      <span>{pad(timeLeft.minutes)}m </span>
      <span>{pad(timeLeft.seconds)}s</span>
    </span>
  );
}

export default CountdownTimer;
