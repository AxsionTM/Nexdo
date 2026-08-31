'use client';

import { cn } from '@/lib/utils';

export function Logo({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      aria-label="TaskFlow"
    >
      <defs>
        <linearGradient id="tf-grad" x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#60A5FA" />
          <stop offset="0.45" stopColor="#3B82F6" />
          <stop offset="1" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="tf-shine" x1="20" y1="8" x2="44" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <filter id="tf-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#1D4ED8" floodOpacity="0.45" />
        </filter>
      </defs>
      <path
        d="M32 4L56 18V46L32 60L8 46V18L32 4Z"
        fill="url(#tf-grad)"
        filter="url(#tf-shadow)"
      />
      <path
        d="M32 8L52 19.5V44.5L32 56L12 44.5V19.5L32 8Z"
        fill="url(#tf-shine)"
        opacity="0.35"
      />
      {/* T */}
      <path
        d="M22 22H42V26.5H34.5V42H29.5V26.5H22V22Z"
        fill="white"
        fillOpacity="0.95"
      />
      {/* F simplified as bar */}
      <path
        d="M22 22H42V26.5H34.5"
        fill="none"
      />
    </svg>
  );
}
